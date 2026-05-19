<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    if (!isset($_GET['id_therapist'])) {
        throw new Exception("ID Terapis tidak ditemukan");
    }

    $id_therapist = (int)$_GET['id_therapist'];

    // Ambil info nama terapis
    $t_stmt = $conn->prepare("SELECT nama_terapis FROM therapists WHERE id = ?");
    $t_stmt->execute([$id_therapist]);
    $therapist = $t_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$therapist) {
        throw new Exception("Terapis tidak ditemukan");
    }

    // Ambil semua riwayat sesi yang 'Selesai' untuk terapis ini
    $sql = "SELECT 
                id AS trx_id, 
                waktu_reservasi, 
                nama_anak AS patient, 
                total_harga_kunjungan AS total_biaya,
                total_komisi_kunjungan AS commission
            FROM appointments 
            WHERE id_therapist = ? 
              AND status_jadwal = 'Selesai' 
              AND deleted_at IS NULL
            ORDER BY waktu_reservasi DESC";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$id_therapist]);
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Casting tipe data numerik
    foreach ($sessions as &$s) {
        $s['trx_id'] = (int)$s['trx_id'];
        $s['total_biaya'] = (float)$s['total_biaya'];
        $s['commission'] = (float)$s['commission'];
    }

    echo json_encode([
        "status" => 200, 
        "message" => "Sukses", 
        "data" => [
            "nama_terapis" => $therapist['nama_terapis'],
            "sessions" => $sessions
        ]
    ]);

} catch(Exception $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>