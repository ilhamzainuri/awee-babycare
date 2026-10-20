<?php
// Letak file: backend/api/restore.php
// Endpoint untuk me-restore data yang telah di-soft-delete, berdasarkan audit log

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
    // 1. Ambil data log yang akan di-restore
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
        echo json_encode(["status" => 400, "message" => "Hanya data dengan riwayat 'delete' yang dapat dipulihkan."]);
        exit();
    }

    $tabel     = $log['nama_tabel'];
    $record_id = (int)$log['record_id'];

    // 2. Daftar tabel yang mendukung restore (soft-delete dengan kolom deleted_at)
    $allowed_tables = ['therapists', 'services', 'appointments', 'users', 'kategori'];

    if (!in_array($tabel, $allowed_tables)) {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Tabel '$tabel' tidak mendukung fitur pemulihan (restore)."]);
        exit();
    }

    // 3. Pastikan record masih ada di tabel
    $pk = getTablePrimaryKey($tabel);
    $stmtCheck = $conn->prepare("SELECT `$pk` AS id, deleted_at FROM `$tabel` WHERE `$pk` = ? LIMIT 1");
    $stmtCheck->execute([$record_id]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(["status" => 404, "message" => "Data dengan ID #$record_id tidak ditemukan di tabel '$tabel'. Mungkin sudah dihapus secara permanen."]);
        exit();
    }

    if ($existing['deleted_at'] === null) {
        http_response_code(400);
        echo json_encode(["status" => 400, "message" => "Data #$record_id di tabel '$tabel' sudah aktif atau sudah pernah dipulihkan sebelumnya."]);
        exit();
    }

    // 4. Jalankan restore: set deleted_at = NULL
    if ($tabel === 'therapists') {
        $stmtRestore = $conn->prepare("UPDATE `$tabel` SET deleted_at = NULL, status_aktif = 1 WHERE `$pk` = ?");
    } else {
        $stmtRestore = $conn->prepare("UPDATE `$tabel` SET deleted_at = NULL WHERE `$pk` = ?");
    }
    $stmtRestore->execute([$record_id]);

    // 5. Ambil data setelah restore untuk dicatat di log
    $stmtAfter = $conn->prepare("SELECT * FROM `$tabel` WHERE `$pk` = ? LIMIT 1");
    $stmtAfter->execute([$record_id]);
    $dataAfter = $stmtAfter->fetch(PDO::FETCH_ASSOC);

    // 6. Catat ke audit_logs sebagai aksi 'restore'
    $stmtAudit = $conn->prepare(
        "INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) 
         VALUES (?, 'restore', ?, ?, ?, ?)"
    );
    $stmtAudit->execute([
        $user_id,
        $tabel,
        $record_id,
        $log['data_lama'],        // snapshot saat data sebelum dihapus
        json_encode($dataAfter)   // data saat aktif kembali
    ]);

    // Format nama entitas yang dipulihkan jika ada
    $namaEntitas = '';
    if (!empty($log['data_lama'])) {
        $parsedOld = json_decode($log['data_lama'], true);
        if (is_array($parsedOld)) {
            $namaEntitas = $parsedOld['nama_layanan'] ?? $parsedOld['nama_terapis'] ?? $parsedOld['nama_pasien'] ?? $parsedOld['username'] ?? '';
        }
    }

    $entityLabel = $namaEntitas ? "'$namaEntitas' " : "";

    echo json_encode([
        "status"  => 200,
        "message" => "Data {$entityLabel}(#$record_id) di tabel '$tabel' berhasil dipulihkan.",
        "data"    => [
            "tabel"     => $tabel, 
            "record_id" => $record_id
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => "Database error: " . $e->getMessage()]);
}
?>
