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
            // JIKA MENERIMA PARAMETER ID (GET DETAIL APPOINTMENT)
            if (isset($_GET['id'])) {
                $id = (int)$_GET['id'];
                $sql = "SELECT 
                            a.*, 
                            t.nama_terapis AS therapist,
                            t.no_whatsapp AS therapist_phone,
                            s.nama_layanan AS service_name
                        FROM appointments a
                        JOIN therapists t ON a.id_therapist = t.id
                        LEFT JOIN appointment_details ad ON a.id = ad.id_appointment
                        LEFT JOIN services s ON ad.id_service = s.id
                        WHERE a.id = ? LIMIT 1";
                
                $stmt = $conn->prepare($sql);
                $stmt->execute([$id]);
                $detail = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($detail) {
                    $detail['id'] = (int)$detail['id'];
                    $detail['total_harga_kunjungan'] = (float)$detail['total_harga_kunjungan'];
                    $detail['total_komisi_kunjungan'] = (float)$detail['total_komisi_kunjungan'];
                    
                    echo json_encode(["status" => 200, "message" => "Sukses", "data" => $detail]);
                } else {
                    http_response_code(404);
                    echo json_encode(["status" => 404, "message" => "Data tidak ditemukan"]);
                }
            } 
            // JIKA TANPA PARAMETER ID (AMBIL SEMUA DATA)
            else {
                $sql = "SELECT 
                            a.id, 
                            a.nama_anak AS patient, 
                            t.nama_terapis AS therapist, 
                            a.metode_bayar_admin AS plan_method, 
                            COALESCE(a.metode_bayar_terapis, 'Belum Input') AS actual_method,
                            a.waktu_reservasi AS appointment_date,
                            CASE 
                                WHEN a.status_pembayaran = 'Verified' THEN 'verified'
                                WHEN a.metode_bayar_terapis IS NOT NULL AND a.metode_bayar_admin != a.metode_bayar_terapis THEN 'mismatch'
                                ELSE 'pending'
                            END AS type
                        FROM appointments a
                        JOIN therapists t ON a.id_therapist = t.id
                        ORDER BY a.waktu_reservasi DESC";
    
                $stmt = $conn->query($sql);
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($data as &$task) $task['id'] = (int)$task['id'];
                
                echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
            }
            break;

        case 'POST': // VERIFIKASI DATA (UBAH STATUS & LOG)
            if (isset($input['id'])) {
                $id_target = $input['id'];
                
                // Jika dari frontend mengirim user_id, gunakan itu. Jika tidak, default 1 (Admin)
                $user_id = isset($input['user_id']) ? $input['user_id'] : 1; 

                // 1. Ambil data lama sebelum diverifikasi
                // Kita ambil data krusial yang berkaitan dengan rekonsiliasi pembayaran
                $old_stmt = $conn->prepare("SELECT id, nama_anak, metode_bayar_admin, metode_bayar_terapis, total_harga_kunjungan, total_komisi_kunjungan, status_pembayaran FROM appointments WHERE id = ?");
                $old_stmt->execute([$id_target]);
                $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

                if ($data_lama) {
                    // 2. Eksekusi query update utama
                    $stmt = $conn->prepare("UPDATE appointments SET status_pembayaran = 'Verified' WHERE id = ?");
                    $stmt->execute([$id_target]);

                    // 3. Siapkan data baru (Sama dengan data lama, namun status_pembayaran berubah)
                    $data_baru = $data_lama;
                    $data_baru['status_pembayaran'] = 'Verified';

                    // 4. Catat ke audit_logs
                    $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'appointments', ?, ?, ?)");
                    $log_stmt->execute([
                        $user_id, 
                        $id_target, 
                        json_encode($data_lama), 
                        json_encode($data_baru)
                    ]);

                    echo json_encode(["status" => 200, "message" => "Pembayaran berhasil diverifikasi"]);
                } else {
                    http_response_code(404);
                    echo json_encode(["status" => 404, "message" => "Data appointment tidak ditemukan"]);
                }
            } else {
                http_response_code(400); 
                echo json_encode(["status" => 400, "message" => "ID tidak ditemukan"]);
            }
            break;

        default:
            http_response_code(405); 
            echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => 500, "message" => $e->getMessage()]);
}
?>