<?php
// Letak file: backend/api/permanent_delete.php
// Endpoint untuk menghapus data secara permanen dari database berdasarkan audit log

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once __DIR__ . '/../config/koneksi.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$audit_log_id = isset($input['audit_log_id']) ? (int)$input['audit_log_id'] : 0;
$user_id      = isset($input['user_id'])      ? (int)$input['user_id']      : 1;

if (!$audit_log_id) {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "audit_log_id wajib diisi."]);
    exit();
}

try {
    // 1. Ambil data log
    $stmtLog = $conn->prepare("SELECT id, user_id, aksi, nama_tabel, record_id, data_lama FROM audit_logs WHERE id = ? LIMIT 1");
    $stmtLog->execute([$audit_log_id]);
    $log = $stmtLog->fetch(PDO::FETCH_ASSOC);

    if (!$log) {
        http_response_code(404);
        echo json_encode(["status" => 404, "message" => "Audit log tidak ditemukan."]);
        exit();
    }

    if ($log['aksi'] !== 'delete') {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Hanya data dengan status 'delete' yang dapat dihapus permanen."]);
        exit();
    }

    $tabel     = $log['nama_tabel'];
    $record_id = (int)$log['record_id'];

    $allowed_tables = ['therapists', 'services', 'appointments', 'users', 'kategori'];

    if (!in_array($tabel, $allowed_tables)) {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Tabel '$tabel' tidak didukung untuk hapus permanen."]);
        exit();
    }

    // 2. Pastikan record masih ada di tabel
    $pk = getTablePrimaryKey($tabel);
    $stmtCheck = $conn->prepare("SELECT `$pk` AS id FROM `$tabel` WHERE `$pk` = ? LIMIT 1");
    $stmtCheck->execute([$record_id]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(["status" => 404, "message" => "Data dengan ID #$record_id di tabel '$tabel' sudah tidak ada (mungkin telah dihapus permanen)."]);
        exit();
    }

    // 3. Eksekusi Hapus Permanen
    $conn->beginTransaction();
    $conn->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // Jika appointment, hapus juga detail itemnya
    if ($tabel === 'appointments') {
        $stmtDelDetails = $conn->prepare("DELETE FROM appointment_details WHERE id_appointment = ?");
        $stmtDelDetails->execute([$record_id]);
    }

    $stmtDelete = $conn->prepare("DELETE FROM `$tabel` WHERE `$pk` = ?");
    $stmtDelete->execute([$record_id]);

    $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");
    $conn->commit();

    // 4. Catat aktivitas Hapus Permanen di audit_logs
    $namaEntitas = '';
    if (!empty($log['data_lama'])) {
        $parsed = json_decode($log['data_lama'], true);
        if (is_array($parsed)) {
            $namaEntitas = $parsed['nama_layanan'] ?? $parsed['nama_terapis'] ?? $parsed['nama_pasien'] ?? $parsed['username'] ?? '';
        }
    }
    $entityLabel = $namaEntitas ? "'$namaEntitas' " : "";

    $stmtAudit = $conn->prepare(
        "INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) 
         VALUES (?, 'delete', ?, ?, ?, ?)"
    );
    $dataBaru = json_encode([
        "keterangan"    => "Hapus permanen manual oleh pengguna",
        "snapshot_lama" => $log['data_lama']
    ]);
    $stmtAudit->execute([
        $user_id,
        $tabel,
        $record_id,
        $log['data_lama'],
        $dataBaru
    ]);

    echo json_encode([
        "status"  => 200,
        "message" => "Data {$entityLabel}(#$record_id) di tabel '$tabel' berhasil dihapus permanen.",
        "data"    => [
            "tabel"     => $tabel, 
            "record_id" => $record_id
        ]
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
        $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");
    }
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => "Database error: " . $e->getMessage()]);
}
?>
