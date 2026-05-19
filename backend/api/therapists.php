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
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($data as &$t) $t['status_aktif'] = (int)$t['status_aktif'];
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
            break;

        case 'POST': // CREATE
            $stmt = $conn->prepare("INSERT INTO therapists (user_id, nama_terapis, no_whatsapp, status_aktif) VALUES (1, ?, ?, ?)");
            $stmt->execute([$input['nama_terapis'], $input['no_whatsapp'], $input['status_aktif']]);
            
            $new_record_id = $conn->lastInsertId();
            
            // FILTER PAYLOAD: Hanya simpan data yang berhubungan dengan terapis
            $data_log_baru = [
                "nama_terapis" => $input['nama_terapis'],
                "no_whatsapp" => $input['no_whatsapp'],
                "status_aktif" => (int)$input['status_aktif']
            ];

            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'create', 'therapists', ?, NULL, ?)");
            $log_stmt->execute([1, $new_record_id, json_encode($data_log_baru)]);

            echo json_encode(["status" => 201, "message" => "Terapis ditambahkan"]);
            break;

        case 'PUT': // UPDATE
            $id_target = $_GET['id'];

            $old_stmt = $conn->prepare("SELECT nama_terapis, no_whatsapp, status_aktif FROM therapists WHERE id = ?");
            $old_stmt->execute([$id_target]);
            $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

            $stmt = $conn->prepare("UPDATE therapists SET nama_terapis=?, no_whatsapp=?, status_aktif=? WHERE id=?");
            $stmt->execute([$input['nama_terapis'], $input['no_whatsapp'], $input['status_aktif'], $id_target]);
            
            // FILTER PAYLOAD: Ambil properti terapis saja untuk menghindari polusi form frontend
            $data_log_baru = [
                "nama_terapis" => $input['nama_terapis'],
                "no_whatsapp" => $input['no_whatsapp'],
                "status_aktif" => (int)$input['status_aktif']
            ];

            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'therapists', ?, ?, ?)");
            $log_stmt->execute([1, $id_target, json_encode($data_lama), json_encode($data_log_baru)]);

            echo json_encode(["status" => 200, "message" => "Terapis diperbarui"]);
            break;

        case 'DELETE': // SOFT DELETE
            $id_target = $_GET['id'];

            $old_stmt = $conn->prepare("SELECT nama_terapis, no_whatsapp, status_aktif FROM therapists WHERE id = ?");
            $old_stmt->execute([$id_target]);
            $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

            $stmt = $conn->prepare("UPDATE therapists SET deleted_at=NOW() WHERE id=?");
            $stmt->execute([$id_target]);
            
            $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'delete', 'therapists', ?, ?, NULL)");
            $log_stmt->execute([1, $id_target, json_encode($data_lama)]);

            echo json_encode(["status" => 200, "message" => "Terapis dihapus"]);
            break;

        default:
            http_response_code(405); echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>