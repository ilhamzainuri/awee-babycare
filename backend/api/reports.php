<?php
// Letak file: backend/api/reports.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
require_once '../config/koneksi.php';

// Ambil filter dari parameter URL (Default ke Bulanan / Monthly)
$filter = isset($_GET['filter']) ? $_GET['filter'] : 'Monthly';
$whereClause = "a.deleted_at IS NULL";
$params = [];

// 1. Atur Cakupan Waktu dan Format Pengelompokan Grafik Berdasarkan Filter
switch ($filter) {
    case 'Daily':
        $whereClause .= " AND DATE(a.waktu_reservasi) = CURRENT_DATE()";
        $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%H:00')"; // Grafik per Jam hari ini
        break;
    case 'Weekly':
        $whereClause .= " AND a.waktu_reservasi >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)";
        $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%d %b')"; // Grafik per Hari (7 hari terakhir)
        break;
    case 'Monthly':
        $whereClause .= " AND MONTH(a.waktu_reservasi) = MONTH(CURRENT_DATE()) AND YEAR(a.waktu_reservasi) = YEAR(CURRENT_DATE())";
        $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%d %b')"; // Grafik per Tanggal di bulan berjalan
        break;
    case 'Yearly':
        $whereClause .= " AND YEAR(a.waktu_reservasi) = YEAR(CURRENT_DATE())";
        $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%b')"; // Grafik per Bulan di tahun berjalan
        break;
    case 'Custom':
        $start = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d');
        $end = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');
        $whereClause .= " AND DATE(a.waktu_reservasi) BETWEEN :start AND :end";
        $params[':start'] = $start;
        $params[':end'] = $end;

        // Tentukan format grafik dinamis berdasarkan rentang hari custom
        $diff = strtotime($end) - strtotime($start);
        if ($diff > 31536000) { // > 1 Tahun
            $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%Y')";
        } elseif ($diff > 2592000) { // > 1 Bulan
            $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%b %y')";
        } else {
            $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%d %b')";
        }
        break;
    default:
        $whereClause .= " AND MONTH(a.waktu_reservasi) = MONTH(CURRENT_DATE()) AND YEAR(a.waktu_reservasi) = YEAR(CURRENT_DATE())";
        $chartGroup = "DATE_FORMAT(a.waktu_reservasi, '%d %b')";
        break;
}

try {
    // 2. Kueri A: Hitung Total Omzet (Hanya Transaksi yang tidak Dibatalkan)
    $stmtOmzet = $conn->prepare("SELECT SUM(total_harga_kunjungan) as total FROM appointments a WHERE $whereClause AND a.status_jadwal != 'Dibatalkan'");
    $stmtOmzet->execute($params);
    $resOmzet = $stmtOmzet->fetch(PDO::FETCH_ASSOC);
    $totalOmzet = $resOmzet['total'] ? (float)$resOmzet['total'] : 0.00;

    // 3. Kueri B: Hitung Total Angka Reservasi Pasien
    $stmtCount = $conn->prepare("SELECT COUNT(id) as total FROM appointments a WHERE $whereClause");
    $stmtCount->execute($params);
    $resCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
    $totalReservasi = (int)$resCount['total'];

    // 4. Kueri C: Susun Data Grafik Penjualan (Bar Chart)
    $stmtChart = $conn->prepare("
        SELECT $chartGroup as name, SUM(total_harga_kunjungan) as value 
        FROM appointments a 
        WHERE $whereClause AND a.status_jadwal != 'Dibatalkan'
        GROUP BY name 
        ORDER BY a.waktu_reservasi ASC
    ");
    $stmtChart->execute($params);
    $chartData = $stmtChart->fetchAll(PDO::FETCH_ASSOC);
    foreach ($chartData as &$c) { $c['value'] = (float)$c['value']; }

    // 5. Kueri D: Hitung Komisi & Sesi Terapis/Bidan (Top Performance Card)
    $stmtTherapists = $conn->prepare("
        SELECT 
            t.id AS id_therapist,
            t.nama_terapis as name, 
            COUNT(a.id) as sessions, 
            SUM(a.total_komisi_kunjungan) as commission 
        FROM appointments a
        JOIN therapists t ON a.id_therapist = t.id
        WHERE $whereClause AND a.status_jadwal = 'Selesai' AND t.deleted_at IS NULL
        GROUP BY t.id
        ORDER BY commission DESC
    ");
    $stmtTherapists->execute($params);
    $therapistsData = $stmtTherapists->fetchAll(PDO::FETCH_ASSOC);
    foreach ($therapistsData as &$t) {
        $t['sessions'] = (int)$t['sessions'];
        $t['commission'] = (float)$t['commission'];
    }

    // 6. Kueri E: Hitung Proporsi Status Reservasi (Donut / Pie Chart)
    $stmtStatus = $conn->prepare("
        SELECT a.status_jadwal as name, COUNT(a.id) as value 
        FROM appointments a 
        WHERE $whereClause
        GROUP BY a.status_jadwal
    ");
    $stmtStatus->execute($params);
    $statusData = $stmtStatus->fetchAll(PDO::FETCH_ASSOC);
    foreach ($statusData as &$s) { $s['value'] = (int)$s['value']; }

    // 7. Kueri F: Cari 5 Layanan Paling Laris Manis (Top Booked Services)
    $stmtTopServices = $conn->prepare("
        SELECT s.nama_layanan as name, COUNT(ad.id) as total_booked 
        FROM appointment_details ad
        JOIN services s ON ad.id_service = s.id
        JOIN appointments a ON ad.id_appointment = a.id
        WHERE $whereClause AND ad.deleted_at IS NULL
        GROUP BY s.id
        ORDER BY total_booked DESC
        LIMIT 5
    ");
    $stmtTopServices->execute($params);
    $topServicesData = $stmtTopServices->fetchAll(PDO::FETCH_ASSOC);
    foreach ($topServicesData as &$ts) { $ts['total_booked'] = (int)$ts['total_booked']; }

    // 8. Kueri G: Ambil Semua Daftar Baris Transaksi Rinci untuk Grid Tabel Utama
    $stmtGrid = $conn->prepare("
        SELECT 
            a.id as trx_id, 
            a.waktu_reservasi, 
            a.nama_anak, 
            t.nama_terapis, 
            a.metode_bayar_admin, 
            a.status_pembayaran, 
            a.status_jadwal, 
            a.total_harga_kunjungan 
        FROM appointments a
        JOIN therapists t ON a.id_therapist = t.id
        WHERE $whereClause
        ORDER BY a.waktu_reservasi DESC
    ");
    $stmtGrid->execute($params);
    $gridData = $stmtGrid->fetchAll(PDO::FETCH_ASSOC);
    foreach ($gridData as &$g) {
        $g['trx_id'] = (int)$g['trx_id'];
        $g['total_harga_kunjungan'] = (float)$g['total_harga_kunjungan'];
    }

    // 9. Gabungkan dan Kirim Seluruh Data Sesuai Kontrak UI di Frontend
    echo json_encode([
        "status" => 200,
        "message" => "Sukses menganalisis data laporan",
        "data" => [
            "total_omzet" => $totalOmzet,
            "total_reservasi" => $totalReservasi,
            "chart" => $chartData,
            "therapists" => $therapistsData,
            "status_reservasi" => $statusData,
            "top_services" => $topServicesData,
            "reservations" => $gridData
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => 500,
        "message" => "Gagal memproses laporan database: " . $e->getMessage()
    ]);
}
?>