<?php
// Letak file: backend/api/auditlog.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once __DIR__ . '/../config/koneksi.php';

try {
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
                        } else {
                            $row['is_restored'] = true;
                        }
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