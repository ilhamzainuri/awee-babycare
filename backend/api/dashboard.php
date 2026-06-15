<?php
// Letak file: backend/api/dashboard.php

// 1. Setup Header CORS & Format Output
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight request dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sembunyikan error teks mentah agar tidak merusak format JSON di frontend
ini_set('display_errors', 0);

// 2. Panggil koneksi database
require_once '../config/koneksi.php';

// Gunakan tanggal server hari ini sebagai fallback default
$hari_ini = date('Y-m-d');

// Cek aksi apa yang diminta oleh React (default: kpi)
$action = isset($_GET['action']) ? $_GET['action'] : 'kpi';

try {
    // ========================================================
    // ENDPOINT JADWAL TERAPIS DENGAN ADVANCED FILTER & ALAMAT
    // ========================================================
    if ($action === 'schedule') {
        $filter_date = isset($_GET['date']) && !empty($_GET['date']) ? $_GET['date'] : $hari_ini;
        $filter_therapist = isset($_GET['therapist']) ? trim($_GET['therapist']) : '';

        $sql = "SELECT 
                    a.id, 
                    t.nama_terapis AS therapist, 
                    'Klinik Bidan & Anak' AS specialty, 
                    a.nama_anak AS patient, 
                    a.alamat_lengkap AS room, 
                    DATE_FORMAT(a.waktu_reservasi, '%H:%i') AS time, 
                    a.status_jadwal AS status,
                    UPPER(SUBSTRING(t.nama_terapis, 1, 2)) AS initials
                FROM appointments a
                JOIN therapists t ON a.id_therapist = t.id
                WHERE DATE(a.waktu_reservasi) = :filterDate 
                AND a.deleted_at IS NULL 
                AND t.deleted_at IS NULL";

        if ($filter_therapist !== '') {
            $sql .= " AND t.nama_terapis LIKE :filterTherapist";
        }

        $sql .= " ORDER BY a.waktu_reservasi ASC";

        $stmt = $conn->prepare($sql);
        $stmt->bindValue(':filterDate', $filter_date);

        if ($filter_therapist !== '') {
            $search_pattern = "%" . $filter_therapist . "%";
            $stmt->bindValue(':filterTherapist', $search_pattern);
        }

        $stmt->execute();
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 200,
            'message' => 'Berhasil mengambil data jadwal terapis',
            'data' => [
                'schedules' => $schedules ? $schedules : []
            ]
        ]);
        exit();
    }

    // ========================================================
    // BAGIAN 1: MENGAMBIL DATA KPI (METRIK UTAMA) - DEFAULT LOAD
    // ========================================================

    // KPI 1: Total Reservasi Hari Ini
    $stmt = $conn->prepare("SELECT COUNT(id) as total FROM appointments WHERE DATE(waktu_reservasi) = ? AND deleted_at IS NULL");
    $stmt->execute([$hari_ini]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_reservasi = $row ? (int)$row['total'] : 0;

    // KPI 2: Terapis On-Duty (Aktif)
    $stmt = $conn->query("SELECT COUNT(id) as aktif FROM therapists WHERE status_aktif = 1 AND deleted_at IS NULL");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $terapis_aktif = $row ? (int)$row['aktif'] : 0;

    // KPI 3: Total Semua Terapis
    $stmt = $conn->query("SELECT COUNT(id) as total FROM therapists WHERE deleted_at IS NULL");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_terapis = $row ? (int)$row['total'] : 0;

    // KPI 4: Menunggu Verifikasi Pembayaran
    $stmt = $conn->query("SELECT COUNT(id) as unverified FROM appointments WHERE status_pembayaran = 'Unverified' AND deleted_at IS NULL");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $menunggu_verifikasi = $row ? (int)$row['unverified'] : 0;

    // KPI 5: Estimasi Omzet Hari Ini
    $dashboardWhere = "DATE(a.waktu_reservasi) = ? AND a.deleted_at IS NULL";
$revenueHariIni = getRevenueSummary($conn, $dashboardWhere, [$hari_ini]);

$omzet = $revenueHariIni['kotor'];             // Menggantikan KPI 5
$pendapatan_bersih = $revenueHariIni['bersih']; // Menggantikan KPI 6

    // ==========================================
    // BAGIAN 2: MENGAMBIL DATA WARNING / ALERTS
    // ==========================================
    $stmt = $conn->query("
        SELECT id, nama_anak, metode_bayar_admin, metode_bayar_terapis, waktu_reservasi 
        FROM appointments 
        WHERE metode_bayar_admin != metode_bayar_terapis 
        AND metode_bayar_terapis IS NOT NULL
        AND status_pembayaran = 'Unverified'
        AND deleted_at IS NULL
    ");
    
    $alerts_db = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $alerts = [];
    
    if ($alerts_db) {
        foreach ($alerts_db as $alert) {
            $alerts[] = [
                'id' => $alert['id'],
                'title' => $alert['nama_anak'] . ' - Mismatch',
                'time' => date('h:i A', strtotime($alert['waktu_reservasi'])),
                'description' => "Terdeteksi selisih metode pembayaran pada #TRX-{$alert['id']}. Rencana awal: {$alert['metode_bayar_admin']}, Fakta lapangan: {$alert['metode_bayar_terapis']}.",
                'type' => 'error'
            ];
        }
    }

    // ==========================================
    // BAGIAN 3: MENYUSUN DAN MENGIRIM RESPONSE JSON
    // ==========================================
    echo json_encode([
        'status' => 200,
        'message' => 'Berhasil mengambil data dashboard',
        'data' => [
            'kpis' => [
                'reservasi' => $total_reservasi,
                'terapis_aktif' => $terapis_aktif,
                'terapis_total' => $total_terapis,
                'unverified' => $menunggu_verifikasi,
                'omzet' => $omzet,
                'pendapatan_bersih' => $pendapatan_bersih
            ],
            'alerts' => $alerts
        ]
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
}
?>