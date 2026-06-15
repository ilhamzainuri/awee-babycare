<?php
// Letak file: backend/api/therapist_report.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
require_once '../config/koneksi.php';

// Ambil user_id dari parameter URL
if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "Akses ditolak: ID User tidak valid."]);
    exit();
}

$user_id = (int)$_GET['user_id'];

try {
    // 1. Ambil data identitas terapis dari user_id
    $stmt = $conn->prepare("SELECT id, nama_terapis FROM therapists WHERE user_id = :user_id AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([':user_id' => $user_id]);
    $therapist = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$therapist) {
        http_response_code(404);
        echo json_encode(["status" => 404, "message" => "Profil terapis tidak ditemukan atau telah dinonaktifkan."]);
        exit();
    }
    
    $therapist_id = (int)$therapist['id'];
    $nama_terapis = $therapist['nama_terapis'];

    // Ambil filter dari parameter URL (Default ke Bulanan / Monthly)
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'Monthly';
    
    // Inisialisasi parameter filter
    $whereClause = "a.deleted_at IS NULL AND a.id_therapist = :therapist_id";
    $params = [':therapist_id' => $therapist_id];

    // Atur Cakupan Waktu dan Format Pengelompokan Grafik Berdasarkan Filter
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

    // Jika dipanggil untuk detail komisi terapis (modal popup di frontend)
    if (isset($_GET['therapist_id']) && !empty($_GET['therapist_id'])) {
        // 1. Ambil Nama Terapis, Total Sesi, dan Total Komisi (sesuai filter waktu)
        $stmtDetail = $conn->prepare("
            SELECT 
                t.nama_terapis,
                COUNT(a.id) as total_sesi,
                COALESCE(SUM(a.total_komisi_kunjungan), 0) as total_komisi
            FROM therapists t
            LEFT JOIN appointments a ON t.id = a.id_therapist 
                AND a.status_jadwal = 'Selesai' 
                AND $whereClause
            WHERE t.id = :id
            GROUP BY t.id
        ");
        $stmtDetail->execute(array_merge($params, [':id' => $therapist_id]));
        $therapistInfo = $stmtDetail->fetch(PDO::FETCH_ASSOC);

        if (!$therapistInfo) {
            $therapistInfo = [
                'nama_terapis' => $nama_terapis,
                'total_sesi' => 0,
                'total_komisi' => 0
            ];
        }

        // 2. Ambil Riwayat Transaksi
        $stmtRiwayat = $conn->prepare("
            SELECT 
                a.id as id_appointment,
                a.waktu_reservasi,
                a.nama_anak,
                a.total_komisi_kunjungan as komisi_didapat,
                a.status_jadwal
            FROM appointments a
            WHERE a.id_therapist = :id 
              AND a.status_jadwal = 'Selesai'
              AND $whereClause
            ORDER BY a.waktu_reservasi DESC
        ");
        $stmtRiwayat->execute(array_merge($params, [':id' => $therapist_id]));
        $riwayat = $stmtRiwayat->fetchAll(PDO::FETCH_ASSOC);

        foreach ($riwayat as &$r) {
            $r['komisi_didapat'] = (float)$r['komisi_didapat'];
            $r['waktu_reservasi'] = date('d M Y, H:i', strtotime($r['waktu_reservasi'])); 
        }

        // 3. Keluarkan JSON Rincian Komisi
        echo json_encode([
            "status" => 200,
            "message" => "Berhasil memuat rincian komisi terapis",
            "data" => [
                "nama_terapis" => $therapistInfo['nama_terapis'],
                "total_sesi" => (int)$therapistInfo['total_sesi'],
                "total_komisi" => (float)$therapistInfo['total_komisi'],
                "riwayat" => $riwayat
            ]
        ]);
        exit();
    }

    // A. Hitung Total Omzet Layanan, Komisi, dan Total Bersih (Komisi Terverifikasi)
    $stmtRev = $conn->prepare("
        SELECT 
            COALESCE(SUM(CASE WHEN a.status_jadwal != 'Dibatalkan' THEN a.total_harga_kunjungan ELSE 0 END), 0) AS total_kotor,
            COALESCE(SUM(CASE WHEN a.status_jadwal != 'Dibatalkan' THEN a.total_komisi_kunjungan ELSE 0 END), 0) AS total_komisi,
            COALESCE(SUM(CASE 
                WHEN a.status_jadwal != 'Dibatalkan' AND a.status_pembayaran = 'Verified' 
                THEN a.total_komisi_kunjungan 
                ELSE 0 
            END), 0) AS total_komisi_bersih
        FROM appointments a
        WHERE $whereClause
    ");
    $stmtRev->execute($params);
    $revData = $stmtRev->fetch(PDO::FETCH_ASSOC);

    $totalOmzet  = (float)$revData['total_kotor'];
    $totalKomisi = (float)$revData['total_komisi'];
    $totalBersih = (float)$revData['total_komisi_bersih']; // Verified earnings

    // B. Hitung Total Angka Reservasi Pasien
    $stmtCount = $conn->prepare("SELECT COUNT(id) as total FROM appointments a WHERE $whereClause");
    $stmtCount->execute($params);
    $resCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
    $totalReservasi = (int)$resCount['total'];

    // C. Susun Data Grafik Penjualan (Bar Chart) - Menampilkan komisi terapis over time
    $stmtChart = $conn->prepare("
        SELECT $chartGroup as name, SUM(total_komisi_kunjungan) as value 
        FROM appointments a 
        WHERE $whereClause AND a.status_jadwal != 'Dibatalkan'
        GROUP BY name 
        ORDER BY a.waktu_reservasi ASC
    ");
    $stmtChart->execute($params);
    $chartData = $stmtChart->fetchAll(PDO::FETCH_ASSOC);
    foreach ($chartData as &$c) { $c['value'] = (float)$c['value']; }

    // D. Data Performa Terapis (Hanya terapis itu sendiri)
    // Hitung total sesi selesai untuk terapis itu sendiri
    $stmtSesiSelesai = $conn->prepare("
        SELECT COUNT(id) as total_selesai
        FROM appointments a
        WHERE $whereClause AND a.status_jadwal = 'Selesai'
    ");
    $stmtSesiSelesai->execute($params);
    $totalSesiSelesai = (int)$stmtSesiSelesai->fetch(PDO::FETCH_ASSOC)['total_selesai'];

    $therapistsData = [
        [
            "id_therapist" => $therapist_id,
            "nama_terapis" => $nama_terapis,
            "total_sesi" => $totalSesiSelesai,
            "total_komisi" => $totalKomisi
        ]
    ];

    // E. Hitung Proporsi Status Reservasi (Donut / Pie Chart)
    $stmtStatus = $conn->prepare("
        SELECT a.status_jadwal as name, COUNT(a.id) as value 
        FROM appointments a 
        WHERE $whereClause
        GROUP BY a.status_jadwal
    ");
    $stmtStatus->execute($params);
    $statusData = $stmtStatus->fetchAll(PDO::FETCH_ASSOC);
    foreach ($statusData as &$s) { $s['value'] = (int)$s['value']; }

    // F. Cari 5 Layanan Paling Laris oleh terapis ini
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

    // G. Ambil Semua Daftar Baris Transaksi Rinci untuk Grid Tabel Utama
    $stmtGrid = $conn->prepare("
        SELECT 
            a.id as trx_id, 
            a.waktu_reservasi, 
            a.nama_anak, 
            t.nama_terapis, 
            a.metode_bayar_admin, 
            a.status_pembayaran, 
            a.status_jadwal, 
            a.total_harga_kunjungan,
            a.total_komisi_kunjungan
        FROM appointments a
        JOIN therapists t ON a.id_therapist = t.id
        WHERE $whereClause
        ORDER BY a.waktu_reservasi DESC
    ");
    $stmtGrid->execute($params);
    $gridData = $stmtGrid->fetchAll(PDO::FETCH_ASSOC);

    // Siapkan statement di luar loop
    $stmtDetail = $conn->prepare("
        SELECT 
            s.nama_layanan, 
            ad.harga_snapshot 
        FROM appointment_details ad
        JOIN services s ON ad.id_service = s.id
        WHERE ad.id_appointment = :id_appointment AND ad.deleted_at IS NULL
    ");

    foreach ($gridData as &$g) {
        $g['trx_id'] = (int)$g['trx_id'];
        $g['total_harga_kunjungan'] = (float)$g['total_harga_kunjungan'];
        $g['total_komisi_kunjungan'] = (float)$g['total_komisi_kunjungan'];
        $g['total_bersih'] = $g['total_harga_kunjungan'] - $g['total_komisi_kunjungan'];

        $stmtDetail->execute([':id_appointment' => $g['trx_id']]);
        $g['layanan'] = $stmtDetail->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($g['layanan'] as &$l) {
            $l['harga_snapshot'] = (float)$l['harga_snapshot'];
        }
    }

    echo json_encode([
        "status" => 200,
        "message" => "Sukses menganalisis data laporan terapis",
        "data" => [
            "total_omzet" => $totalOmzet,
            "total_pendapatan_bersih" => $totalBersih, // Verified Commission
            "total_reservasi" => $totalReservasi,
            "total_komisi" => $totalKomisi,
            "chart" => $chartData,
            "therapists" => $therapistsData,
            "status_reservasi" => $statusData,
            "top_services" => $topServicesData,
            "reservations" => $gridData
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => 500,
        "message" => "Gagal memproses laporan database: " . $e->getMessage()
    ]);
}
?>