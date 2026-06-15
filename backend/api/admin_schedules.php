<?php
// Letak file: backend/api/admin_schedules.php

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

$filter_date = isset($_GET['date']) && !empty($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$search_query = isset($_GET['search']) ? trim($_GET['search']) : '';
$status_filter = isset($_GET['status']) ? trim($_GET['status']) : 'All';

try {
    $whereClause = "a.deleted_at IS NULL AND DATE(a.waktu_reservasi) = :filterDate";
    $params = [':filterDate' => $filter_date];

    if ($status_filter !== 'All') {
        $whereClause .= " AND a.status_jadwal = :statusFilter";
        $params[':statusFilter'] = $status_filter;
    }

    if ($search_query !== '') {
        $whereClause .= " AND (a.nama_anak LIKE :searchQuery OR t.nama_terapis LIKE :searchQuery OR a.id = :searchId)";
        $params[':searchQuery'] = "%" . $search_query . "%";
        $params[':searchId'] = (int)$search_query;
    }

    $sql = "SELECT 
                a.id, 
                a.nama_anak, 
                a.usia_saat_ini, 
                a.bb_saat_ini, 
                a.bb_real_terapis,
                a.jenis_kelamin,
                a.alamat_lengkap, 
                a.link_shareloc, 
                a.no_hp_ortu, 
                a.keluhan_awal, 
                a.waktu_reservasi,
                DATE_FORMAT(a.waktu_reservasi, '%H:%i') AS jam_reservasi,
                a.status_jadwal, 
                a.metode_bayar_admin, 
                a.metode_bayar_terapis, 
                a.status_pembayaran, 
                a.total_harga_kunjungan,
                a.total_komisi_kunjungan,
                t.nama_terapis,
                t.id AS id_therapist,
                UPPER(SUBSTRING(t.nama_terapis, 1, 2)) AS initials
            FROM appointments a
            JOIN therapists t ON a.id_therapist = t.id
            WHERE $whereClause
            ORDER BY a.waktu_reservasi ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Ambil detail layanan untuk masing-masing appointment
    $stmtDetail = $conn->prepare("
        SELECT 
            s.nama_layanan, 
            ad.harga_snapshot 
        FROM appointment_details ad
        JOIN services s ON ad.id_service = s.id
        WHERE ad.id_appointment = :id_appointment AND ad.deleted_at IS NULL
    ");

    foreach ($appointments as &$app) {
        $app['id'] = (int)$app['id'];
        $app['total_harga_kunjungan'] = (float)$app['total_harga_kunjungan'];
        $app['total_komisi_kunjungan'] = (float)$app['total_komisi_kunjungan'];
        
        $stmtDetail->execute([':id_appointment' => $app['id']]);
        $app['services'] = $stmtDetail->fetchAll(PDO::FETCH_ASSOC);
        foreach ($app['services'] as &$s) {
            $s['harga_snapshot'] = (float)$s['harga_snapshot'];
        }
    }

    echo json_encode([
        "status" => 200,
        "message" => "Berhasil memuat jadwal harian",
        "data" => $appointments
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => 500,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>
