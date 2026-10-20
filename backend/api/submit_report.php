<?php
// backend/api/submit_report.php

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
    if (!isset($_POST['appointment_id']) || !isset($_POST['user_id'])) {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Parameter tidak lengkap"]);
        exit;
    }

    $appointment_id = (int)$_POST['appointment_id'];
    $user_id = (int)$_POST['user_id'];
    $catatan_terapis = $_POST['catatan_terapis'] ?? null;
    $metode_bayar_terapis = $_POST['metode_bayar_terapis'] ?? null;
    
    $waktu_selesai = date('Y-m-d H:i:s');
    $bukti_bayar_url = null;

    // Bukti pembayaran wajib diunggah untuk semua metode (Cash maupun Transfer)
    if (!isset($_FILES['bukti_pembayaran']) || $_FILES['bukti_pembayaran']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Bukti pembayaran wajib diunggah untuk semua metode pembayaran."]);
        exit;
    }

    $uploadDir = '../uploads/payments/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileExtension = pathinfo($_FILES['bukti_pembayaran']['name'], PATHINFO_EXTENSION);
    $fileName = 'payment_' . $appointment_id . '_' . time() . '.' . $fileExtension;
    $targetFile = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES['bukti_pembayaran']['tmp_name'], $targetFile)) {
        $bukti_bayar_url = $fileName;
    } else {
        throw new Exception("Gagal mengunggah foto bukti pembayaran.");
    }

    $conn->beginTransaction();

    $oldStmt = $conn->prepare("SELECT nama_pasien, status_jadwal, waktu_selesai_layanan, catatan_terapis, metode_bayar_terapis, bukti_bayar_url FROM appointments WHERE id = ? AND deleted_at IS NULL LIMIT 1");
    $oldStmt->execute([$appointment_id]);
    $appt = $oldStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmtUpdate = $conn->prepare("
        UPDATE appointments 
        SET status_jadwal = 'Selesai', 
            waktu_selesai_layanan = :waktu,
            catatan_terapis = :catatan,
            metode_bayar_terapis = :metode,
            bukti_bayar_url = :bukti
        WHERE id = :id AND status_jadwal = 'Diproses'
    ");
    
    $stmtUpdate->execute([
        ':waktu' => $waktu_selesai,
        ':catatan' => $catatan_terapis,
        ':metode' => $metode_bayar_terapis,
        ':bukti' => $bukti_bayar_url,
        ':id' => $appointment_id
    ]);

    if ($stmtUpdate->rowCount() > 0) {
        $data_lama_log = [
            "nama_pasien" => $appt['nama_pasien'] ?? null,
            "status_jadwal" => $appt['status_jadwal'] ?? null,
            "waktu_selesai_layanan" => $appt['waktu_selesai_layanan'] ?? null,
            "catatan_terapis" => $appt['catatan_terapis'] ?? null,
            "metode_bayar_terapis" => $appt['metode_bayar_terapis'] ?? null,
            "bukti_bayar_url" => $appt['bukti_bayar_url'] ?? null
        ];
        $data_baru_log = [
            "nama_pasien" => $appt['nama_pasien'] ?? null,
            "status_jadwal" => "Selesai",
            "waktu_selesai_layanan" => $waktu_selesai,
            "catatan_terapis" => $catatan_terapis,
            "metode_bayar_terapis" => $metode_bayar_terapis,
            "bukti_bayar_url" => $bukti_bayar_url
        ];

        $stmtLog = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'appointments', ?, ?, ?)");
        $stmtLog->execute([
            $user_id, 
            $appointment_id, 
            json_encode($data_lama_log),
            json_encode($data_baru_log)
        ]);

        $conn->commit();
        echo json_encode(["status" => 200, "message" => "Laporan berhasil dikirim dan layanan selesai!"]);
    } else {
        $conn->rollBack();
        echo json_encode(["status" => 400, "message" => "Gagal menyimpan laporan atau status layanan tidak valid"]);
    }

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => "Error: " . $e->getMessage()]);
}
?>
