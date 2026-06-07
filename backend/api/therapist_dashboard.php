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
    // BAGIAN 3: DAFTAR JADWAL KUNJUNGAN HARI INI KE DEPAN
    // ========================================================
    $stmtSched = $conn->prepare("
        SELECT id, nama_anak, usia_saat_ini, bb_saat_ini, waktu_reservasi, alamat_lengkap, status_jadwal,
               no_hp_ortu, link_shareloc, keluhan_awal, suhu_anak, bb_real_terapis,
               (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
                FROM appointment_details ad 
                JOIN services s ON ad.id_service = s.id 
                WHERE ad.id_appointment = appointments.id) as rincian_layanan
        FROM appointments 
        WHERE id_therapist = :id 
          AND DATE(waktu_reservasi) >= :hari_ini
          AND status_jadwal NOT IN ('Selesai', 'Dibatalkan')
          AND deleted_at IS NULL
        ORDER BY waktu_reservasi ASC
    ");
    $stmtSched->execute([':id' => $therapist_id, ':hari_ini' => $hari_ini]);
    
    $schedules = [];
    while ($row = $stmtSched->fetch(PDO::FETCH_ASSOC)) {
        $ui_status = ($row['status_jadwal'] === 'Diproses') ? 'On Process' : 'Pending';
        $schedules[] = [
            "id" => (int)$row['id'],
            "childName" => $row['nama_anak'],
            "usia" => $row['usia_saat_ini'],
            "bb" => $row['bb_saat_ini'],
            "time" => $row['waktu_reservasi'], 
            "address" => $row['alamat_lengkap'],
            "status" => $ui_status,
            "phone" => $row['no_hp_ortu'],
            "mapLink" => $row['link_shareloc'],
            "complaint" => $row['keluhan_awal'],
            "services" => $row['rincian_layanan']
        ];
    }

    // ========================================================
    // BAGIAN 4: RIWAYAT SINGKAT (5 TRANSAKSI TERAKHIR)
    // ========================================================
    $stmtHist = $conn->prepare("
        SELECT a.id, a.nama_anak, a.waktu_reservasi, a.total_komisi_kunjungan,
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
            "childName" => $row['nama_anak'],
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