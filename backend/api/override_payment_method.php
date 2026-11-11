<?php
// backend/api/override_payment_method.php
// Admin override: set metode_bayar_terapis jika terapis lupa input

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") { http_response_code(200); exit(); }
ini_set("display_errors", 0);
require_once "../config/koneksi.php";

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
        exit();
    }

    $input = json_decode(file_get_contents("php://input"), true);

    $appointment_id = isset($input["appointment_id"]) ? (int)$input["appointment_id"] : 0;
    $metode_baru    = isset($input["metode_bayar_terapis"]) ? trim($input["metode_bayar_terapis"]) : "";
    $user_id        = isset($input["user_id"]) ? (int)$input["user_id"] : 1;

    if (!$appointment_id || !$metode_baru) {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Parameter appointment_id dan metode_bayar_terapis wajib diisi"]);
        exit();
    }

    // Validasi: hanya boleh override jika belum Verified dan tidak Dibatalkan
    $check = $conn->prepare("SELECT id, status_jadwal, status_pembayaran, metode_bayar_terapis, nama_pasien FROM appointments WHERE id = ? AND deleted_at IS NULL");
    $check->execute([$appointment_id]);
    $row = $check->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(["status" => 404, "message" => "Appointment tidak ditemukan"]);
        exit();
    }

    if ($row["status_pembayaran"] === "Verified") {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Pembayaran sudah diverifikasi, tidak perlu diubah"]);
        exit();
    }

    if ($row["status_jadwal"] === "Dibatalkan") {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Jadwal ini telah dibatalkan"]);
        exit();
    }

    // Lakukan update
    $update = $conn->prepare("UPDATE appointments SET metode_bayar_terapis = ? WHERE id = ?");
    $update->execute([$metode_baru, $appointment_id]);

    // Catat ke audit_logs
    $data_lama = ["nama_pasien" => $row["nama_pasien"], "metode_bayar_terapis" => $row["metode_bayar_terapis"]];
    $data_baru = ["nama_pasien" => $row["nama_pasien"], "metode_bayar_terapis" => $metode_baru, "override_by" => "admin"];

    $log = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, \"update\", \"appointments\", ?, ?, ?)");
    $log->execute([
        $user_id,
        $appointment_id,
        json_encode($data_lama),
        json_encode($data_baru)
    ]);

    echo json_encode([
        "status"  => 200,
        "message" => "Metode pembayaran berhasil diperbarui oleh admin",
        "data"    => [
            "appointment_id"       => $appointment_id,
            "metode_bayar_terapis" => $metode_baru
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>
