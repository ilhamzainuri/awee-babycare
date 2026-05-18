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
            $stmt = $conn->query("SELECT * FROM therapists WHERE deleted_at IS NULL ORDER BY created_at DESC");
            $data = $stmt->fetchAll();
            foreach ($data as &$t) $t['status_aktif'] = (int)$t['status_aktif'];
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
            break;

        case 'POST': // CREATE
            // Catatan: Karena ada user_id sebagai Foreign Key, untuk sementara kita isi dummy '1'
            // Nantinya harus disesuaikan dengan ID Admin yang sedang login
            $stmt = $conn->prepare("INSERT INTO therapists (user_id, nama_terapis, no_whatsapp, status_aktif) VALUES (1, ?, ?, ?)");
            $stmt->execute([$input['nama_terapis'], $input['no_whatsapp'], $input['status_aktif']]);
            echo json_encode(["status" => 201, "message" => "Terapis ditambahkan"]);
            break;

        case 'PUT': // UPDATE
            $stmt = $conn->prepare("UPDATE therapists SET nama_terapis=?, no_whatsapp=?, status_aktif=? WHERE id=?");
            $stmt->execute([$input['nama_terapis'], $input['no_whatsapp'], $input['status_aktif'], $_GET['id']]);
            echo json_encode(["status" => 200, "message" => "Terapis diperbarui"]);
            break;

        case 'DELETE': // SOFT DELETE
            $stmt = $conn->prepare("UPDATE therapists SET deleted_at=NOW() WHERE id=?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["status" => 200, "message" => "Terapis dihapus"]);
            break;

        default:
            http_response_code(405); echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>