<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);

require_once '../config/koneksi.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
        exit;
    }

    if (!isset($_GET['id']) || empty($_GET['id'])) {
        echo json_encode(["status" => 400, "message" => "ID user wajib disertakan"]);
        exit;
    }

    $id = (int)$_GET['id'];

    // Ambil data user (Kecuali password demi keamanan API)
    $stmt = $conn->prepare("SELECT id, username, foto, role FROM users WHERE id = ?");
    $stmt->execute([$id]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode([
            "status" => 200, 
            "message" => "Sukses mengambil data user", 
            "data" => $user
        ]);
    } else {
        echo json_encode(["status" => 404, "message" => "User tidak ditemukan"]);
    }

} catch(PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => "Database Error: " . $e->getMessage()]);
}
?>