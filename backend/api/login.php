<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    // Menangkap data JSON dari React
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->username) || empty($data->password)) {
        throw new Exception("Username dan password wajib diisi.");
    }

    $username = trim($data->username);
    $password = $data->password; // Menggunakan plain-text sesuai struktur database saat ini

    // Cek user di database
    $stmt = $conn->prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?");
    $stmt->execute([$username, $password]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("Username atau password salah.");
    }

    // Jika login berhasil, kembalikan data user (tanpa password)
    echo json_encode([
        "status" => 200, 
        "message" => "Login Berhasil", 
        "data" => $user
    ]);

} catch(Exception $e) {
    http_response_code(401); 
    echo json_encode([
        "status" => 401, 
        "message" => $e->getMessage()
    ]);
}
?>