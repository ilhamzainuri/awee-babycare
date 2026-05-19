<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Ambil log terbaru, maksimal 50 data, Join dengan tabel users untuk mendapat nama
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
                ORDER BY al.created_at DESC
                LIMIT 50";
        
        $stmt = $conn->query($sql);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
    } else {
        http_response_code(405); 
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>