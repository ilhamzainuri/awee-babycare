-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 29, 2026 at 02:02 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_awee_babycare`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_therapist` bigint(20) UNSIGNED NOT NULL,
  `nama_anak` varchar(150) NOT NULL,
  `usia_saat_ini` varchar(50) DEFAULT NULL COMMENT 'Disimpan dalam string, misal: 12 Bulan',
  `bb_saat_ini` varchar(20) DEFAULT NULL COMMENT 'Berat badan saat kunjungan',
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `alamat_lengkap` text NOT NULL,
  `link_shareloc` text DEFAULT NULL,
  `no_hp_ortu` varchar(20) NOT NULL,
  `keluhan_awal` text DEFAULT NULL,
  `waktu_reservasi` datetime NOT NULL,
  `status_jadwal` enum('Menunggu','Diproses','Selesai','Dibatalkan') DEFAULT 'Menunggu',
  `metode_bayar_admin` varchar(50) DEFAULT NULL COMMENT 'Rencana awal pembayaran, misal: Transfer',
  `metode_bayar_terapis` varchar(50) DEFAULT NULL COMMENT 'Fakta pembayaran di lapangan, misal: Cash',
  `status_pembayaran` enum('Unverified','Verified') DEFAULT 'Unverified',
  `bukti_bayar_url` varchar(255) DEFAULT NULL,
  `total_harga_kunjungan` decimal(12,2) DEFAULT 0.00,
  `total_komisi_kunjungan` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `waktu_mulai_layanan` datetime DEFAULT NULL,
  `waktu_selesai_layanan` datetime DEFAULT NULL,
  `suhu_anak` varchar(20) DEFAULT NULL,
  `catatan_terapis` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `id_therapist`, `nama_anak`, `usia_saat_ini`, `bb_saat_ini`, `jenis_kelamin`, `alamat_lengkap`, `link_shareloc`, `no_hp_ortu`, `keluhan_awal`, `waktu_reservasi`, `status_jadwal`, `metode_bayar_admin`, `metode_bayar_terapis`, `status_pembayaran`, `bukti_bayar_url`, `total_harga_kunjungan`, `total_komisi_kunjungan`, `created_at`, `updated_at`, `deleted_at`, `waktu_mulai_layanan`, `waktu_selesai_layanan`, `suhu_anak`, `catatan_terapis`) VALUES
(1, 2, 'Jaya', '5 bulan', '3', 'Laki-laki', 'Ya disitu', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '08547896276', 'Sakit', '2026-05-30 09:00:00', 'Menunggu', 'Transfer Bank', NULL, 'Unverified', NULL, 30000.00, 9000.00, '2026-05-29 11:45:39', '2026-05-29 11:45:39', NULL, NULL, NULL, NULL, NULL),
(2, 2, 'Udin petot', '5 bulan', '2', 'Laki-laki', 'dsadas', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '0854785112354781', 'dsadas', '2026-05-29 18:46:00', 'Menunggu', 'Cash', NULL, 'Unverified', NULL, 50000.00, 27500.00, '2026-05-29 11:46:56', '2026-05-29 11:46:56', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `appointment_details`
--

CREATE TABLE `appointment_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_appointment` bigint(20) UNSIGNED NOT NULL,
  `id_service` bigint(20) UNSIGNED NOT NULL,
  `harga_snapshot` decimal(12,2) NOT NULL,
  `persentase_komisi_snapshot` decimal(5,2) NOT NULL,
  `nominal_komisi_kalkulasi` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment_details`
--

INSERT INTO `appointment_details` (`id`, `id_appointment`, `id_service`, `harga_snapshot`, `persentase_komisi_snapshot`, `nominal_komisi_kalkulasi`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 6, 30000.00, 30.00, 9000.00, '2026-05-29 11:45:39', '2026-05-29 11:45:39', NULL),
(2, 2, 4, 50000.00, 55.00, 27500.00, '2026-05-29 11:46:56', '2026-05-29 11:46:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `aksi` enum('create','update','delete','restore') NOT NULL,
  `nama_tabel` varchar(100) NOT NULL,
  `record_id` bigint(20) UNSIGNED NOT NULL,
  `data_lama` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Nilai sebelum diubah' CHECK (json_valid(`data_lama`)),
  `data_baru` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Nilai setelah diubah' CHECK (json_valid(`data_baru`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `aksi`, `nama_tabel`, `record_id`, `data_lama`, `data_baru`, `created_at`) VALUES
(1, 1, 'create', 'therapists', 2, NULL, '{\"user_id\":3,\"nama_terapis\":\"Karina Wati\",\"no_whatsapp\":\"085785415578\",\"status_aktif\":1}', '2026-05-29 11:44:57'),
(2, 1, 'create', 'appointments', 1, NULL, '{\"Nama Anak\":\"Jaya\",\"Usia\":\"5 bulan\",\"Berat Badan\":\"3 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"Ya disitu\",\"Waktu Kunjungan\":\"2026-05-30 09:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Cukur Rambut\",\"Total Biaya\":\"Rp 30.000\",\"Total Komisi\":\"Rp 9.000\"}', '2026-05-29 11:45:39'),
(3, 1, 'update', 'therapists', 2, '{\"user_id\":3,\"nama_terapis\":\"Karina Wati\",\"no_whatsapp\":\"085785415578\",\"status_aktif\":1}', '{\"user_id\":3,\"nama_terapis\":\"Karina Wati\",\"no_whatsapp\":\"085785415578\",\"status_aktif\":1}', '2026-05-29 11:46:27'),
(4, 1, 'update', 'therapists', 1, '{\"user_id\":2,\"nama_terapis\":\"Daniel\",\"no_whatsapp\":\"08548786214\",\"status_aktif\":1}', '{\"user_id\":2,\"nama_terapis\":\"Daniel\",\"no_whatsapp\":\"08548786214\",\"status_aktif\":1}', '2026-05-29 11:46:31'),
(5, 1, 'create', 'appointments', 2, NULL, '{\"Nama Anak\":\"Udin petot\",\"Usia\":\"5 bulan\",\"Berat Badan\":\"2 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"0854785112354781\",\"Alamat\":\"dsadas\",\"Waktu Kunjungan\":\"2026-05-29 18:46:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Renang\",\"Total Biaya\":\"Rp 50.000\",\"Total Komisi\":\"Rp 27.500\"}', '2026-05-29 11:46:56'),
(6, 1, 'update', 'users', 1, '{\"username\":\"ilham\",\"password\":\"[HIDDEN]\",\"foto\":\"\"}', '{\"username\":\"ilham\",\"foto\":\"user_1_1780055499.jpg\"}', '2026-05-29 11:51:39');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_layanan` varchar(150) NOT NULL,
  `harga_saat_ini` decimal(12,2) NOT NULL,
  `persentase_komisi` decimal(5,2) NOT NULL COMMENT 'Format persentase misal 50.00 untuk 50%',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `nama_layanan`, `harga_saat_ini`, `persentase_komisi`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Pijat Bayi', 150000.00, 50.00, '2026-05-18 08:26:53', '2026-05-18 08:26:53', NULL),
(2, 'Renang Bayi', 100000.00, 50.00, '2026-05-18 08:48:46', '2026-05-18 08:49:15', '2026-05-18 08:49:15'),
(3, 'Pijat Ibu Hamil', 200000.00, 40.00, '2026-05-18 08:49:29', '2026-05-18 08:49:29', NULL),
(4, 'Renang', 50000.00, 55.00, '2026-05-18 08:56:26', '2026-05-19 04:42:26', NULL),
(5, 'Pijat Laksa', 170000.00, 30.00, '2026-05-19 03:49:57', '2026-05-19 04:03:35', NULL),
(6, 'Cukur Rambut', 30000.00, 30.00, '2026-05-19 04:04:18', '2026-05-19 04:04:18', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `therapists`
--

CREATE TABLE `therapists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama_terapis` varchar(150) NOT NULL,
  `no_whatsapp` varchar(20) NOT NULL,
  `status_aktif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `therapists`
--

INSERT INTO `therapists` (`id`, `user_id`, `nama_terapis`, `no_whatsapp`, `status_aktif`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 'Daniel', '08548786214', 1, '2026-05-29 11:33:36', '2026-05-29 11:33:36', NULL),
(2, 3, 'Karina Wati', '085785415578', 1, '2026-05-29 11:44:57', '2026-05-29 11:44:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `foto` varchar(255) NOT NULL,
  `role` enum('admin','therapist') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `foto`, `role`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'ilham', 'ilham', 'user_1_1780055499.jpg', 'admin', '2026-05-29 11:33:02', '2026-05-29 11:51:39', NULL),
(2, 'danil', 'danil', '', 'therapist', '2026-05-29 11:33:19', '2026-05-29 11:33:19', NULL),
(3, 'karin', 'karin', '', 'therapist', '2026-05-29 11:44:37', '2026-05-29 11:44:37', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_appointments_therapist` (`id_therapist`);

--
-- Indexes for table `appointment_details`
--
ALTER TABLE `appointment_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_details_appointment` (`id_appointment`),
  ADD KEY `fk_details_service` (`id_service`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_audit_users` (`user_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `therapists`
--
ALTER TABLE `therapists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_therapists_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `appointment_details`
--
ALTER TABLE `appointment_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `therapists`
--
ALTER TABLE `therapists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `fk_appointments_therapist` FOREIGN KEY (`id_therapist`) REFERENCES `therapists` (`id`);

--
-- Constraints for table `appointment_details`
--
ALTER TABLE `appointment_details`
  ADD CONSTRAINT `fk_details_appointment` FOREIGN KEY (`id_appointment`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_details_service` FOREIGN KEY (`id_service`) REFERENCES `services` (`id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `therapists`
--
ALTER TABLE `therapists`
  ADD CONSTRAINT `fk_therapists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
