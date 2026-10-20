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
                            (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ')
                             FROM appointment_details ad
                             JOIN services s ON ad.id_service = s.id
                             WHERE ad.id_appointment = a.id AND ad.deleted_at IS NULL) AS service_name
                        FROM appointments a
                        JOIN therapists t ON a.id_therapist = t.id
                        WHERE a.id = ? LIMIT 1";
                
                $stmt = $conn->prepare($sql);
                $stmt->execute([$id]);
                $detail = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($detail) {
                    $detail['id'] = (int)$detail['id'];
                    $detail['total_harga_kunjungan'] = (float)$detail['total_harga_kunjungan'];
                    $detail['total_komisi_kunjungan'] = (float)$detail['total_komisi_kunjungan'];
                    $detail['total_bersih'] = $detail['total_bersih'] ? (float)$detail['total_bersih'] : null;
                    
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
                            a.nama_pasien AS patient, 
                            t.nama_terapis AS therapist, 
                            a.metode_bayar_admin AS plan_method, 
                            COALESCE(a.metode_bayar_terapis, 'Belum Input') AS actual_method,
                            a.waktu_reservasi AS appointment_date,
                            a.status_jadwal,
                            a.status_pembayaran,
                            a.alasan_penolakan,
                            a.waktu_penolakan,
                            CASE 
                                WHEN a.status_pembayaran = 'Verified' THEN 'verified'
                                WHEN a.status_pembayaran = 'Rejected' THEN 'rejected'
                                WHEN a.metode_bayar_terapis IS NULL OR a.metode_bayar_terapis = '' THEN 'waiting_therapist'
                                WHEN a.metode_bayar_admin != a.metode_bayar_terapis THEN 'mismatch'
                                ELSE 'pending'
                            END AS type
                        FROM appointments a
                        JOIN therapists t ON a.id_therapist = t.id
                        WHERE a.deleted_at IS NULL
                          AND a.status_jadwal != 'Dibatalkan'
                        ORDER BY a.waktu_reservasi DESC";
    
                $stmt = $conn->query($sql);
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($data as &$task) $task['id'] = (int)$task['id'];
                
                echo json_encode(["status" => 200, "message" => "Sukses", "data" => $data]);
            }
            break;

        case 'POST': // VERIFIKASI / PENOLAKAN DATA (UBAH STATUS & LOG)
            if (isset($input['id'])) {
                $id_target = (int)$input['id'];
                
                // Jika dari frontend mengirim user_id, gunakan itu. Jika tidak, default 1 (Admin)
                $user_id = isset($input['user_id']) ? $input['user_id'] : 1; 
                $action = isset($input['action']) ? $input['action'] : 'verify';

                // Self-heal skema untuk instalasi lama
                try {
                    $cols = $conn->query("SHOW COLUMNS FROM appointments")->fetchAll(PDO::FETCH_COLUMN, 0);
                    if (!in_array('alasan_penolakan', $cols)) {
                        $conn->exec("ALTER TABLE appointments ADD COLUMN alasan_penolakan TEXT NULL AFTER status_pembayaran");
                    }
                    if (!in_array('waktu_penolakan', $cols)) {
                        $conn->exec("ALTER TABLE appointments ADD COLUMN waktu_penolakan DATETIME NULL AFTER alasan_penolakan");
                    }
                    $type_col = $conn->query("SHOW COLUMNS FROM appointments LIKE 'status_pembayaran'")->fetch(PDO::FETCH_ASSOC);
                    if ($type_col && strpos($type_col['Type'], 'Rejected') === false) {
                        $conn->exec("ALTER TABLE appointments MODIFY COLUMN status_pembayaran ENUM('Unverified','Verified','Rejected') NOT NULL DEFAULT 'Unverified'");
                    }
                } catch (Exception $schemaError) {
                    // Abaikan: operasi utama akan memberi error yang jelas bila skema tidak siap
                }

                // 1. Ambil data lama sebelum diproses
                // Kita ambil data krusial yang berkaitan dengan rekonsiliasi pembayaran
                $old_stmt = $conn->prepare("SELECT id, nama_pasien, status_jadwal, metode_bayar_admin, metode_bayar_terapis, total_harga_kunjungan, total_komisi_kunjungan, total_bersih, status_pembayaran, alasan_penolakan, waktu_penolakan FROM appointments WHERE id = ?");
                $old_stmt->execute([$id_target]);
                $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

                if (!$data_lama) {
                    http_response_code(404);
                    echo json_encode(["status" => 404, "message" => "Data appointment tidak ditemukan"]);
                    exit();
                }

                if ($data_lama['status_jadwal'] === 'Dibatalkan') {
                    http_response_code(400);
                    echo json_encode(["status" => 400, "message" => "Jadwal ini telah dibatalkan dan tidak perlu diverifikasi"]);
                    exit();
                }

                // ===== AKSI TOLAK =====
                if ($action === 'reject') {
                    if ($data_lama['status_pembayaran'] === 'Verified') {
                        http_response_code(400);
                        echo json_encode(["status" => 400, "message" => "Pembayaran yang sudah diverifikasi tidak dapat ditolak."]);
                        exit();
                    }

                    $alasan = isset($input['alasan_penolakan']) ? trim($input['alasan_penolakan']) : '';
                    if ($alasan === '') {
                        http_response_code(400);
                        echo json_encode(["status" => 400, "message" => "Alasan penolakan wajib diisi."]);
                        exit();
                    }
                    if (strlen($alasan) > 1000) {
                        http_response_code(400);
                        echo json_encode(["status" => 400, "message" => "Alasan penolakan maksimal 1000 karakter."]);
                        exit();
                    }

                    $waktu_penolakan = date('Y-m-d H:i:s');
                    $stmt = $conn->prepare("UPDATE appointments SET status_pembayaran = 'Rejected', alasan_penolakan = ?, waktu_penolakan = ? WHERE id = ?");
                    $stmt->execute([$alasan, $waktu_penolakan, $id_target]);

                    $data_baru = $data_lama;
                    $data_baru['status_pembayaran'] = 'Rejected';
                    $data_baru['alasan_penolakan'] = $alasan;
                    $data_baru['waktu_penolakan'] = $waktu_penolakan;

                    $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'appointments', ?, ?, ?)");
                    $log_stmt->execute([
                        $user_id, 
                        $id_target, 
                        json_encode($data_lama), 
                        json_encode($data_baru)
                    ]);

                    echo json_encode([
                        "status" => 200, 
                        "message" => "Pembayaran berhasil ditolak",
                        "data" => [
                            "id" => $id_target,
                            "status_pembayaran" => "Rejected",
                            "alasan_penolakan" => $alasan,
                            "waktu_penolakan" => $waktu_penolakan
                        ]
                    ]);
                    exit();
                }

                // ===== AKSI VERIFIKASI (default) =====
                if (empty($data_lama['metode_bayar_terapis'])) {
                    http_response_code(400);
                    echo json_encode(["status" => 400, "message" => "Pembayaran belum dapat diverifikasi karena terapis belum menginput laporan / metode pembayaran dari lapangan."]);
                    exit();
                }

                // Hitung total bersih untuk keperluan log
                $kalkulasi_bersih = $data_lama['total_harga_kunjungan'] - $data_lama['total_komisi_kunjungan'];

                // 2. Eksekusi query update utama (sekalian membersihkan jejak penolakan)
                $stmt = $conn->prepare("UPDATE appointments SET status_pembayaran = 'Verified', total_bersih = (total_harga_kunjungan - total_komisi_kunjungan), alasan_penolakan = NULL, waktu_penolakan = NULL WHERE id = ?");
                $stmt->execute([$id_target]);

                // 3. Siapkan data baru (Sama dengan data lama, namun status dan total bersih berubah)
                $data_baru = $data_lama;
                $data_baru['status_pembayaran'] = 'Verified';
                $data_baru['total_bersih'] = $kalkulasi_bersih; // Simpan nilai bersih ke dalam log
                $data_baru['alasan_penolakan'] = null;
                $data_baru['waktu_penolakan'] = null;

                // 4. Catat ke audit_logs
                $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'appointments', ?, ?, ?)");
                $log_stmt->execute([
                    $user_id, 
                    $id_target, 
                    json_encode($data_lama), 
                    json_encode($data_baru)
                ]);

                echo json_encode(["status" => 200, "message" => "Pembayaran berhasil diverifikasi dan total bersih tersimpan"]);
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
