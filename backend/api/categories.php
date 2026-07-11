<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { 
    http_response_code(200); 
    exit(); 
}

ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents("php://input"), true);

    switch ($method) {
        case 'GET':
            $stmt = $conn->query("SELECT id_kategori as id, nama_kategori FROM kategori ORDER BY id_kategori DESC");
            echo json_encode([
                "status" => 200, 
                "message" => "Sukses", 
                "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        case 'POST': // CREATE
            if (empty($input['nama_kategori'])) {
                http_response_code(400);
                echo json_encode([
                    "status" => 400, 
                    "message" => "Nama kategori tidak boleh kosong"
                ]);
                break;
            }
            
            $stmt = $conn->prepare("INSERT INTO kategori (nama_kategori) VALUES (?)");
            $stmt->execute([$input['nama_kategori']]);
            $new_id = $conn->lastInsertId();

            echo json_encode([
                "status" => 201, 
                "message" => "Kategori berhasil ditambahkan", 
                "data" => [
                    "id" => (int)$new_id, 
                    "nama_kategori" => $input['nama_kategori']
                ]
            ]);
            break;

        case 'PUT': // UPDATE
            $id_target = $_GET['id'] ?? null;
            if (!$id_target) {
                http_response_code(400);
                echo json_encode(["status" => 400, "message" => "Parameter ID tidak ditemukan"]);
                break;
            }
            if (empty($input['nama_kategori'])) {
                http_response_code(400);
                echo json_encode(["status" => 400, "message" => "Nama kategori tidak boleh kosong"]);
                break;
            }

            $stmt = $conn->prepare("UPDATE kategori SET nama_kategori = ? WHERE id_kategori = ?");
            $stmt->execute([$input['nama_kategori'], $id_target]);

            echo json_encode([
                "status" => 200, 
                "message" => "Kategori berhasil diperbarui"
            ]);
            break;

        case 'DELETE': // DELETE
            $id_target = $_GET['id'] ?? null;
            if (!$id_target) {
                http_response_code(400);
                echo json_encode(["status" => 400, "message" => "Parameter ID tidak ditemukan"]);
                break;
            }

            // Validasi: Cek apakah ada layanan yang menggunakan kategori ini
            $check = $conn->prepare("SELECT COUNT(*) FROM services WHERE kategori_id = ? AND deleted_at IS NULL");
            $check->execute([$id_target]);
            $service_count = $check->fetchColumn();

            if ($service_count > 0) {
                http_response_code(400);
                echo json_encode([
                    "status" => 400, 
                    "message" => "Kategori tidak bisa dihapus karena masih digunakan oleh " . $service_count . " data layanan."
                ]);
                break;
            }

            $stmt = $conn->prepare("DELETE FROM kategori WHERE id_kategori = ?");
            $stmt->execute([$id_target]);

            echo json_encode([
                "status" => 200, 
                "message" => "Kategori berhasil dihapus"
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                "status" => 405, 
                "message" => "Method Not Allowed"
            ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => 500, 
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>
