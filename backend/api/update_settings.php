<?php
// Letak file: backend/api/update_settings.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);

require_once '../config/koneksi.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
        exit();
    }

    // Validasi input mandatory
    if (!isset($_POST['id']) || !isset($_POST['username'])) {
        echo json_encode(["status" => 400, "message" => "ID dan Username tidak boleh kosong."]);
        exit();
    }

    $id_target = (int)$_POST['id'];
    $username = trim($_POST['username']);
    
    // 1. Ambil data lama untuk Audit Log (Dari tabel users dan therapists)
    $old_stmt = $conn->prepare("
        SELECT u.username, u.password, u.foto, t.id AS therapist_id, t.nama_terapis, t.no_whatsapp 
        FROM users u 
        LEFT JOIN therapists t ON u.id = t.user_id 
        WHERE u.id = ?
    ");
    $old_stmt->execute([$id_target]);
    $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$data_lama) {
        echo json_encode(["status" => 404, "message" => "User tidak ditemukan."]);
        exit();
    }

    // ==========================================
    // BAGIAN 1: UPDATE TABEL USERS
    // ==========================================
    $query_updates_users = ["username = :username"];
    $params_users = [
        ':username' => $username,
        ':id' => $id_target
    ];
    
    $new_file_name = null;
    $data_baru_log_users = ["username" => $username];

    // Handle Password (Jika diubah)
    if (isset($_POST['password']) && trim($_POST['password']) !== "") {
        $password = trim($_POST['password']);
        $query_updates_users[] = "password = :password";
        $params_users[':password'] = $password;
        $data_baru_log_users['password'] = "[PASSWORD_DIUBAH]"; 
    }

    // Handle Upload Foto (Jika ada)
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $file_tmp = $_FILES['foto']['tmp_name'];
        $file_name = $_FILES['foto']['name'];
        $file_size = $_FILES['foto']['size'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        $allowed_ext = ['jpg', 'jpeg', 'png'];
        
        if (in_array($file_ext, $allowed_ext) && $file_size <= 2097152) { // Maks 2MB
            $new_file_name = "user_" . $id_target . "_" . time() . "." . $file_ext;
            $upload_path = "../uploads/" . $new_file_name;
            
            // Pastikan folder uploads ada
            if (!is_dir("../uploads")) {
                mkdir("../uploads", 0777, true);
            }

            if (move_uploaded_file($file_tmp, $upload_path)) {
                $query_updates_users[] = "foto = :foto";
                $params_users[':foto'] = $new_file_name;
                $data_baru_log_users['foto'] = $new_file_name;
            } else {
                echo json_encode(["status" => 500, "message" => "Gagal menyimpan foto ke server."]);
                exit();
            }
        } else {
            echo json_encode(["status" => 400, "message" => "Format foto tidak valid atau ukuran melebihi 2MB."]);
            exit();
        }
    }

    // Eksekusi Update ke tabel users
    $set_query_users = implode(", ", $query_updates_users);
    $stmt_users = $conn->prepare("UPDATE users SET $set_query_users WHERE id = :id");
    $stmt_users->execute($params_users);

    // Menyiapkan statement Audit Log
    $log_stmt = $conn->prepare("
        INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) 
        VALUES (?, 'update', ?, ?, ?, ?)
    ");

    // Eksekusi Log untuk Users
    $data_lama_users_log = [
        "username" => $data_lama['username'],
        "foto" => $data_lama['foto'],
        "password" => "[HIDDEN]"
    ];
    
    $log_stmt->execute([
        $id_target, 'users', $id_target, json_encode($data_lama_users_log), json_encode($data_baru_log_users)
    ]);


    // ==========================================
    // BAGIAN 2: UPDATE TABEL THERAPISTS
    // ==========================================
    // Jika data dari frontend ada, dan user ini memiliki relasi di tabel therapists
    if (isset($_POST['nama_terapis']) && isset($_POST['no_whatsapp']) && !empty($data_lama['therapist_id'])) {
        
        $nama_terapis = trim($_POST['nama_terapis']);
        $no_whatsapp = trim($_POST['no_whatsapp']);

        $stmt_therapists = $conn->prepare("UPDATE therapists SET nama_terapis = :nama, no_whatsapp = :wa WHERE user_id = :uid");
        $stmt_therapists->execute([
            ':nama' => $nama_terapis,
            ':wa' => $no_whatsapp,
            ':uid' => $id_target
        ]);

        // Eksekusi Log untuk Therapists
        $data_lama_therapist_log = [
            "nama_terapis" => $data_lama['nama_terapis'],
            "no_whatsapp" => $data_lama['no_whatsapp']
        ];
        
        $data_baru_therapist_log = [
            "nama_terapis" => $nama_terapis,
            "no_whatsapp" => $no_whatsapp
        ];

        $log_stmt->execute([
            $id_target, 'therapists', $data_lama['therapist_id'], json_encode($data_lama_therapist_log), json_encode($data_baru_therapist_log)
        ]);
    }

    // ==========================================
    // RESPONSE SUKSES
    // ==========================================
    $response = [
        "status" => 200,
        "message" => "Pengaturan akun berhasil diperbarui."
    ];
    
    if ($new_file_name) {
        $response["data"]["foto"] = $new_file_name;
    }
    
    echo json_encode($response);
    exit();

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => "Database Error: " . $e->getMessage()]);
    exit();
}
?>