<?php
// Letak file: backend/api/update_schedule.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { 
    http_response_code(200); 
    exit(); 
}

// Mencegah error PHP bocor dan merusak format JSON
ini_set('display_errors', 0); 

require_once '../config/koneksi.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input['trx_id'])) {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "ID transaksi tidak ditemukan"]);
    exit();
}

$trx_id = (int)$input['trx_id'];
$has_datetime = !empty($input['new_date']) && !empty($input['new_time']);
$has_status = !empty($input['status_jadwal']);

if (!$has_datetime && !$has_status) {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "Tidak ada data perubahan tanggal atau status yang dikirimkan"]);
    exit();
}

// Validasi ENUM status_jadwal: ('Menunggu','Diproses','Selesai','Dibatalkan')
$allowed_statuses = ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'];
if ($has_status && !in_array($input['status_jadwal'], $allowed_statuses)) {
    http_response_code(400);
    echo json_encode([
        "status" => 400, 
        "message" => "Status jadwal tidak valid. Pilihan: 'Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'"
    ]);
    exit();
}

try {
    // 1. Ambil data janji temu lama
    $stmtGet = $conn->prepare("
        SELECT id, id_therapist, waktu_reservasi, status_jadwal, nama_pasien, catatan_terapis 
        FROM appointments 
        WHERE id = ? AND deleted_at IS NULL
    ");
    $stmtGet->execute([$trx_id]);
    $appointment = $stmtGet->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        throw new Exception("Reservasi tidak ditemukan atau sudah dihapus");
    }

    $id_therapist = $appointment['id_therapist'];
    $old_waktu_reservasi = $appointment['waktu_reservasi'] ?: 'Belum diatur';
    $old_status_jadwal = $appointment['status_jadwal'];
    $old_catatan_terapis = $appointment['catatan_terapis'] ?: '';

    // Validasi aturan bisnis: Layanan yang sudah 'Selesai' tidak dapat diubah statusnya dan tidak dapat di-reschedule lagi
    if ($old_status_jadwal === 'Selesai') {
        throw new Exception("Layanan ini sudah 'Selesai'. Jadwal dan status telah terkunci permanen sehingga tidak dapat diubah atau di-reschedule kembali.");
    }

    $new_datetime = $has_datetime ? ($input['new_date'] . ' ' . $input['new_time'] . ':00') : $appointment['waktu_reservasi'];
    $new_status_jadwal = $has_status ? $input['status_jadwal'] : $old_status_jadwal;
    $alasan_batal = isset($input['alasan_batal']) ? trim($input['alasan_batal']) : '';

    // Validasi aturan bisnis: Layanan yang sedang 'Diproses' terkunci penuh.
    // Hanya boleh maju ke 'Selesai'; reschedule, pembatalan, dan kembalikan ke 'Menunggu' ditolak.
    if ($old_status_jadwal === 'Diproses') {
        if ($has_datetime) {
            throw new Exception("Layanan sedang 'Diproses'. Jadwal tidak dapat di-reschedule.");
        }
        if ($new_status_jadwal === 'Dibatalkan') {
            throw new Exception("Layanan sedang 'Diproses' sehingga tidak dapat dibatalkan.");
        }
        if ($new_status_jadwal === 'Menunggu') {
            throw new Exception("Layanan sedang 'Diproses' sehingga tidak dapat dikembalikan ke status 'Menunggu'.");
        }
    }

    // Validasi waktu tidak boleh mundur (hanya jika tanggal/waktu diubah)
    if ($has_datetime && strtotime($new_datetime) < strtotime(date('Y-m-d H:i:s'))) {
        throw new Exception("Gagal: Waktu pelayanan tidak boleh di masa lalu. Silakan pilih waktu saat ini atau di masa depan.");
    }

    // 2. Cek Overlap jika status BUKAN 'Dibatalkan'
    // Cek hanya dilakukan jika:
    // a. Tanggal/waktu berubah, ATAU
    // b. Jadwal yang tadinya 'Dibatalkan' diaktifkan kembali menjadi status aktif
    if ($new_status_jadwal !== 'Dibatalkan' && ($new_datetime !== $appointment['waktu_reservasi'] || $old_status_jadwal === 'Dibatalkan')) {
        $stmtCheck = $conn->prepare("
            SELECT id FROM appointments 
            WHERE id_therapist = :id_therapist 
            AND id != :id_target
            AND status_jadwal NOT IN ('Dibatalkan', 'Selesai')
            AND deleted_at IS NULL
            AND waktu_reservasi > DATE_SUB(:dt1, INTERVAL 1 HOUR)
            AND waktu_reservasi < DATE_ADD(:dt2, INTERVAL 1 HOUR)
        ");
        
        $stmtCheck->execute([
            ':id_therapist' => $id_therapist,
            ':id_target' => $trx_id,
            ':dt1' => $new_datetime,
            ':dt2' => $new_datetime
        ]);

        if ($stmtCheck->fetch()) {
            throw new Exception("Terapis sudah memiliki jadwal aktif lain pada rentang waktu tersebut (Batas aman 1 jam)");
        }
    }

    // 3. Kelola catatan pembatalan jika ada
    $new_catatan_terapis = $old_catatan_terapis;
    if ($new_status_jadwal === 'Dibatalkan' && !empty($alasan_batal)) {
        $timestamp = date('d/m/Y H:i');
        $cancelNote = "[Dibatalkan {$timestamp}: {$alasan_batal}]";
        $new_catatan_terapis = !empty($old_catatan_terapis) 
            ? ($old_catatan_terapis . "\n" . $cancelNote) 
            : $cancelNote;
    }

    // 4. Update Database
    $stmtUpdate = $conn->prepare("
        UPDATE appointments 
        SET waktu_reservasi = :waktu_reservasi,
            status_jadwal = :status_jadwal,
            catatan_terapis = :catatan_terapis
        WHERE id = :id
    ");
    $success = $stmtUpdate->execute([
        ':waktu_reservasi' => $new_datetime,
        ':status_jadwal' => $new_status_jadwal,
        ':catatan_terapis' => $new_catatan_terapis,
        ':id' => $trx_id
    ]);

    if (!$success) {
        throw new Exception("Gagal memperbarui data di database");
    }

    // 5. Catat ke Audit Log
    try {
        $user_id = isset($input['user_id']) ? (int)$input['user_id'] : 1; 

        $old_data = ['nama_pasien' => $appointment['nama_pasien']];
        $new_data = ['nama_pasien' => $appointment['nama_pasien']];

        if ($old_waktu_reservasi !== $new_datetime) {
            $old_data['waktu_reservasi'] = $old_waktu_reservasi;
            $new_data['waktu_reservasi'] = $new_datetime;
        }

        if ($old_status_jadwal !== $new_status_jadwal) {
            $old_data['status_jadwal'] = $old_status_jadwal;
            $new_data['status_jadwal'] = $new_status_jadwal;
        }

        if (!empty($alasan_batal)) {
            $new_data['alasan_pembatalan'] = $alasan_batal;
        }

        $old_data_json = json_encode($old_data, JSON_UNESCAPED_UNICODE);
        $new_data_json = json_encode($new_data, JSON_UNESCAPED_UNICODE);

        $stmtAudit = $conn->prepare("
            INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) 
            VALUES (?, 'update', 'appointments', ?, ?, ?)
        ");
        $stmtAudit->execute([$user_id, $trx_id, $old_data_json, $new_data_json]);
    } catch (Exception $logError) {
        // Abaikan error log agar update jadwal tetap sukses
    }

    // Buat pesan respons yang ramah
    if ($new_status_jadwal === 'Dibatalkan' && $old_status_jadwal !== 'Dibatalkan') {
        $message = "Layanan berhasil dibatalkan";
    } elseif ($old_status_jadwal === 'Dibatalkan' && $new_status_jadwal !== 'Dibatalkan') {
        $message = "Layanan berhasil diaktifkan kembali menjadi status " . $new_status_jadwal;
    } elseif ($has_status && $old_status_jadwal !== $new_status_jadwal && $has_datetime) {
        $message = "Jadwal dan status berhasil diperbarui";
    } elseif ($has_status && $old_status_jadwal !== $new_status_jadwal) {
        $message = "Status jadwal berhasil diubah menjadi " . $new_status_jadwal;
    } else {
        $message = "Jadwal berhasil diperbarui";
    }

    $jam_reservasi = date('H:i', strtotime($new_datetime));

    http_response_code(200);
    echo json_encode([
        "status" => 200, 
        "message" => $message,
        "data" => [
            "id" => $trx_id,
            "waktu_reservasi" => $new_datetime,
            "jam_reservasi" => $jam_reservasi,
            "status_jadwal" => $new_status_jadwal,
            "catatan_terapis" => $new_catatan_terapis
        ]
    ]);
    exit();

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => 400, 
        "message" => $e->getMessage()
    ]);
    exit();
}