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

if (!isset($input['trx_id']) || !isset($input['new_date']) || !isset($input['new_time'])) {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $trx_id = (int)$input['trx_id'];
    $new_date = $input['new_date'];
    $new_time = $input['new_time'];
    $new_datetime = $new_date . ' ' . $new_time . ':00';

    // 1. Ambil data terapis & data lama
    $stmtGet = $conn->prepare("SELECT id_therapist, waktu_reservasi FROM appointments WHERE id = ?");
    $stmtGet->execute([$trx_id]);
    $appointment = $stmtGet->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        throw new Exception("Reservasi tidak ditemukan");
    }

    $id_therapist = $appointment['id_therapist'];
    // Simpan jadwal lama ke dalam variabel (hindari null)
    $old_waktu_reservasi = $appointment['waktu_reservasi'] ? $appointment['waktu_reservasi'] : 'Belum diatur';

    // 2. Cek overlap
    $stmtCheck = $conn->prepare("
        SELECT id FROM appointments 
        WHERE id_therapist = :id_therapist 
        AND id != :id_target
        AND status_jadwal != 'Dibatalkan'
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
        throw new Exception("Terapis sudah memiliki jadwal lain pada rentang waktu tersebut (Batas aman 1 jam)");
    }

    // 3. Update data
    $stmtUpdate = $conn->prepare("
        UPDATE appointments 
        SET waktu_reservasi = ? 
        WHERE id = ?
    ");
    $success = $stmtUpdate->execute([$new_datetime, $trx_id]);

    if ($success) {
        // 4. Catat ke Audit Log
        try {
            $user_id = isset($input['user_id']) ? $input['user_id'] : 1; 
            
            // Format key JSON dirapikan agar muncul sempurna di Frontend
            $old_data_json = json_encode(['Waktu Reservasi' => $old_waktu_reservasi]);
            $new_data_json = json_encode(['Waktu Reservasi' => $new_datetime]);

            $stmtAudit = $conn->prepare("
                INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) 
                VALUES (?, 'update', 'appointments', ?, ?, ?)
            ");
            $stmtAudit->execute([$user_id, $trx_id, $old_data_json, $new_data_json]);
        } catch (Exception $logError) {
            // Error log sengaja ditelan agar jadwal tetap sukses diupdate
        }

        http_response_code(200);
        echo json_encode([
            "status" => 200, 
            "message" => "Jadwal berhasil diperbarui",
            "data" => [
                "waktu_reservasi" => $new_datetime,
                "jam_reservasi" => $new_time
            ]
        ]);
        
        // KUNCI PERBAIKAN: Hentikan eksekusi script agar tidak ada teks ekstra!
        exit(); 
        
    } else {
        throw new Exception("Gagal memperbarui database");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => 400, 
        "message" => $e->getMessage()
    ]);
    exit();
}