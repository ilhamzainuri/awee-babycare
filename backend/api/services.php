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
            $stmt = $conn->query("SELECT s.*, k.nama_kategori FROM services s LEFT JOIN kategori k ON s.kategori_id = k.id_kategori WHERE s.deleted_at IS NULL ORDER BY s.created_at DESC");
            // Menggunakan PDO::FETCH_ASSOC agar data lebih bersih tanpa index angka
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST': // CREATE
            // 1. Eksekusi query insert utama
            $stmt = $conn->prepare("INSERT INTO services (kategori_id, nama_layanan, type_layanan, harga_saat_ini, persentase_komisi) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$input['kategori_id'], $input['nama_layanan'], $input['type_layanan'] ?? null, $input['harga_saat_ini'], $input['persentase_komisi']]);
            
            // 2. Dapatkan ID layanan baru
            $new_record_id = $conn->lastInsertId();
            
            // FILTER PAYLOAD: Pastikan hanya field layanan yang masuk log
            $data_log_baru = [
                "kategori_id" => $input['kategori_id'],
                "nama_layanan" => $input['nama_layanan'],
                "type_layanan" => $input['type_layanan'] ?? null,
                "harga_saat_ini" => $input['harga_saat_ini'],
                "persentase_komisi" => $input['persentase_komisi']
            ];

            // 3. Catat ke audit_logs
            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'create', 'services', ?, NULL, ?)");
            $log_stmt->execute([
                1, // ID Admin (sementara hardcode)
                $new_record_id, 
                json_encode($data_log_baru)
            ]);

            echo json_encode(["status" => 201, "message" => "Layanan ditambahkan"]);
            break;

        case 'PUT': // UPDATE
            $id_target = $_GET['id'];

            // 1. Ambil data lama sebelum diubah
            $old_stmt = $conn->prepare("SELECT kategori_id, nama_layanan, type_layanan, harga_saat_ini, persentase_komisi FROM services WHERE id = ?");
            $old_stmt->execute([$id_target]);
            $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

            // 2. Eksekusi query update utama
            $stmt = $conn->prepare("UPDATE services SET kategori_id=?, nama_layanan=?, type_layanan=?, harga_saat_ini=?, persentase_komisi=? WHERE id=?");
            $stmt->execute([$input['kategori_id'], $input['nama_layanan'], $input['type_layanan'] ?? null, $input['harga_saat_ini'], $input['persentase_komisi'], $id_target]);
            
            // FILTER PAYLOAD: Pastikan hanya field layanan yang masuk log
            $data_log_baru = [
                "kategori_id" => $input['kategori_id'],
                "nama_layanan" => $input['nama_layanan'],
                "type_layanan" => $input['type_layanan'] ?? null,
                "harga_saat_ini" => $input['harga_saat_ini'],
                "persentase_komisi" => $input['persentase_komisi']
            ];

            // 3. Catat ke audit_logs
            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'services', ?, ?, ?)");
            $log_stmt->execute([
                1, 
                $id_target, 
                json_encode($data_lama), 
                json_encode($data_log_baru)
            ]);

            echo json_encode(["status" => 200, "message" => "Layanan diperbarui"]);
            break;

        case 'DELETE': // SOFT DELETE
            $id_target = $_GET['id'];

            // 1. Ambil data lama sebelum dihapus
            $old_stmt = $conn->prepare("SELECT kategori_id, nama_layanan, type_layanan, harga_saat_ini, persentase_komisi FROM services WHERE id = ?");
            $old_stmt->execute([$id_target]);
            $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

            // 2. Eksekusi query delete utama
            $stmt = $conn->prepare("UPDATE services SET deleted_at=NOW() WHERE id=?");
            $stmt->execute([$id_target]);
            
            // 3. Catat ke audit_logs
            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'delete', 'services', ?, ?, NULL)");
            $log_stmt->execute([
                1, 
                $id_target, 
                json_encode($data_lama)
            ]);

            echo json_encode(["status" => 200, "message" => "Layanan dihapus"]);
            break;
            
        default:
            http_response_code(405); 
            echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>