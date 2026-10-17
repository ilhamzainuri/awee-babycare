<?php
// Letak file: backend/api/therapist_dashboard.php

// 1. Setup Header CORS & Format Output
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/koneksi.php';

if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "Akses ditolak: ID User tidak valid."]);
    exit();
}

$user_id = (int)$_GET['user_id'];
$filter_date = isset($_GET['date']) && !empty($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$hari_ini = date('Y-m-d');

try {
    // ========================================================
    // BAGIAN 1: AMBIL DATA IDENTITAS TERAPIS
    // ========================================================
    $stmt = $conn->prepare("SELECT id, nama_terapis, status_aktif FROM therapists WHERE user_id = :user_id AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([':user_id' => $user_id]);
    $therapist = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$therapist) {
        throw new Exception("Profil terapis tidak ditemukan atau telah dinonaktifkan.");
    }
    
    $therapist_id = $therapist['id'];

    // Cek status On Process / Standby
    $stmtStatus = $conn->prepare("SELECT id FROM appointments WHERE id_therapist = :id AND status_jadwal = 'Diproses' AND deleted_at IS NULL LIMIT 1");
    $stmtStatus->execute([':id' => $therapist_id]);
    $is_on_process = $stmtStatus->fetch(PDO::FETCH_ASSOC);
    $current_status = $is_on_process ? 'On Process' : 'Standby';

    // ========================================================
    // BAGIAN 2: HITUNG MULTI-KOMISI SECARA REAL-TIME DARI DB
    // ========================================================
    
    // A. Komisi Hari Ini
    $stmtToday = $conn->prepare("
        SELECT SUM(total_komisi_kunjungan) as total FROM appointments 
        WHERE id_therapist = :id AND status_pembayaran = 'Verified' AND DATE(waktu_reservasi) = CURDATE() AND deleted_at IS NULL
    ");
    $stmtToday->execute([':id' => $therapist_id]);
    $comm_today = $stmtToday->fetch(PDO::FETCH_ASSOC)['total'];

    // B. Komisi Minggu Ini
    $stmtWeek = $conn->prepare("
        SELECT SUM(total_komisi_kunjungan) as total FROM appointments 
        WHERE id_therapist = :id AND status_pembayaran = 'Verified' AND YEARWEEK(waktu_reservasi, 1) = YEARWEEK(CURDATE(), 1) AND deleted_at IS NULL
    ");
    $stmtWeek->execute([':id' => $therapist_id]);
    $comm_week = $stmtWeek->fetch(PDO::FETCH_ASSOC)['total'];

    // C. Komisi Bulan Ini
    $stmtMonth = $conn->prepare("
        SELECT SUM(total_komisi_kunjungan) as total FROM appointments 
        WHERE id_therapist = :id AND status_pembayaran = 'Verified' AND MONTH(waktu_reservasi) = MONTH(CURDATE()) AND YEAR(waktu_reservasi) = YEAR(CURDATE()) AND deleted_at IS NULL
    ");
    $stmtMonth->execute([':id' => $therapist_id]);
    $comm_month = $stmtMonth->fetch(PDO::FETCH_ASSOC)['total'];

    // D. Komisi Custom Range (Jika dikirim dari frontend)
    $comm_custom = 0;
    if (!empty($_GET['start_date']) && !empty($_GET['end_date'])) {
        $stmtCustom = $conn->prepare("
            SELECT SUM(total_komisi_kunjungan) as total FROM appointments 
            WHERE id_therapist = :id AND status_pembayaran = 'Verified' 
              AND DATE(waktu_reservasi) BETWEEN :start_date AND :end_date AND deleted_at IS NULL
        ");
        $stmtCustom->execute([
            ':id' => $therapist_id,
            ':start_date' => $_GET['start_date'],
            ':end_date' => $_GET['end_date']
        ]);
        $comm_custom = $stmtCustom->fetch(PDO::FETCH_ASSOC)['total'];
    }

    // ========================================================
    // Jika mode all_on_process, ambil semua jadwal On Process tanpa filter tanggal
    $all_on_process = isset($_GET['all_on_process']) && $_GET['all_on_process'] == '1';

    if ($all_on_process) {
        $stmtSched = $conn->prepare("
            SELECT id, nama_pasien, usia_saat_ini, bb_saat_ini, waktu_reservasi, alamat_lengkap, status_jadwal,
                   no_hp_ortu, link_shareloc, keluhan_awal, suhu_Pasien, bb_real_terapis,
                   (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
                    FROM appointment_details ad 
                    JOIN services s ON ad.id_service = s.id 
                    WHERE ad.id_appointment = appointments.id) as rincian_layanan,
                   (SELECT GROUP_CONCAT(DISTINCT k.nama_kategori SEPARATOR ' + ')
                    FROM appointment_details ad
                    JOIN services s ON ad.id_service = s.id
                    LEFT JOIN kategori k ON s.kategori_id = k.id_kategori
                    WHERE ad.id_appointment = appointments.id) as kategori_layanan
            FROM appointments 
            WHERE id_therapist = :id 
              AND status_jadwal = 'Diproses'
              AND deleted_at IS NULL
            ORDER BY waktu_reservasi ASC
        ");
        $stmtSched->execute([':id' => $therapist_id]);
    } elseif (isset($_GET['include_overdue']) && $_GET['include_overdue'] == '1') {
        // Query khusus (misal dari Pemeriksaan Klinis / StartService): sertakan jadwal overdue yang masih Menunggu/Diproses
        $stmtSched = $conn->prepare("
            SELECT id, nama_pasien, usia_saat_ini, bb_saat_ini, waktu_reservasi, alamat_lengkap, status_jadwal,
                   no_hp_ortu, link_shareloc, keluhan_awal, suhu_Pasien, bb_real_terapis,
                   (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
                    FROM appointment_details ad 
                    JOIN services s ON ad.id_service = s.id 
                    WHERE ad.id_appointment = appointments.id) as rincian_layanan,
                   (SELECT GROUP_CONCAT(DISTINCT k.nama_kategori SEPARATOR ' + ')
                    FROM appointment_details ad
                    JOIN services s ON ad.id_service = s.id
                    LEFT JOIN kategori k ON s.kategori_id = k.id_kategori
                    WHERE ad.id_appointment = appointments.id) as kategori_layanan
            FROM appointments 
            WHERE id_therapist = :id 
              AND deleted_at IS NULL
              AND (
                DATE(waktu_reservasi) = :filter_date
                OR (
                  status_jadwal IN ('Menunggu', 'Diproses')
                  AND DATE(waktu_reservasi) < :filter_date2
                )
              )
            ORDER BY waktu_reservasi ASC
        ");
        $stmtSched->execute([':id' => $therapist_id, ':filter_date' => $filter_date, ':filter_date2' => $filter_date]);
    } else {
        // Query default dashboard terapis: HANYA jadwal pada tanggal terpilih (default hari ini), tidak menampilkan jadwal kemarin
        $stmtSched = $conn->prepare("
            SELECT id, nama_pasien, usia_saat_ini, bb_saat_ini, waktu_reservasi, alamat_lengkap, status_jadwal,
                   no_hp_ortu, link_shareloc, keluhan_awal, suhu_Pasien, bb_real_terapis,
                   (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
                    FROM appointment_details ad 
                    JOIN services s ON ad.id_service = s.id 
                    WHERE ad.id_appointment = appointments.id) as rincian_layanan,
                   (SELECT GROUP_CONCAT(DISTINCT k.nama_kategori SEPARATOR ' + ')
                    FROM appointment_details ad
                    JOIN services s ON ad.id_service = s.id
                    LEFT JOIN kategori k ON s.kategori_id = k.id_kategori
                    WHERE ad.id_appointment = appointments.id) as kategori_layanan
            FROM appointments 
            WHERE id_therapist = :id 
              AND deleted_at IS NULL
              AND DATE(waktu_reservasi) = :filter_date
            ORDER BY waktu_reservasi ASC
        ");
        $stmtSched->execute([':id' => $therapist_id, ':filter_date' => $filter_date]);
    }
    
    $schedules = [];
    while ($row = $stmtSched->fetch(PDO::FETCH_ASSOC)) {
        $ui_status = $row['status_jadwal'];

        $kat_str = strtolower($row['kategori_layanan'] ?? '');
        $has_outlet = (strpos($kat_str, 'outlet') !== false);
        $has_homecare = (strpos($kat_str, 'homecare') !== false);

        if ($has_outlet && $has_homecare) {
            $jenis_layanan = 'Outlet & Homecare';
            $lokasi_kunjungan = 'Outlet / ' . ($row['alamat_lengkap'] ?: 'Alamat Pasien');
        } elseif ($has_outlet) {
            $jenis_layanan = 'Outlet';
            $lokasi_kunjungan = 'Outlet (Klinik)';
        } elseif ($has_homecare) {
            $jenis_layanan = 'Homecare';
            $lokasi_kunjungan = $row['alamat_lengkap'] ?: 'Alamat Pasien (Homecare)';
        } else {
            $jenis_layanan = 'Homecare';
            $lokasi_kunjungan = $row['alamat_lengkap'];
        }

        $schedules[] = [
            "id" => (int)$row['id'],
            "childName" => $row['nama_pasien'],
            "usia" => $row['usia_saat_ini'],
            "bb" => $row['bb_saat_ini'],
            "time" => $row['waktu_reservasi'], 
            "address" => $lokasi_kunjungan,
            "raw_address" => $row['alamat_lengkap'],
            "jenis_layanan" => $jenis_layanan,
            "status" => $ui_status,
            "phone" => $row['no_hp_ortu'],
            "mapLink" => $row['link_shareloc'],
            "complaint" => $row['keluhan_awal'],
            "services"             => $row['rincian_layanan'],
            "waktu_reservasi_raw" => $row['waktu_reservasi'],
            "status_db"           => $row['status_jadwal'],
            "is_overdue"          => (date('Y-m-d', strtotime($row['waktu_reservasi'])) < $hari_ini) ? true : false
        ];
    }

    // ========================================================
    // BAGIAN 4: RIWAYAT SINGKAT (5 TRANSAKSI TERAKHIR)
    // ========================================================
    $stmtHist = $conn->prepare("
        SELECT a.id, a.nama_pasien, a.waktu_reservasi, a.total_komisi_kunjungan,
               (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
                FROM appointment_details ad 
                JOIN services s ON ad.id_service = s.id 
                WHERE ad.id_appointment = a.id) as nama_layanan
        FROM appointments a
        WHERE a.id_therapist = :id 
          AND (a.status_jadwal = 'Selesai' OR a.status_pembayaran = 'Verified')
          AND a.deleted_at IS NULL
        ORDER BY a.waktu_reservasi DESC LIMIT 5
    ");
    $stmtHist->execute([':id' => $therapist_id]);
    
    $history = [];
    while ($row = $stmtHist->fetch(PDO::FETCH_ASSOC)) {
        $date_db = date('Y-m-d', strtotime($row['waktu_reservasi']));
        $date_yesterday = date('Y-m-d', strtotime('-1 day'));
        
        if ($date_db == $hari_ini) { $display_date = 'Hari Ini'; }
        elseif ($date_db == $date_yesterday) { $display_date = 'Kemarin'; }
        else { $display_date = date('d M Y', strtotime($row['waktu_reservasi'])); }

        $history[] = [
            "id" => (int)$row['id'],
            "childName" => $row['nama_pasien'],
            "serviceName" => $row['nama_layanan'] ? $row['nama_layanan'] : 'Layanan Umum',
            "date" => $display_date,
            "commission" => (int)$row['total_komisi_kunjungan']
        ];
    }

    // ========================================================
    // BAGIAN 5: FORMAT OUTPUT JSON
    // ========================================================
    echo json_encode([
        "status" => 200,
        "message" => "Berhasil memuat data",
        "data" => [
            "profile" => [
                "name" => $therapist['nama_terapis'],
                "status" => $current_status,
                "commissions" => [
                    "today" => (int)$comm_today,
                    "weekly" => (int)$comm_week,
                    "monthly" => (int)$comm_month,
                    "custom" => (int)$comm_custom
                ]
            ],
            "schedules" => $schedules,
            "history" => $history
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => "Error: " . $e->getMessage()]);
}
?>