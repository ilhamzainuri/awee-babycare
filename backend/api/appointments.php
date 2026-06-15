<?php
// Letak file: backend/api/appointments.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

/**
 * FUNGSI BANTUAN: Menghitung total pendapatan bersih (Hanya yang Verified)
 * Fungsi ini bisa dipanggil kapan saja saat dibutuhkan oleh API
 */
function getTotalRevenue($conn) {
    $sql = "SELECT SUM(total_bersih) AS total_pendapatan FROM appointments WHERE status_pembayaran = 'Verified'";
    $stmt = $conn->query($sql);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row['total_pendapatan'] ? (float)$row['total_pendapatan'] : 0.00;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents("php://input"), true);

    // =====================================================================
    // METHOD POST: Menangani INSERT (Reservasi Baru) & UPDATE (Verifikasi)
    // =====================================================================
    if ($method === 'POST') {
        
        // KONDISI 1: JIKA ADA PARAMETER 'id_therapist' (BERARTI INI RESERVASI BARU)
        if (isset($input['id_therapist']) && isset($input['treatments'])) {
            // Cek Double Order (Overlap +/- 1 Jam)
            $waktu_reservasi = $input['waktu_reservasi'];
            $id_therapist = (int)$input['id_therapist'];

            $stmtCheckOverlap = $conn->prepare("
                SELECT waktu_reservasi, nama_anak 
                FROM appointments 
                WHERE id_therapist = :id_therapist 
                  AND status_jadwal != 'Dibatalkan' 
                  AND deleted_at IS NULL 
                  AND waktu_reservasi > DATE_SUB(:waktu_reservasi_lower, INTERVAL 1 HOUR)
                  AND waktu_reservasi < DATE_ADD(:waktu_reservasi_upper, INTERVAL 1 HOUR)
                LIMIT 1
            ");
            $stmtCheckOverlap->execute([
                ':id_therapist' => $id_therapist,
                ':waktu_reservasi_lower' => $waktu_reservasi,
                ':waktu_reservasi_upper' => $waktu_reservasi
            ]);
            $overlap = $stmtCheckOverlap->fetch(PDO::FETCH_ASSOC);

            if ($overlap) {
                http_response_code(400);
                echo json_encode([
                    "status" => 400,
                    "message" => "Gagal: Terapis tersebut sudah memiliki jadwal lain pada jam " . date('H:i', strtotime($overlap['waktu_reservasi'])) . " (" . $overlap['nama_anak'] . "). Mohon pilih waktu lain dengan selisih minimal 1 jam."
                ]);
                exit();
            }

            $conn->beginTransaction();

            // 1. Simpan Header
            $stmtHeader = $conn->prepare("
                INSERT INTO appointments (
                    id_therapist, nama_anak, usia_saat_ini, bb_saat_ini, jenis_kelamin, 
                    alamat_lengkap, link_shareloc, no_hp_ortu, keluhan_awal, 
                    waktu_reservasi, metode_bayar_admin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmtHeader->execute([
                $input['id_therapist'], $input['nama_anak'], $input['usia_saat_ini'], 
                $input['bb_saat_ini'], $input['jenis_kelamin'], $input['alamat_lengkap'], 
                $input['link_shareloc'], $input['no_hp_ortu'], $input['keluhan_awal'], 
                $input['waktu_reservasi'], $input['metode_bayar_admin']
            ]);

            $id_appointment = $conn->lastInsertId();
            $total_harga = 0;
            $total_komisi = 0;

            // 2. Loop & Simpan Rincian (SNAPSHOT LOGIC)
            $stmtDetail = $conn->prepare("
                INSERT INTO appointment_details (
                    id_appointment, id_service, harga_snapshot, 
                    persentase_komisi_snapshot, nominal_komisi_kalkulasi
                ) VALUES (?, ?, ?, ?, ?)
            ");

            $stmtCekService = $conn->prepare("SELECT harga_saat_ini, persentase_komisi FROM services WHERE id = ?");

            foreach ($input['treatments'] as $treatment) {
                $stmtCekService->execute([$treatment['id_service']]);
                $serviceData = $stmtCekService->fetch();

                if ($serviceData) {
                    $harga = $serviceData['harga_saat_ini'];
                    $persentase = $serviceData['persentase_komisi'];
                    $nominal_komisi = ($harga * $persentase) / 100;

                    $stmtDetail->execute([
                        $id_appointment, $treatment['id_service'], $harga, $persentase, $nominal_komisi
                    ]);

                    $total_harga += $harga;
                    $total_komisi += $nominal_komisi;
                }
            }

            // 3. Update Total Harga & Komisi
            $stmtUpdateTotal = $conn->prepare("UPDATE appointments SET total_harga_kunjungan = ?, total_komisi_kunjungan = ? WHERE id = ?");
            $stmtUpdateTotal->execute([$total_harga, $total_komisi, $id_appointment]);

            // 4. Catat Ke Audit Log
            $user_id_log = isset($input['user_id']) ? (int)$input['user_id'] : null;
            $stmtTerapis = $conn->prepare("SELECT nama_terapis FROM therapists WHERE id = ?");
            $stmtTerapis->execute([$input['id_therapist']]);
            $terapis = $stmtTerapis->fetchColumn();

            $layanan_list = [];
            $stmtLayananName = $conn->prepare("SELECT nama_layanan FROM services WHERE id = ?");
            foreach ($input['treatments'] as $treatment) {
                $stmtLayananName->execute([$treatment['id_service']]);
                $layananName = $stmtLayananName->fetchColumn();
                if ($layananName) $layanan_list[] = $layananName;
            }

            $data_baru_log = [
                "Nama Anak" => $input['nama_anak'],
                "Usia" => $input['usia_saat_ini'],
                "Berat Badan" => $input['bb_saat_ini'] . " kg",
                "Jenis Kelamin" => $input['jenis_kelamin'],
                "No WhatsApp" => $input['no_hp_ortu'],
                "Alamat" => $input['alamat_lengkap'],
                "Waktu Kunjungan" => $input['waktu_reservasi'],
                "Terapis" => $terapis ?: "ID " . $input['id_therapist'],
                "Metode Bayar" => $input['metode_bayar_admin'],
                "Layanan" => implode(", ", $layanan_list),
                "Total Biaya" => "Rp " . number_format($total_harga, 0, ',', '.'),
                "Total Komisi" => "Rp " . number_format($total_komisi, 0, ',', '.')
            ];

            $stmtLog = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'create', 'appointments', ?, NULL, ?)");
            $stmtLog->execute([$user_id_log, $id_appointment, json_encode($data_baru_log)]);

            $conn->commit();
            echo json_encode(["status" => 201, "message" => "Reservasi berhasil disimpan!"]);
        } 
        
        // KONDISI 2: JIKA ADA PARAMETER 'id' DAN BUKAN RESERVASI BARU (ADMIN VERIFIKASI)
        elseif (isset($input['id'])) {
            $id_target = $input['id'];
            $user_id = isset($input['user_id']) ? $input['user_id'] : 1; 

            $old_stmt = $conn->prepare("SELECT id, nama_anak, metode_bayar_admin, metode_bayar_terapis, total_harga_kunjungan, total_komisi_kunjungan, total_bersih, status_pembayaran FROM appointments WHERE id = ?");
            $old_stmt->execute([$id_target]);
            $data_lama = $old_stmt->fetch(PDO::FETCH_ASSOC);

            if ($data_lama) {
                $kalkulasi_bersih = $data_lama['total_harga_kunjungan'] - $data_lama['total_komisi_kunjungan'];

                // Update Status dan Isi Total Bersih
                $stmt = $conn->prepare("UPDATE appointments SET status_pembayaran = 'Verified', total_bersih = (total_harga_kunjungan - total_komisi_kunjungan) WHERE id = ?");
                $stmt->execute([$id_target]);

                $data_baru = $data_lama;
                $data_baru['status_pembayaran'] = 'Verified';
                $data_baru['total_bersih'] = $kalkulasi_bersih;

                $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, aksi, nama_tabel, record_id, data_lama, data_baru) VALUES (?, 'update', 'appointments', ?, ?, ?)");
                $log_stmt->execute([$user_id, $id_target, json_encode($data_lama), json_encode($data_baru)]);

                // Ambil Total Revenue Terbaru untuk Widget Admin
                $total_revenue_baru = getTotalRevenue($conn);

                echo json_encode([
                    "status" => 200, 
                    "message" => "Pembayaran berhasil diverifikasi",
                    "total_revenue" => $total_revenue_baru
                ]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => 404, "message" => "Data appointment tidak ditemukan"]);
            }
        } else {
            http_response_code(400); 
            echo json_encode(["status" => 400, "message" => "Parameter tidak valid"]);
        }
    } 

    // =====================================================================
    // METHOD GET: Menangani Pengambilan Data (List, Detail, Schedule)
    // =====================================================================
    elseif ($method === 'GET') {
        
        // KONDISI 1: JIKA TERAPIS INGIN MELIHAT JADWALNYA SENDIRI
        if (isset($_GET['user_id'])) {
            $user_id = (int)$_GET['user_id'];
            
            $stmtTerapis = $conn->prepare("SELECT id FROM therapists WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
            $stmtTerapis->execute([$user_id]);
            $terapis = $stmtTerapis->fetch(PDO::FETCH_ASSOC);

            if (!$terapis) {
                echo json_encode(["status" => 404, "message" => "Therapist not found"]);
                exit;
            }

            $therapist_id = $terapis['id'];
            $stmtSched = $conn->prepare("
                SELECT a.id, a.nama_anak, a.usia_saat_ini, a.bb_saat_ini, a.waktu_reservasi, a.alamat_lengkap, a.status_jadwal,
                       a.no_hp_ortu, a.link_shareloc, a.keluhan_awal, a.total_komisi_kunjungan,
                       (SELECT GROUP_CONCAT(s.nama_layanan SEPARATOR ' + ') 
                        FROM appointment_details ad 
                        JOIN services s ON ad.id_service = s.id 
                        WHERE ad.id_appointment = a.id) as rincian_layanan
                FROM appointments a
                WHERE a.id_therapist = :id 
                  AND a.deleted_at IS NULL
                ORDER BY a.waktu_reservasi ASC
            ");
            $stmtSched->execute([':id' => $therapist_id]);
            
            $schedules = [];
            while ($row = $stmtSched->fetch(PDO::FETCH_ASSOC)) {
                $row['id'] = (int)$row['id'];
                $row['total_komisi_kunjungan'] = (int)$row['total_komisi_kunjungan'];
                $schedules[] = $row;
            }
            
            echo json_encode(["status" => 200, "message" => "Berhasil memuat jadwal terapis", "data" => $schedules]);
        } 
        
        // KONDISI 2: ADMIN GET DETAIL APPOINTMENT (Ada ?id=)
        elseif (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $sql = "SELECT a.*, t.nama_terapis AS therapist, t.no_whatsapp AS therapist_phone 
                    FROM appointments a
                    JOIN therapists t ON a.id_therapist = t.id
                    WHERE a.id = ? LIMIT 1";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([$id]);
            $detail = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($detail) {
                echo json_encode(["status" => 200, "message" => "Sukses", "data" => $detail]);
            } else {
                http_response_code(404); echo json_encode(["status" => 404, "message" => "Data tidak ditemukan"]);
            }
        }
        
        // KONDISI 3: ADMIN AMBIL SEMUA DATA + WIDGET PENDAPATAN
        else {
            $sql = "SELECT 
                        a.id, a.nama_anak AS patient, t.nama_terapis AS therapist, 
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
            
            // Panggil API perhitungan total_bersih di sini
            $revenue = getRevenueSummary($conn);

echo json_encode([
    "status" => 200, 
    "message" => "Berhasil memuat semua data", 
    "total_revenue" => $revenue['bersih'], // Ambil yang bersih untuk widget
    "total_gross"   => $revenue['kotor'],  // Jika sewaktu-waktu butuh yang kotor
    "data" => $data
]);
        }
    } 
    else {
        http_response_code(405); echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500); echo json_encode(["status" => 500, "message" => "Error: " . $e->getMessage()]);
}
?>