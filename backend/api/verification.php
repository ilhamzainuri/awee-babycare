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
        case 'GET': // MENGAMBIL DATA UNVERIFIED
            $sql = "SELECT 
                        a.id, 
                        a.nama_anak AS patient, 
                        t.nama_terapis AS therapist, 
                        a.metode_bayar_admin AS plan_method, 
                        COALESCE(a.metode_bayar_terapis, 'Belum Input') AS actual_method,
                        CASE 
                            WHEN a.metode_bayar_terapis IS NOT NULL AND a.metode_bayar_admin != a.metode_bayar_terapis THEN 'mismatch'
                            ELSE 'pending'
                        END AS type
                    FROM appointments a
                    JOIN therapists t ON a.id_therapist = t.id
                    WHERE a.status_pembayaran = 'Unverified'
                    ORDER BY a.id ASC";
            
            $stmt = $conn->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($data as &$task) $task['id'] = (int)$task['id'];
            
            echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
            break;

        case 'POST': // VERIFIKASI DATA (UBAH STATUS)
            if (isset($input['id'])) {
                $stmt = $conn->prepare("UPDATE appointments SET status_pembayaran = 'Verified' WHERE id = ?");
                $stmt->execute([$input['id']]);
                echo json_encode(["status" => 200, "message" => "Pembayaran berhasil diverifikasi"]);
            } else {
                http_response_code(400); 
                echo json_encode(["status" => 400, "message" => "ID tidak ditemukan"]);
            }
            break;

        default:
            http_response_code(405); echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>