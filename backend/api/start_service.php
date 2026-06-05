<?php
// backend/api/start_service.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/koneksi.php';

try {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input['appointment_id']) || !isset($input['user_id'])) {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Parameter tidak lengkap"]);
        exit;
    }

    $appointment_id = (int)$input['appointment_id'];
    $user_id = (int)$input['user_id'];
    $suhu_anak = $input['suhu_anak'] ?? null;
    $bb_real_terapis = $input['bb_real_terapis'] ?? null;
    $waktu_mulai = date('Y-m-d H:i:s');

    // Auto-migrate column if it doesn't exist
    try {
        $conn->exec("ALTER TABLE appointments ADD COLUMN bb_real_terapis varchar(20) DEFAULT NULL AFTER bb_saat_ini");
    } catch (Exception $e) {
        // Ignore if already exists
    }

    $conn->beginTransaction();

    $stmtUpdate = $conn->prepare("UPDATE appointments SET status_jadwal = 'Diproses', waktu_mulai_layanan = COALESCE(waktu_mulai_layanan, :waktu), suhu_anak = :suhu, bb_real_terapis = :bb WHERE id = :id AND status_jadwal IN ('Menunggu', 'Pending', 'Diproses')");
    $stmtUpdate->execute([
        ':waktu' => $waktu_mulai, 
        ':suhu' => $suhu_anak, 
        ':bb' => $bb_real_terapis, 
        ':id' => $appointment_id
    ]);

    if ($stmtUpdate->rowCount() > 0) {
        $stmtLog = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_baru) VALUES (?, 'update', 'appointments', ?, ?)");
        $stmtLog->execute([
            $user_id, 
            $appointment_id, 
            json_encode([
                "Status" => "Diproses", 
                "Waktu Mulai" => $waktu_mulai,
                "Suhu Anak" => $suhu_anak,
                "BB Real" => $bb_real_terapis
            ])
        ]);

        $conn->commit();
        echo json_encode(["status" => 200, "message" => "Layanan berhasil dimulai"]);
    } else {
        $conn->rollBack();
        echo json_encode(["status" => 400, "message" => "Gagal memulai layanan atau status sudah berubah"]);
    }

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => "Error: " . $e->getMessage()]);
}
?>
