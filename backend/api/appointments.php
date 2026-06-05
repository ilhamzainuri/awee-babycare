<?php
// Letak file: backend/api/appointments.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
ini_set('display_errors', 0);
require_once '../config/koneksi.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents("php://input"), true);

    if ($method === 'POST') {
        // Mulai Transaksi Database (Mencegah data setengah masuk)
        $conn->beginTransaction();

        // 1. Simpan Header ke tabel `appointments`
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

        $id_appointment = $conn->lastInsertId(); // Tangkap ID transaksi yang baru dibuat
        
        $total_harga = 0;
        $total_komisi = 0;

        // 2. Loop & Simpan Rincian ke `appointment_details` (SNAPSHOT LOGIC)
        $stmtDetail = $conn->prepare("
            INSERT INTO appointment_details (
                id_appointment, id_service, harga_snapshot, 
                persentase_komisi_snapshot, nominal_komisi_kalkulasi
            ) VALUES (?, ?, ?, ?, ?)
        ");

        $stmtCekService = $conn->prepare("SELECT harga_saat_ini, persentase_komisi FROM services WHERE id = ?");

        foreach ($input['treatments'] as $treatment) {
            // Ambil harga dan komisi master data saat ini
            $stmtCekService->execute([$treatment['id_service']]);
            $serviceData = $stmtCekService->fetch();

            if ($serviceData) {
                $harga = $serviceData['harga_saat_ini'];
                $persentase = $serviceData['persentase_komisi'];
                $nominal_komisi = ($harga * $persentase) / 100;

                // Simpan Snapshot
                $stmtDetail->execute([
                    $id_appointment,
                    $treatment['id_service'],
                    $harga,
                    $persentase,
                    $nominal_komisi
                ]);

                // Hitung Grand Total
                $total_harga += $harga;
                $total_komisi += $nominal_komisi;
            }
        }

        // 3. Update Total Harga & Komisi di tabel `appointments`
        $stmtUpdateTotal = $conn->prepare("UPDATE appointments SET total_harga_kunjungan = ?, total_komisi_kunjungan = ? WHERE id = ?");
        $stmtUpdateTotal->execute([$total_harga, $total_komisi, $id_appointment]);

        // 4. Catat Ke Audit Log
        $user_id = isset($input['user_id']) ? (int)$input['user_id'] : null;
        
        // Ambil nama terapis untuk mempermudah pembacaan log
        $stmtTerapis = $conn->prepare("SELECT nama_terapis FROM therapists WHERE id = ?");
        $stmtTerapis->execute([$input['id_therapist']]);
        $terapis = $stmtTerapis->fetchColumn();

        // Ambil daftar layanan yang dipilih
        $layanan_list = [];
        $stmtLayananName = $conn->prepare("SELECT nama_layanan FROM services WHERE id = ?");
        foreach ($input['treatments'] as $treatment) {
            $stmtLayananName->execute([$treatment['id_service']]);
            $layananName = $stmtLayananName->fetchColumn();
            if ($layananName) {
                $layanan_list[] = $layananName;
            }
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

        $stmtLog = $conn->prepare("
            INSERT INTO audit_logs (
                user_id, aksi, nama_tabel, record_id, data_lama, data_baru
            ) VALUES (?, 'create', 'appointments', ?, NULL, ?)
        ");
        $stmtLog->execute([
            $user_id,
            $id_appointment,
            json_encode($data_baru_log)
        ]);

        // Selesai, Permanenkan data
        $conn->commit();

        echo json_encode(["status" => 201, "message" => "Reservasi berhasil disimpan!"]);
    } elseif ($method === 'GET') {
        if (isset($_GET['user_id'])) {
            $user_id = (int)$_GET['user_id'];
            
            // Ambil id_therapist berdasarkan user_id
            $stmtTerapis = $conn->prepare("SELECT id FROM therapists WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
            $stmtTerapis->execute([$user_id]);
            $terapis = $stmtTerapis->fetch(PDO::FETCH_ASSOC);

            if (!$terapis) {
                echo json_encode(["status" => 404, "message" => "Therapist not found"]);
                exit;
            }

            $therapist_id = $terapis['id'];

            // Ambil semua jadwal untuk terapis tersebut
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
                $schedules[] = [
                    "id" => (int)$row['id'],
                    "nama_anak" => $row['nama_anak'],
                    "usia_saat_ini" => $row['usia_saat_ini'],
                    "bb_saat_ini" => $row['bb_saat_ini'],
                    "waktu_reservasi" => $row['waktu_reservasi'],
                    "alamat_lengkap" => $row['alamat_lengkap'],
                    "status_jadwal" => $row['status_jadwal'],
                    "no_hp_ortu" => $row['no_hp_ortu'],
                    "link_shareloc" => $row['link_shareloc'],
                    "keluhan_awal" => $row['keluhan_awal'],
                    "total_komisi_kunjungan" => (int)$row['total_komisi_kunjungan'],
                    "rincian_layanan" => $row['rincian_layanan']
                ];
            }
            
            echo json_encode(["status" => 200, "message" => "Berhasil memuat semua jadwal", "data" => $schedules]);
        } else {
            http_response_code(400); 
            echo json_encode(["status" => 400, "message" => "Parameter user_id diperlukan"]);
        }
    } 
    else {
        http_response_code(405); echo json_encode(["status" => 405, "message" => "Method Not Allowed"]);
    }
} catch(Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack(); // Batalkan semua jika ada error
    }
    http_response_code(500); echo json_encode(["status" => 500, "message" => "Error: " . $e->getMessage()]);
}
?>