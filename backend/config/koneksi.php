<?php

$host = "localhost";
$user = "root";       
$pass = "";           
$db   = "db_awee_babycare";

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    
    // Inisiasi koneksi
    $conn = new PDO($dsn, $user, $pass);
    
    // Konfigurasi PDO
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 2. Ubah mode fetch default menjadi Associative Array
    // (Misal: $row['nama_anak'] bukan $row[0])
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // 3. Matikan emulasi prepare statement untuk keamanan ekstra dari SQL Injection
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

} catch(PDOException $e) {
    // Jika koneksi gagal, hentikan eksekusi dan kirim response JSON ke React
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500); // 500 Internal Server Error
    
    die(json_encode([
        "status" => 500, 
        "message" => "ERROR 404 NOT FOUND, DATABASE FAILED TO CONNECT",
        "error_detail" => $e->getMessage()
    ]));
}
?>