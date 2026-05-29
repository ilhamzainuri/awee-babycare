<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Konfigurasi Koneksi Database
$host = "127.0.0.1";
$db_name = "db_awee_babycare";
$username = "root";
$password = "";

try {
    $db = new PDO("mysql:host={$host};dbname={$db_name}", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["status" => 500, "message" => "Koneksi database gagal: " . $exception->getMessage()]);
    exit();
}

// 2. Ambil ID User / Terapis secara Dinamis dari Frontend
if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "Akses ditolak: ID User tidak disertakan dalam request."]);
    exit();
}

$user_id = (int)$_GET['user_id']; 

try {
    // ---- A. AMBIL DATA PROFIL & IDENTITAS TERAPIS ----
    $stmt = $db->prepare("SELECT id, nama_terapis, status_aktif FROM therapists WHERE user_id = :user_id LIMIT 1");
    $stmt->execute([':user_id' => $user_id]);
    $therapist = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$therapist) {
        throw new Exception("Data terapis tidak ditemukan untuk user ini.");
    }
    
    $therapist_id = $therapist['id'];

    // Cek apakah terapis sedang memiliki jadwal 'Diproses' saat ini
    $stmtStatus = $db->prepare("SELECT id FROM appointments WHERE id_therapist = :id AND status_jadwal = 'Diproses' LIMIT 1");
    $stmtStatus->execute([':id' => $therapist_id]);
    $is_on_process = $stmtStatus->fetch(PDO::FETCH_ASSOC);
    
    $current_status = $is_on_process ? 'On Process' : 'Standby';

    // ---- B. HITUNG TOTAL KOMISI MINGGU INI (VERIFIED) ----
    $stmtComm = $db->prepare("
        SELECT SUM(total_komisi_kunjungan) as total_komisi 
        FROM appointments 
        WHERE id_therapist = :id 
          AND status_pembayaran = 'Verified' 
          AND YEARWEEK(waktu_reservasi, 1) = YEARWEEK(CURDATE(), 1)
    ");
    $stmtComm->execute([':id' => $therapist_id]);
    $comm_result = $stmtComm->fetch(PDO::FETCH_ASSOC);
    $weekly_commission = (int)($comm_result['total_komisi'] ?? 0);

    // ---- C. DAFTAR JADWAL HARI INI (AKTIF) ----
    $stmtSched = $db->prepare("
        SELECT id, nama_anak, waktu_reservasi, alamat_lengkap, status_jadwal 
        FROM appointments 
        WHERE id_therapist = :id 
          AND DATE(waktu_reservasi) = CURDATE()
          AND status_jadwal NOT IN ('Selesai', 'Dibatalkan')
        ORDER BY waktu_reservasi ASC
    ");
    $stmtSched->execute([':id' => $therapist_id]);
    
    $schedules = [];
    while ($row = $stmtSched->fetch(PDO::FETCH_ASSOC)) {
        $ui_status = 'Pending';
        if ($row['status_jadwal'] === 'Menunggu') $ui_status = 'Pending';
        if ($row['status_jadwal'] === 'Diproses') $ui_status = 'On Process';
        
        $schedules[] = [
            "id" => (int)$row['id'],
            "childName" => $row['nama_anak'],
            "time" => date('H:i', strtotime($row['waktu_reservasi'])),
            "address" => $row['alamat_lengkap'],
            "status" => $ui_status
        ];
    }

    // ---- D. RIWAYAT SINGKAT (5 LAYANAN TERAKHIR) ----
    $stmtHist = $db->prepare("
        SELECT a.id, a.nama_anak, a.waktu_reservasi, a.total_komisi_kunjungan,
               (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
                FROM appointment_details ad 
                JOIN services s ON ad.id_service = s.id 
                WHERE ad.id_appointment = a.id) as nama_layanan
        FROM appointments a
        WHERE a.id_therapist = :id 
          AND (a.status_jadwal = 'Selesai' OR a.status_pembayaran = 'Verified')
        ORDER BY a.waktu_reservasi DESC 
        LIMIT 5
    ");
    $stmtHist->execute([':id' => $therapist_id]);
    
    $history = [];
    while ($row = $stmtHist->fetch(PDO::FETCH_ASSOC)) {
        $date_db = date('Y-m-d', strtotime($row['waktu_reservasi']));
        $date_today = date('Y-m-d');
        $date_yesterday = date('Y-m-d', strtotime('-1 day'));
        
        if ($date_db == $date_today) {
            $display_date = 'Hari Ini';
        } elseif ($date_db == $date_yesterday) {
            $display_date = 'Kemarin';
        } else {
            $display_date = date('d M Y', strtotime($row['waktu_reservasi'])); 
        }

        $history[] = [
            "id" => (int)$row['id'],
            "childName" => $row['nama_anak'],
            "serviceName" => $row['nama_layanan'] ?? 'Layanan Umum',
            "date" => $display_date,
            "commission" => (int)$row['total_komisi_kunjungan']
        ];
    }

    // ---- E. KELUARKAN OUTPUT JSON ----
    echo json_encode([
        "status" => 200,
        "message" => "Berhasil memuat data",
        "data" => [
            "profile" => [
                "name" => $therapist['nama_terapis'],
                "status" => $current_status,
                "weeklyCommission" => $weekly_commission
            ],
            "schedules" => $schedules,
            "history" => $history
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => 500,
        "message" => $e->getMessage()
    ]);
}
?>