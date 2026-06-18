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

require_once '../config/koneksi.php';

try {

    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? '';

    if(empty($username) || empty($password)){
        throw new Exception("Data belum lengkap");
    }

    $cek = $conn->prepare("
        SELECT id
        FROM users
        WHERE username = ?
    ");

    $cek->execute([$username]);

    if($cek->fetch()){
        throw new Exception("Username sudah digunakan");
    }

    $fotoName = null;

if (
    isset($_FILES['foto']) &&
    $_FILES['foto']['error'] === UPLOAD_ERR_OK
) {

    $ext = pathinfo(
        $_FILES['foto']['name'],
        PATHINFO_EXTENSION
    );

    $fotoName = time().'_'.uniqid().'.'.$ext;

    if (!move_uploaded_file(
        $_FILES['foto']['tmp_name'],
        "../uploads/".$fotoName
    )) {
        throw new Exception("Gagal upload foto");
    }
}

    $stmt = $conn->prepare("
        INSERT INTO users
        (
            username,
            password,
            foto,
            role,
            created_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            NOW()
        )
    ");

    $stmt->execute([
        $username,
        $password,
        $fotoName,
        $role
    ]);

    echo json_encode([
        "status"=>200,
        "message"=>"User berhasil ditambahkan"
    ]);

} catch(PDOException $e){

    http_response_code(400);

    echo json_encode([
        "status"=>400,
        "message"=>$e->getMessage()
    ]);
} 