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