<?php
// Letak file: backend/config/koneksi.php

$host = "localhost";
$user = "root";       // Default username XAMPP/Laragon
$pass = "";           // Default password XAMPP (kosong)
$db   = "db_awee_babycare"; // Nama database Anda

try {
    // Membuat string koneksi PDO dengan charset utf8mb4 (mendukung emoji dan karakter khusus)
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    
    // Inisiasi koneksi
    $conn = new PDO($dsn, $user, $pass);
    
    // Konfigurasi PDO
    // 1. Ubah mode error menjadi Exception (agar mudah dilacak)
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
        "message" => "Koneksi Database Gagal. Pastikan MySQL berjalan dan nama database benar.",
        "error_detail" => $e->getMessage() // Opsional: Hapus baris ini saat rilis ke publik (production)
    ]));
}
?>