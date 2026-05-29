<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);

// Panggil file koneksi (yang menggunakan PDO dengan variabel $conn)
require_once '../config/koneksi.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
        exit;
    }

    // Validasi input
    if (!isset($_POST['id']) || !isset($_POST['username'])) {
        echo json_encode(["status" => 400, "message" => "ID dan Username tidak boleh kosong."]);
        exit;
    }

    $id_target = (int)$_POST['id'];
    $username = trim($_POST['username']);
    
    // 1. Ambil data lama untuk Audit Log
    $old_stmt = $conn->prepare("SELECT username, password, foto FROM users WHERE id = ?");
    $old_stmt->execute([$id_target]);
    $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$data_lama) {
        echo json_encode(["status" => 404, "message" => "User tidak ditemukan."]);
        exit;
    }

    // Siapkan parameter dan query dinamis
    $query_updates = ["username = :username"];
    $params = [
        ':username' => $username,
        ':id' => $id_target
    ];
    
    $new_file_name = null;
    $data_baru_log = ["username" => $username]; // Untuk disimpan di audit_log

    // 2. Handle Password (Jika diubah)
    if (isset($_POST['password']) && trim($_POST['password']) !== "") {
        $password = trim($_POST['password']);
        
        // Catatan: Sangat disarankan mengganti ini dengan password_hash($password, PASSWORD_DEFAULT)
        // jika di sistem login Anda sudah menggunakan password_verify().
        $query_updates[] = "password = :password";
        $params[':password'] = $password;
        
        $data_baru_log['password'] = "[PASSWORD_DIUBAH]"; // Jangan simpan password plain ke tabel log
    }

    // 3. Handle Upload Foto (Jika ada)
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
                $query_updates[] = "foto = :foto";
                $params[':foto'] = $new_file_name;
                $data_baru_log['foto'] = $new_file_name;
            } else {
                echo json_encode(["status" => 500, "message" => "Gagal menyimpan foto ke server."]);
                exit;
            }
        } else {
            echo json_encode(["status" => 400, "message" => "Format foto tidak valid atau ukuran melebihi 2MB."]);
            exit;
        }
    }

    // 4. Eksekusi Update ke tabel users
    $set_query = implode(", ", $query_updates);
    $stmt = $conn->prepare("UPDATE users SET $set_query WHERE id = :id");
    $stmt->execute($params);

    // 5. Catat ke audit_logs
    // Menonaktifkan logging password lama demi keamanan
    if (isset($data_lama['password'])) {
        $data_lama['password'] = "[HIDDEN]"; 
    }

    $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'users', ?, ?, ?)");
    $log_stmt->execute([
        $id_target, // ID user yang melakukan perubahan (dirinya sendiri)
        $id_target, // ID record yang diubah
        json_encode($data_lama), 
        json_encode($data_baru_log)
    ]);

    // 6. Response Sukses
    $response = [
        "status" => 200,
        "message" => "Pengaturan akun berhasil diperbarui."
    ];
    
    // Kembalikan nama foto baru ke frontend agar localStorage ter-update
    if ($new_file_name) {
        $response["data"]["foto"] = $new_file_name;
    }
    
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => "Database Error: " . $e->getMessage()]);
}
?>