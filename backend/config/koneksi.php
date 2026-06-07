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

function getRevenueSummary($conn, $whereClause = "a.deleted_at IS NULL", $params = []) {
    $sql = "SELECT 
                SUM(CASE WHEN a.status_jadwal != 'Dibatalkan' THEN a.total_harga_kunjungan ELSE 0 END) as total_kotor,
                SUM(CASE WHEN a.status_pembayaran = 'Verified' THEN a.total_bersih ELSE 0 END) as total_bersih
            FROM appointments a 
            WHERE $whereClause";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);

    return [
        'kotor'  => $res['total_kotor'] ? (float)$res['total_kotor'] : 0.00,
        'bersih' => $res['total_bersih'] ? (float)$res['total_bersih'] : 0.00
    ];
}

function getTotalCommission($conn, $whereClause = "a.deleted_at IS NULL", $params = []) {
    $sql = "SELECT 
                SUM(a.total_komisi_kunjungan) as total_komisi
            FROM appointments a 
            WHERE $whereClause";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);

    return $res['total_komisi'] ? (float)$res['total_komisi'] : 0.00;
}
?>