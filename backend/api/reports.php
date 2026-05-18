<?php
// Letak file: backend/api/reports.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'Monthly';
    $dateCondition = "";

    if ($filter === 'Daily') {
        $dateCondition = "AND DATE(a.waktu_reservasi) = CURDATE()";
    } elseif ($filter === 'Weekly') {
        $dateCondition = "AND a.waktu_reservasi >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)";
    } elseif ($filter === 'Monthly') {
        $dateCondition = "AND a.waktu_reservasi >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
    } elseif ($filter === 'Yearly') {
        $dateCondition = "AND a.waktu_reservasi >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
    } elseif ($filter === 'Custom') {
        // Logika baru untuk Custom Date
        $start = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d');
        $end = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');
        
        // Mencegah SQL Injection dengan memastikan formatnya adalah tanggal
        $start_date = date('Y-m-d', strtotime($start));
        $end_date = date('Y-m-d', strtotime($end));
        
        $dateCondition = "AND DATE(a.waktu_reservasi) BETWEEN '$start_date' AND '$end_date'";
    }

    // 1. Ambil Total Omzet & Total Reservasi
    $stmtTotal = $conn->query("SELECT COALESCE(SUM(a.total_harga_kunjungan), 0) as total_omzet, COUNT(a.id) as total_reservasi FROM appointments a WHERE a.deleted_at IS NULL $dateCondition");
    $summary = $stmtTotal->fetch();
    $total_omzet = $summary['total_omzet'];
    $total_reservasi = $summary['total_reservasi'];

    // 2. Data Grafik Omzet
    $stmtChart = $conn->query("
        SELECT DATE_FORMAT(a.waktu_reservasi, '%d %b') as name, COALESCE(SUM(a.total_harga_kunjungan), 0) as value 
        FROM appointments a
        WHERE a.deleted_at IS NULL $dateCondition 
        GROUP BY DATE(a.waktu_reservasi) 
        ORDER BY DATE(a.waktu_reservasi) ASC 
        LIMIT 14
    ");
    $chartData = $stmtChart->fetchAll();

    // 3. Data Komisi Terapis
    $stmtTherapist = $conn->query("
        SELECT t.nama_terapis as name, COUNT(a.id) as sessions, COALESCE(SUM(a.total_komisi_kunjungan), 0) as commission
        FROM therapists t
        JOIN appointments a ON t.id = a.id_therapist
        WHERE a.deleted_at IS NULL $dateCondition
        GROUP BY t.id ORDER BY commission DESC LIMIT 4
    ");
    $therapistsData = $stmtTherapist->fetchAll();

    // 4. Breakdown Status Reservasi
    $stmtStatus = $conn->query("
        SELECT a.status_jadwal as name, COUNT(a.id) as value 
        FROM appointments a
        WHERE a.deleted_at IS NULL $dateCondition 
        GROUP BY a.status_jadwal
    ");
    $statusData = $stmtStatus->fetchAll();

    // 5. Top Services (Layanan Paling Laris)
    $stmtTopServices = $conn->query("
        SELECT s.nama_layanan as name, COUNT(ad.id) as total_booked 
        FROM appointment_details ad 
        JOIN services s ON ad.id_service = s.id 
        JOIN appointments a ON ad.id_appointment = a.id 
        WHERE a.deleted_at IS NULL $dateCondition 
        GROUP BY s.id 
        ORDER BY total_booked DESC 
        LIMIT 4
    ");
    $topServicesData = $stmtTopServices->fetchAll();

    // 6. Rincian Data Reservasi (Untuk Tabel Detail)
    $stmtReservations = $conn->query("
        SELECT 
            a.id as trx_id, 
            a.waktu_reservasi, 
            a.nama_anak, 
            t.nama_terapis, 
            a.status_jadwal, 
            a.status_pembayaran,
            a.metode_bayar_admin,
            a.total_harga_kunjungan 
        FROM appointments a
        JOIN therapists t ON a.id_therapist = t.id
        WHERE a.deleted_at IS NULL $dateCondition
        ORDER BY a.waktu_reservasi DESC
    ");
    $reservationsData = $stmtReservations->fetchAll();

    echo json_encode([
        "status" => 200,
        "message" => "Sukses",
        "data" => [
            "total_omzet" => (float)$total_omzet,
            "total_reservasi" => (int)$total_reservasi,
            "chart" => $chartData,
            "therapists" => $therapistsData,
            "status_reservasi" => $statusData,
            "top_services" => $topServicesData,
            "reservations" => $reservationsData
        ]
    ]);

} catch(PDOException $e) {
    http_response_code(500); echo json_encode(["status" => 500, "message" => "Error: " . $e->getMessage()]);
}
?>