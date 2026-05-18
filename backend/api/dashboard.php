<?php
// Letak file: backend/api/dashboard.php

// 1. Setup Header CORS & Format Output
// Mengizinkan React (yang berjalan di port berbeda) untuk mengambil data dari PHP
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight request dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Panggil koneksi database
require_once '../config/koneksi.php';

// Gunakan tanggal server hari ini
$hari_ini = date('Y-m-d');

try {
    // ==========================================
    // BAGIAN 1: MENGAMBIL DATA KPI (METRIK UTAMA)
    // ==========================================

    // KPI 1: Total Reservasi Hari Ini
    $stmt = $conn->prepare("SELECT COUNT(id) as total FROM appointments WHERE DATE(waktu_reservasi) = ? AND deleted_at IS NULL");
    $stmt->execute([$hari_ini]);
    $total_reservasi = $stmt->fetch()['total'];

    // KPI 2: Terapis On-Duty (Aktif)
    $stmt = $conn->query("SELECT COUNT(id) as aktif FROM therapists WHERE status_aktif = 1 AND deleted_at IS NULL");
    $terapis_aktif = $stmt->fetch()['aktif'];

    // KPI 3: Total Semua Terapis
    $stmt = $conn->query("SELECT COUNT(id) as total FROM therapists WHERE deleted_at IS NULL");
    $total_terapis = $stmt->fetch()['total'];

    // KPI 4: Menunggu Verifikasi Pembayaran
    $stmt = $conn->query("SELECT COUNT(id) as unverified FROM appointments WHERE status_pembayaran = 'Unverified' AND deleted_at IS NULL");
    $menunggu_verifikasi = $stmt->fetch()['unverified'];

    // KPI 5: Estimasi Omzet Hari Ini
    $stmt = $conn->prepare("SELECT SUM(total_harga_kunjungan) as omzet FROM appointments WHERE DATE(waktu_reservasi) = ? AND deleted_at IS NULL");
    $stmt->execute([$hari_ini]);
    $hasil_omzet = $stmt->fetch()['omzet'];
    $omzet = $hasil_omzet ? (float)$hasil_omzet : 0.00; // Jika tidak ada transaksi, set jadi 0

    // ==========================================
    // BAGIAN 2: MENGAMBIL DATA WARNING / ALERTS
    // ==========================================
    
    // Logika Mismatch: Jika metode bayar yang diinput Admin berbeda dengan yang diterima Terapis
    $stmt = $conn->query("
        SELECT id, nama_anak, metode_bayar_admin, metode_bayar_terapis, waktu_reservasi 
        FROM appointments 
        WHERE metode_bayar_admin != metode_bayar_terapis 
        AND status_pembayaran = 'Unverified'
        AND deleted_at IS NULL
    ");
    
    $alerts_db = $stmt->fetchAll();
    $alerts = [];
    
    foreach ($alerts_db as $alert) {
        $alerts[] = [
            'id' => $alert['id'],
            'title' => $alert['nama_anak'] . ' - Mismatch',
            'time' => date('h:i A', strtotime($alert['waktu_reservasi'])),
            'description' => "Terdeteksi selisih metode pembayaran pada #TRX-{$alert['id']}. Rencana awal: {$alert['metode_bayar_admin']}, Fakta lapangan: {$alert['metode_bayar_terapis']}.",
            'type' => 'error'
        ];
    }

    // ==========================================
    // BAGIAN 3: MENYUSUN DAN MENGIRIM RESPONSE JSON
    // ==========================================
    
    $response = [
        'status' => 200,
        'message' => 'Berhasil mengambil data dashboard',
        'data' => [
            'kpis' => [
                'reservasi' => (int)$total_reservasi,
                'terapis_aktif' => (int)$terapis_aktif,
                'terapis_total' => (int)$total_terapis,
                'unverified' => (int)$menunggu_verifikasi,
                'omzet' => (float)$omzet
            ],
            'alerts' => $alerts
        ]
    ];

    echo json_encode($response);

} catch(PDOException $e) {
    // Menangkap error jika SQL atau koneksi bermasalah
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
}
?>