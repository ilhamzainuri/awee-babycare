<?php
// Letak file: backend/api/therapist_schedule.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Tangani preflight request dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
require_once '../config/koneksi.php'; // Menggunakan file koneksi PDO yang sama dengan reports

// Ambil parameter user_id dari frontend
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => 400, 
        "message" => "Parameter user_id tidak valid atau hilang."
    ]);
    exit();
}

try {
    // Kueri disesuaikan dengan field yang dibutuhkan oleh frontend (TherapistSchedulesPage.tsx)
    // Asumsi tabel utamanya adalah 'appointments' berdasarkan contoh reports.php kamu
    $query = "
        SELECT 
            id, 
            nama_anak, 
            usia_saat_ini, 
            bb_saat_ini, 
            bb_real_terapis, 
            jenis_kelamin, 
            suhu_anak, 
            waktu_reservasi, 
            waktu_mulai_layanan, 
            waktu_selesai_layanan, 
            status_jadwal, 
            rincian_layanan, 
            alamat_lengkap, 
            no_hp_ortu, 
            link_shareloc, 
            keluhan_awal, 
            catatan_terapis, 
            total_harga_kunjungan, 
            total_komisi_kunjungan, 
            metode_bayar_terapis, 
            metode_bayar_admin, 
            status_pembayaran 
        FROM appointments 
        WHERE id_therapist = :user_id 
        ORDER BY waktu_reservasi DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Casting tipe data numerik agar sesuai dengan fungsi formatRupiah di React
    foreach ($schedules as &$item) {
        $item['total_harga_kunjungan'] = (float)$item['total_harga_kunjungan'];
        $item['total_komisi_kunjungan'] = (float)$item['total_komisi_kunjungan'];
    }

    // Kembalikan Response Sukses
    echo json_encode([
        "status" => 200,
        "message" => "Berhasil mengambil data jadwal terapis",
        "data" => $schedules
    ]);

} catch (PDOException $e) {
    // Tangani error database PDO
    http_response_code(500);
    echo json_encode([
        "status" => 500,
        "message" => "Gagal mengambil data dari database: " . $e->getMessage()
    ]);
}
?>