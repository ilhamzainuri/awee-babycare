<?php
// Letak file: backend/api/auditlog.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once __DIR__ . '/../config/koneksi.php';

// =========================================================================
// LOGIKA CLEANUP OTOMATIS: Hapus permanen data yang > 30 hari di soft-delete
// =========================================================================
function cleanupExpiredDeletedRecords($conn) {
    try {
        $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-30 days'));

        $conn->beginTransaction();
        $conn->exec("SET FOREIGN_KEY_CHECKS = 0;");

        // 1. Appointments yang expired > 30 hari
        $stmtExpApp = $conn->prepare("SELECT id FROM appointments WHERE deleted_at IS NOT NULL AND deleted_at < ?");
        $stmtExpApp->execute([$thirtyDaysAgo]);
        $expiredApps = $stmtExpApp->fetchAll(PDO::FETCH_COLUMN);

        if (!empty($expiredApps)) {
            $inClause = implode(',', array_map('intval', $expiredApps));
            $conn->exec("DELETE FROM appointment_details WHERE id_appointment IN ($inClause)");
            $conn->exec("DELETE FROM appointments WHERE id IN ($inClause)");
        }

        // 2. Services yang expired > 30 hari
        $stmtDelServices = $conn->prepare("DELETE FROM services WHERE deleted_at IS NOT NULL AND deleted_at < ?");
        $stmtDelServices->execute([$thirtyDaysAgo]);

        // 3. Therapists yang expired > 30 hari
        $stmtDelTherapists = $conn->prepare("DELETE FROM therapists WHERE deleted_at IS NOT NULL AND deleted_at < ?");
        $stmtDelTherapists->execute([$thirtyDaysAgo]);

        // 4. Users role therapist yang expired > 30 hari
        $stmtDelUsers = $conn->prepare("DELETE FROM users WHERE role = 'therapist' AND deleted_at IS NOT NULL AND deleted_at < ?");
        $stmtDelUsers->execute([$thirtyDaysAgo]);

        $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");
        $conn->commit();
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
            $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");
        }
    }
}

try {
    // Jalankan auto-cleanup 30 hari
    cleanupExpiredDeletedRecords($conn);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $limit  = isset($_GET['limit'])  ? max(1, (int)$_GET['limit'])  : 50;
        $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

        // Filter opsional berdasarkan aksi (misal: hanya 'delete' untuk tab restore)
        $filter_aksi = isset($_GET['aksi']) && in_array($_GET['aksi'], ['create','update','delete','restore'])
            ? $_GET['aksi'] : null;

        $where = $filter_aksi ? "WHERE al.aksi = :aksi" : "";
        $params = $filter_aksi ? [':aksi' => $filter_aksi] : [];

        $sql = "SELECT 
                    al.id, 
                    al.aksi, 
                    al.nama_tabel, 
                    al.record_id, 
                    al.data_lama, 
                    al.data_baru, 
                    al.created_at, 
                    COALESCE(u.username, 'System') AS user,
                    COALESCE(u.role, 'system') AS role
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                $where
                ORDER BY al.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $conn->prepare($sql);
        foreach ($params as $key => $val) $stmt->bindValue($key, $val);
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Periksa apakah item dengan aksi 'delete' masih berstatus soft-deleted dan dapat di-restore
        $allowed_tables = ['therapists', 'services', 'appointments', 'users'];

        foreach ($data as &$row) {
            $row['id'] = (int)$row['id'];
            $row['record_id'] = (int)$row['record_id'];
            $row['can_restore'] = false;
            $row['is_restored'] = false;
            $row['is_permanently_deleted'] = false;
            $row['days_remaining'] = null;

            if ($row['aksi'] === 'delete' && in_array($row['nama_tabel'], $allowed_tables)) {
                $tbl = $row['nama_tabel'];
                $recId = $row['record_id'];

                try {
                    $checkStmt = $conn->prepare("SELECT id, deleted_at FROM `$tbl` WHERE id = ? LIMIT 1");
                    $checkStmt->execute([$recId]);
                    $rec = $checkStmt->fetch(PDO::FETCH_ASSOC);

                    if ($rec) {
                        if ($rec['deleted_at'] !== null) {
                            $row['can_restore'] = true;

                            // Hitung sisa hari dari batas 30 hari
                            $delTimestamp = strtotime($rec['deleted_at']);
                            $daysElapsed = floor((time() - $delTimestamp) / 86400);
                            $row['days_remaining'] = max(0, 30 - (int)$daysElapsed);
                        } else {
                            $row['is_restored'] = true;
                        }
                    } else {
                        // Data sudah tidak ditemukan di tabel (telah dihapus permanen)
                        $row['is_permanently_deleted'] = true;
                    }
                } catch (Exception $ex) {
                    // Ignore column check error if table schema differs
                }
            }
        }
        unset($row);

        // Total count untuk pagination
        $countSql = "SELECT COUNT(*) FROM audit_logs al $where";
        $countStmt = $conn->prepare($countSql);
        foreach ($params as $key => $val) $countStmt->bindValue($key, $val);
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        echo json_encode([
            "status"  => 200,
            "message" => "Sukses",
            "data"    => $data,
            "meta"    => ["total" => $total, "limit" => $limit, "offset" => $offset]
        ]);
    } else {
        http_response_code(405);
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>