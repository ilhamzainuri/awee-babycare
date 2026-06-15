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

    // 1. Ambil data terapis dari ID reservasi untuk validasi double order
    $stmtGet = $conn->prepare("SELECT id_therapist FROM appointments WHERE id = ?");
    $stmtGet->execute([$trx_id]);
    $appointment = $stmtGet->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        throw new Exception("Reservasi tidak ditemukan");
    }

    $id_therapist = $appointment['id_therapist'];

    // 2. Cek apakah di waktu baru terapis tersebut sudah ada jadwal lain (Overlap 1 Jam)
    $stmtCheck = $conn->prepare("
        SELECT id FROM appointments 
        WHERE id_therapist = :id_therapist 
        AND id != :id_target
        AND status_jadwal != 'Dibatalkan'
        AND deleted_at IS NULL
        AND waktu_reservasi > DATE_SUB(:dt, INTERVAL 1 HOUR)
        AND waktu_reservasi < DATE_ADD(:dt, INTERVAL 1 HOUR)
    ");
    
    $stmtCheck->execute([
        ':id_therapist' => $id_therapist,
        ':id_target' => $trx_id,
        ':dt' => $new_datetime
    ]);

    if ($stmtCheck->fetch()) {
        throw new Exception("Terapis sudah memiliki jadwal lain pada rentang waktu tersebut (Batas aman 1 jam)");
    }


    $stmtUpdate = $conn->prepare("
        UPDATE appointments 
        SET waktu_reservasi = ?, 
            jam_reservasi = ?, 
            tanggal_reservasi = ? 
        WHERE id = ?
    ");
    $success = $stmtUpdate->execute([$new_datetime, $new_time, $new_date, $trx_id]);

    // Menggunakan query standar (jika data jam & tanggal di-generate dinamis dari waktu_reservasi)
    $stmtUpdate = $conn->prepare("UPDATE appointments SET waktu_reservasi = ? WHERE id = ?");
    $success = $stmtUpdate->execute([$new_datetime, $trx_id]);

    if ($success) {
        // Berikan respons HTTP 200 Sukses
        http_response_code(200);
        echo json_encode([
            "status" => 200, 
            "message" => "Jadwal berhasil diperbarui",
            "data" => [
                "waktu_reservasi" => $new_datetime,
                "jam_reservasi" => $new_time
            ]
        ]);
    } else {
        throw new Exception("Gagal memperbarui database");
    }

} catch (Exception $e) {
    // Tetap kirimkan format JSON meskipun error, agar dibaca dengan baik oleh JavaScript Fetch
    http_response_code(400);
    echo json_encode([
        "status" => 400, 
        "message" => $e->getMessage()
    ]);
}
?>