<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    if (!isset($_GET['id'])) {
        throw new Exception("ID Transaksi tidak ditemukan");
    }

    $id = (int)$_GET['id'];

    // 1. Ambil Data Appointment Utama & Terapis
    $stmt = $conn->prepare("
        SELECT a.*, t.nama_terapis, t.no_whatsapp 
        FROM appointments a 
        JOIN therapists t ON a.id_therapist = t.id 
        WHERE a.id = ? AND a.deleted_at IS NULL
    ");
    $stmt->execute([$id]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        throw new Exception("Data transaksi tidak ditemukan");
    }

    // 2. Ambil Rincian Layanan (Appointment Details)
    $detail_stmt = $conn->prepare("
        SELECT ad.*, s.nama_layanan 
        FROM appointment_details ad 
        JOIN services s ON ad.id_service = s.id 
        WHERE ad.id_appointment = ? AND ad.deleted_at IS NULL
    ");
    $detail_stmt->execute([$id]);
    $details = $detail_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Gabungkan data
    $appointment['services'] = $details;

    echo json_encode(["status" => 200, "message" => "Sukses", "data" => $appointment]);

} catch(Exception $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>