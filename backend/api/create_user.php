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

    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $role = $_POST['role'] ?? '';
    $actor_id = isset($_POST['actor_id']) && $_POST['actor_id'] !== '' ? (int)$_POST['actor_id'] : null;

    if(empty($username) || empty($password)){
        throw new Exception("Data belum lengkap");
    }

    if (strlen($username) < 3 || strlen($username) > 100) {
        throw new Exception("Username harus terdiri dari 3-100 karakter.");
    }

    if (!preg_match('/^[A-Za-z0-9._-]+$/', $username)) {
        throw new Exception("Username hanya boleh berisi huruf, angka, titik, underscore, atau strip (tanpa spasi).");
    }

    if (strlen($password) < 8 || strlen($password) > 255) {
        throw new Exception("Password harus terdiri dari 8-255 karakter.");
    }

    if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
        throw new Exception("Password harus mengandung huruf dan angka.");
    }

    if (!in_array($role, ['admin', 'therapist'], true)) {
        throw new Exception("Role tidak valid.");
    }

    $cek = $conn->prepare("
        SELECT id
        FROM users
        WHERE username = ?
    ");

    $cek->execute([$username]);

    if($cek->fetch()){
        http_response_code(409);
        echo json_encode([
            "status" => 409,
            "message" => "Username \"$username\" sudah digunakan. Silakan pilih username lain."
        ]);
        exit();
    }

    $fotoName = null;

if (
    isset($_FILES['foto']) &&
    $_FILES['foto']['error'] === UPLOAD_ERR_OK
) {

    $ext = strtolower(pathinfo(
        $_FILES['foto']['name'],
        PATHINFO_EXTENSION
    ));

    if (!in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
        throw new Exception("Format foto harus JPG, JPEG, atau PNG.");
    }

    if ($_FILES['foto']['size'] > 2097152) {
        throw new Exception("Ukuran foto maksimal 2MB.");
    }

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

    $new_record_id = $conn->lastInsertId();

    $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'create', 'users', ?, NULL, ?)");
    $log_stmt->execute([
        $actor_id,
        $new_record_id,
        json_encode([
            "username" => $username,
            "role" => $role,
            "foto" => $fotoName
        ])
    ]);

    echo json_encode([
        "status"=>200,
        "message"=>"User berhasil ditambahkan"
    ]);

} catch(PDOException $e){

    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode([
            "status"=>409,
            "message"=>"Username \"$username\" sudah digunakan. Silakan pilih username lain."
        ]);
        exit();
    }

    http_response_code(400);

    echo json_encode([
        "status"=>400,
        "message"=>$e->getMessage()
    ]);

} catch(Exception $e){

    http_response_code(400);

    echo json_encode([
        "status"=>400,
        "message"=>$e->getMessage()
    ]);
} 