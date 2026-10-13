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
            a.id, 
            a.nama_pasien, 
            a.usia_saat_ini, 
            a.bb_saat_ini, 
            a.bb_real_terapis, 
            a.jenis_kelamin, 
            a.suhu_Pasien, 
            a.waktu_reservasi, 
            a.waktu_mulai_layanan, 
            a.waktu_selesai_layanan, 
            a.status_jadwal, 
            a.alamat_lengkap, 
            a.no_hp_ortu, 
            a.link_shareloc, 
            a.keluhan_awal, 
            a.catatan_terapis, 
            a.total_harga_kunjungan, 
            a.total_komisi_kunjungan, 
            a.metode_bayar_terapis, 
            a.metode_bayar_admin, 
            a.status_pembayaran,
            (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
             FROM appointment_details ad 
             JOIN services s ON ad.id_service = s.id 
             WHERE ad.id_appointment = a.id) as rincian_layanan,
            (SELECT GROUP_CONCAT(DISTINCT k.nama_kategori SEPARATOR ' + ')
             FROM appointment_details ad
             JOIN services s ON ad.id_service = s.id
             LEFT JOIN kategori k ON s.kategori_id = k.id_kategori
             WHERE ad.id_appointment = a.id) as kategori_layanan
        FROM appointments a
        WHERE a.id_therapist = :user_id 
        ORDER BY a.waktu_reservasi DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Casting tipe data numerik agar sesuai dengan fungsi formatRupiah di React
    foreach ($schedules as &$item) {
        $item['total_harga_kunjungan'] = (float)$item['total_harga_kunjungan'];
        $item['total_komisi_kunjungan'] = (float)$item['total_komisi_kunjungan'];

        $kat_str = strtolower($item['kategori_layanan'] ?? '');
        $has_outlet = (strpos($kat_str, 'outlet') !== false);
        $has_homecare = (strpos($kat_str, 'homecare') !== false);

        if ($has_outlet && $has_homecare) {
            $item['jenis_layanan'] = 'Outlet & Homecare';
            $item['lokasi_kunjungan'] = 'Outlet / ' . ($item['alamat_lengkap'] ?: 'Alamat Pasien');
        } elseif ($has_outlet) {
            $item['jenis_layanan'] = 'Outlet';
            $item['lokasi_kunjungan'] = 'Outlet (Klinik)';
        } elseif ($has_homecare) {
            $item['jenis_layanan'] = 'Homecare';
            $item['lokasi_kunjungan'] = $item['alamat_lengkap'] ?: 'Alamat Pasien (Homecare)';
        } else {
            $item['jenis_layanan'] = 'Homecare';
            $item['lokasi_kunjungan'] = $item['alamat_lengkap'];
        }
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