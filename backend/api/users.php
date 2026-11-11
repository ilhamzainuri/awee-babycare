<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (($_GET['action'] ?? '') === 'list') {
            $stmt = $conn->query("SELECT id, username, role, foto, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC");
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } else {
            $stmt = $conn->prepare("SELECT id, username FROM users WHERE role = 'therapist' AND deleted_at IS NULL ORDER BY username ASC");
            $stmt->execute();
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    } elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $requester_id = isset($_GET['requester_id']) ? (int)$_GET['requester_id'] : 0;
        $actor_id_input = isset($_GET['actor_id']) ? (int)$_GET['actor_id'] : 0;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => 400, "message" => "ID user wajib disertakan"]);
            exit();
        }

        if ($requester_id && $requester_id === $id) {
            http_response_code(400);
            echo json_encode(["status" => 400, "message" => "Tidak dapat menghapus akun yang sedang digunakan"]);
            exit();
        }

        $stmt = $conn->prepare("SELECT id, username, role, foto FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode(["status" => 404, "message" => "User tidak ditemukan"]);
            exit();
        }

        $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'delete', ?, ?, ?, NULL)");
        $actor_id = $actor_id_input ?: ($requester_id ?: null);

        $conn->beginTransaction();
        try {
            $conn->prepare("UPDATE users SET deleted_at = NOW() WHERE id = ?")->execute([$id]);
            $log_stmt->execute([$actor_id, 'users', $id, json_encode($user)]);

            $t_stmt = $conn->prepare("SELECT id, nama_terapis, no_whatsapp FROM therapists WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
            $t_stmt->execute([$id]);
            $therapist = $t_stmt->fetch(PDO::FETCH_ASSOC);

            if ($therapist) {
                $conn->prepare("UPDATE therapists SET deleted_at = NOW(), status_aktif = 0 WHERE id = ?")->execute([$therapist['id']]);
                $log_stmt->execute([$actor_id, 'therapists', $therapist['id'], json_encode($therapist)]);
            }

            $conn->commit();
        } catch (Exception $e) {
            $conn->rollBack();
            throw $e;
        }

        echo json_encode(["status" => 200, "message" => "User berhasil dihapus"]);
    } else {
        http_response_code(405);
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => 500, "message" => "Database Error: " . $e->getMessage()]);
}
?>
