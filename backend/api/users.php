<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        // Ambil daftar akun yang rolenya 'therapist' dan belum dihapus
        $stmt = $conn->prepare("SELECT id, username FROM users WHERE role = 'therapist' AND deleted_at IS NULL ORDER BY username ASC");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
    } else {
        http_response_code(405); 
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => "Database Error: " . $e->getMessage()]);
}
?>