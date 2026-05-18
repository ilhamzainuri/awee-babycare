<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents("php://input"), true);

    switch ($method) {
        case 'GET':
            $stmt = $conn->query("SELECT * FROM services WHERE deleted_at IS NULL ORDER BY created_at DESC");
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $stmt->fetchAll()]);
            break;

        case 'POST': // CREATE
            $stmt = $conn->prepare("INSERT INTO services (nama_layanan, harga_saat_ini, persentase_komisi) VALUES (?, ?, ?)");
            $stmt->execute([$input['nama_layanan'], $input['harga_saat_ini'], $input['persentase_komisi']]);
            echo json_encode(["status" => 201, "message" => "Layanan ditambahkan"]);
            break;

        case 'PUT': // UPDATE
            $stmt = $conn->prepare("UPDATE services SET nama_layanan=?, harga_saat_ini=?, persentase_komisi=? WHERE id=?");
            $stmt->execute([$input['nama_layanan'], $input['harga_saat_ini'], $input['persentase_komisi'], $_GET['id']]);
            echo json_encode(["status" => 200, "message" => "Layanan diperbarui"]);
            break;

        case 'DELETE': // SOFT DELETE
            $stmt = $conn->prepare("UPDATE services SET deleted_at=NOW() WHERE id=?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["status" => 200, "message" => "Layanan dihapus"]);
            break;
            
        default:
            http_response_code(405); echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>