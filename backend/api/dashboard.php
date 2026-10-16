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
require_once __DIR__ . '/../config/koneksi.php';

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
                    a.nama_pasien AS patient, 
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

    // KPI 4: Menunggu Verifikasi Pembayaran (Hanya yang tidak Dibatalkan)
    $stmt = $conn->query("SELECT COUNT(id) as unverified FROM appointments WHERE status_pembayaran = 'Unverified' AND status_jadwal != 'Dibatalkan' AND deleted_at IS NULL");
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
    $alerts = [];
    $tracked_ids = [];

    // 1. Alert Kritis: Mismatch Metode Bayar (Admin vs Lapangan)
    $stmtMismatch = $conn->query("
        SELECT id, nama_pasien, metode_bayar_admin, metode_bayar_terapis, waktu_reservasi, total_harga_kunjungan 
        FROM appointments 
        WHERE metode_bayar_admin != metode_bayar_terapis 
        AND metode_bayar_terapis IS NOT NULL
        AND status_pembayaran = 'Unverified'
        AND status_jadwal != 'Dibatalkan'
        AND deleted_at IS NULL
        ORDER BY waktu_reservasi DESC
        LIMIT 4
    ");
    $mismatches = $stmtMismatch->fetchAll(PDO::FETCH_ASSOC);

    if ($mismatches) {
        foreach ($mismatches as $alert) {
            $tracked_ids[] = (int)$alert['id'];
            $nominal = number_format($alert['total_harga_kunjungan'], 0, ',', '.');
            $alerts[] = [
                'id' => 'mismatch-' . $alert['id'],
                'title' => $alert['nama_pasien'] . ' - Selisih Metode Bayar',
                'time' => date('h:i A', strtotime($alert['waktu_reservasi'])),
                'description' => "Terdeteksi selisih metode bayar pada #TRX-{$alert['id']} (Rp {$nominal}). Rencana: {$alert['metode_bayar_admin']}, Lapangan: {$alert['metode_bayar_terapis']}.",
                'type' => 'error',
                'category' => 'payment',
                'link' => '/verify'
            ];
        }
    }

    // 2. Alert Mendesak: Layanan Sudah 'Selesai' Tetapi Pembayaran Masih 'Unverified'
    $stmtSelesaiUnverified = $conn->query("
        SELECT id, nama_pasien, waktu_reservasi, total_harga_kunjungan, metode_bayar_admin, metode_bayar_terapis 
        FROM appointments 
        WHERE status_jadwal = 'Selesai'
        AND status_pembayaran = 'Unverified'
        AND deleted_at IS NULL
        ORDER BY waktu_reservasi DESC
        LIMIT 4
    ");
    $selesaiUnverified = $stmtSelesaiUnverified->fetchAll(PDO::FETCH_ASSOC);

    if ($selesaiUnverified) {
        foreach ($selesaiUnverified as $alert) {
            if (in_array((int)$alert['id'], $tracked_ids)) continue;
            $tracked_ids[] = (int)$alert['id'];
            $nominal = number_format($alert['total_harga_kunjungan'], 0, ',', '.');
            $metode = $alert['metode_bayar_terapis'] ?: $alert['metode_bayar_admin'] ?: 'Transfer/Cash';
            $alerts[] = [
                'id' => 'urgent-unverified-' . $alert['id'],
                'title' => $alert['nama_pasien'] . ' - Layanan Selesai Belum Verifikasi',
                'time' => date('h:i A', strtotime($alert['waktu_reservasi'])),
                'description' => "Layanan #TRX-{$alert['id']} (Rp {$nominal}) telah selesai, namun status pembayaran masih Unverified ({$metode}).",
                'type' => 'error',
                'category' => 'payment',
                'link' => '/verify'
            ];
        }
    }

    // 3. Alert: Ada Bukti Transfer / Pembayaran Menunggu Validasi Admin
    $stmtBukti = $conn->query("
        SELECT id, nama_pasien, waktu_reservasi, total_harga_kunjungan, metode_bayar_admin 
        FROM appointments 
        WHERE bukti_bayar_url IS NOT NULL 
        AND status_pembayaran = 'Unverified'
        AND status_jadwal != 'Dibatalkan'
        AND deleted_at IS NULL
        ORDER BY waktu_reservasi DESC
        LIMIT 4
    ");
    $buktiUnverified = $stmtBukti->fetchAll(PDO::FETCH_ASSOC);

    if ($buktiUnverified) {
        foreach ($buktiUnverified as $alert) {
            if (in_array((int)$alert['id'], $tracked_ids)) continue;
            $tracked_ids[] = (int)$alert['id'];
            $nominal = number_format($alert['total_harga_kunjungan'], 0, ',', '.');
            $alerts[] = [
                'id' => 'bukti-unverified-' . $alert['id'],
                'title' => $alert['nama_pasien'] . ' - Bukti Bayar Perlu Validasi',
                'time' => date('h:i A', strtotime($alert['waktu_reservasi'])),
                'description' => "Bukti pembayaran telah diunggah untuk #TRX-{$alert['id']} (Rp {$nominal}). Silakan verifikasi transaksi ini.",
                'type' => 'warning',
                'category' => 'payment',
                'link' => '/verify'
            ];
        }
    }

    // 4. Alert Umum Pembayaran: Jika masih ada transaksi unverified lainnya
    if (count($alerts) < 4) {
        $notInClause = !empty($tracked_ids) ? ("AND id NOT IN (" . implode(',', $tracked_ids) . ")") : "";
        $stmtGeneral = $conn->query("
            SELECT id, nama_pasien, waktu_reservasi, total_harga_kunjungan, metode_bayar_admin 
            FROM appointments 
            WHERE status_pembayaran = 'Unverified'
            AND status_jadwal != 'Dibatalkan'
            AND deleted_at IS NULL
            $notInClause
            ORDER BY waktu_reservasi DESC
            LIMIT 3
        ");
        $generalUnverified = $stmtGeneral->fetchAll(PDO::FETCH_ASSOC);

        if ($generalUnverified) {
            foreach ($generalUnverified as $alert) {
                $tracked_ids[] = (int)$alert['id'];
                $nominal = number_format($alert['total_harga_kunjungan'], 0, ',', '.');
                $alerts[] = [
                    'id' => 'unverified-' . $alert['id'],
                    'title' => $alert['nama_pasien'] . ' - Menunggu Verifikasi',
                    'time' => date('h:i A', strtotime($alert['waktu_reservasi'])),
                    'description' => "Reservasi #TRX-{$alert['id']} (Rp {$nominal}) menunggu verifikasi pembayaran ({$alert['metode_bayar_admin']}).",
                    'type' => 'warning',
                    'category' => 'payment',
                    'link' => '/verify'
                ];
            }
        }
    }

    // Ambil peringatan dari Audit Log (Data terhapus & pemulihan data)
    try {
        $stmtAudit = $conn->query("
            SELECT al.id, al.aksi, al.nama_tabel, al.record_id, al.data_lama, al.created_at,
                   COALESCE(u.username, 'System') AS user
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.aksi IN ('delete', 'restore')
            ORDER BY al.created_at DESC
            LIMIT 5
        ");
        $auditLogs = $stmtAudit->fetchAll(PDO::FETCH_ASSOC);

        $allowed_tables = ['therapists', 'services', 'appointments', 'users'];

        foreach ($auditLogs as $al) {
            $namaEntitas = '';
            if (!empty($al['data_lama'])) {
                $parsed = json_decode($al['data_lama'], true);
                if (is_array($parsed)) {
                    $namaEntitas = $parsed['nama_layanan'] ?? $parsed['nama_terapis'] ?? $parsed['nama_pasien'] ?? $parsed['username'] ?? '';
                }
            }
            $entityLabel = $namaEntitas ? " \"$namaEntitas\"" : "";

            if ($al['aksi'] === 'delete' && in_array($al['nama_tabel'], $allowed_tables)) {
                $tbl = $al['nama_tabel'];
                $chk = $conn->prepare("SELECT id, deleted_at FROM `$tbl` WHERE id = ? LIMIT 1");
                $chk->execute([$al['record_id']]);
                $rec = $chk->fetch(PDO::FETCH_ASSOC);

                // Tampilkan sebagai warning jika data masih soft-deleted (belum di-restore)
                if ($rec && $rec['deleted_at'] !== null) {
                    $alerts[] = [
                        'id' => 'audit-del-' . $al['id'],
                        'title' => ucfirst($al['nama_tabel']) . ' Dihapus' . ($entityLabel ? ": $namaEntitas" : ""),
                        'time' => date('h:i A', strtotime($al['created_at'])),
                        'description' => "{$al['user']} menghapus {$al['nama_tabel']}{$entityLabel} (#ID:{$al['record_id']}). Dapat dipulihkan di menu Audit Log.",
                        'type' => 'warning',
                        'link' => '/audit-log'
                    ];
                }
            } elseif ($al['aksi'] === 'restore') {
                $alerts[] = [
                    'id' => 'audit-res-' . $al['id'],
                    'title' => ucfirst($al['nama_tabel']) . ' Dipulihkan' . ($entityLabel ? ": $namaEntitas" : ""),
                    'time' => date('h:i A', strtotime($al['created_at'])),
                    'description' => "{$al['user']} memulihkan data {$al['nama_tabel']}{$entityLabel} (#ID:{$al['record_id']}).",
                    'type' => 'info',
                    'link' => '/audit-log'
                ];
            }
        }
    } catch (Exception $e) {
        // Ignore if error querying audit_logs
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