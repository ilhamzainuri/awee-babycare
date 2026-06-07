-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2026 at 11:41 PM
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
  `bb_real_terapis` varchar(20) DEFAULT NULL,
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
  `total_bersih` decimal(12,2) DEFAULT NULL,
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

INSERT INTO `appointments` (`id`, `id_therapist`, `nama_anak`, `usia_saat_ini`, `bb_saat_ini`, `bb_real_terapis`, `jenis_kelamin`, `alamat_lengkap`, `link_shareloc`, `no_hp_ortu`, `keluhan_awal`, `waktu_reservasi`, `status_jadwal`, `metode_bayar_admin`, `metode_bayar_terapis`, `status_pembayaran`, `bukti_bayar_url`, `total_harga_kunjungan`, `total_komisi_kunjungan`, `total_bersih`, `created_at`, `updated_at`, `deleted_at`, `waktu_mulai_layanan`, `waktu_selesai_layanan`, `suhu_anak`, `catatan_terapis`) VALUES
(1, 2, 'Jaya', '5 bulan', '3', NULL, 'Laki-laki', 'Ya disitu', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '08547896276', 'Sakit', '2026-05-30 09:00:00', 'Selesai', 'Transfer Bank', NULL, 'Verified', NULL, 30000.00, 9000.00, 0.00, '2026-05-29 11:45:39', '2026-06-07 17:21:57', NULL, '2026-06-08 00:20:07', '2026-06-08 00:20:07', NULL, NULL),
(2, 2, 'Udin petot', '5 bulan', '2', '4', 'Laki-laki', 'dsadas', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '0854785112354781', 'dsadas', '2026-05-29 18:46:00', 'Selesai', 'Cash', NULL, 'Verified', NULL, 50000.00, 27500.00, 0.00, '2026-05-29 11:46:56', '2026-06-07 17:21:57', NULL, '2026-06-08 00:20:07', '2026-06-08 00:20:07', '34', NULL),
(3, 2, 'Udin petot', '8 bulan', '2', '34', 'Laki-laki', 'dsadas', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '085478511235478123', 'dsadsada', '2026-06-06 09:00:00', 'Selesai', 'Transfer Bank', 'Cash', 'Verified', NULL, 180000.00, 84000.00, 0.00, '2026-06-05 11:51:18', '2026-06-05 12:29:46', NULL, '2026-06-05 14:29:40', '2026-06-05 14:29:46', '34', 'dsadad'),
(4, 2, 'Jaya', '5 bulan', '1.9', NULL, 'Laki-laki', 'dsadsa', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '0854785112354781', 'dsadasd', '2026-06-05 20:01:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 30000.00, 9000.00, 0.00, '2026-06-05 12:01:14', '2026-06-05 12:28:56', NULL, '2026-06-05 14:21:15', '2026-06-05 14:27:56', NULL, 'Sudah selesai'),
(5, 2, 'Alicia', '8 bulan', '4', '3.5', 'Perempuan', 'Ya disitu', 'https://maps.app.goo.gl/HDW7SfpEx5PJbH1J8', '085820664592', 'Susah tidur dan panas', '2026-06-07 09:00:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 220000.00, 78500.00, 0.00, '2026-06-05 12:06:43', '2026-06-05 12:30:51', NULL, '2026-06-05 14:30:36', '2026-06-05 14:30:51', '33', 'Sudah tenang dan tidak nangis'),
(6, 2, 'Kina', '12', '4', '4', 'Perempuan', 'sada', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '08547896276', 'dsada', '2026-06-05 20:00:00', 'Selesai', 'Transfer Bank', 'Transfer Bank', 'Verified', 'payment_6_1780662514.png', 170000.00, 51000.00, 0.00, '2026-06-05 12:27:30', '2026-06-05 12:29:08', NULL, '2026-06-05 14:28:15', '2026-06-05 14:28:34', '35', 'Sudah'),
(7, 1, 'Jaya', '8 bulan', '3', '3.5', 'Laki-laki', 'dadsa', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '08547896276', 'dsadas', '2026-06-05 19:36:00', 'Selesai', 'Cash', 'Transfer Bank', 'Verified', 'payment_7_1780663044.png', 170000.00, 51000.00, 0.00, '2026-06-05 12:36:48', '2026-06-07 13:59:28', NULL, '2026-06-05 14:37:08', '2026-06-05 14:37:24', '34', 'done'),
(8, 1, 'dasdasd', '8 bulan', '3', '3.2', 'Laki-laki', 'dsadsa', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '085789575544', 'dadsada', '2026-06-05 19:44:00', 'Selesai', 'Cash', 'Transfer Bank', 'Verified', 'payment_8_1780663662.jpeg', 250000.00, 87500.00, 0.00, '2026-06-05 12:44:55', '2026-06-07 13:59:53', NULL, '2026-06-05 14:45:13', '2026-06-05 14:47:42', '34', 'sdadasd'),
(9, 1, 'Kintuk', '2 tahun', '6', NULL, 'Laki-laki', 'Jl manatap', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '08547896276', 'Susah tidur', '2026-06-05 21:19:00', 'Selesai', 'Transfer Bank', NULL, 'Verified', NULL, 80000.00, 36500.00, 0.00, '2026-06-05 13:19:18', '2026-06-07 17:21:57', NULL, '2026-06-08 00:20:07', '2026-06-08 00:20:07', NULL, NULL),
(10, 2, 'anggi', '12', '4', '4', 'Laki-laki', 'hsahdahsd', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '0854785112354781', 'ndsadas', '2026-06-07 21:36:00', 'Selesai', 'Cash', 'Transfer Bank', 'Verified', 'payment_10_1780843056.jpeg', 170000.00, 51000.00, 0.00, '2026-06-07 14:36:59', '2026-06-07 14:38:17', NULL, '2026-06-07 16:37:15', '2026-06-07 16:37:36', '35', 'Sip'),
(11, 2, 'Kevin', '11', '3', '3.5', 'Laki-laki', 'ndadhsa', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '085478511235478123', 'dsn andnasn', '2026-06-07 21:44:00', 'Selesai', 'Cash', 'Transfer Bank', 'Verified', 'payment_11_1780843528.jpeg', 170000.00, 51000.00, 0.00, '2026-06-07 14:44:47', '2026-06-07 14:45:48', NULL, '2026-06-07 16:45:10', '2026-06-07 16:45:28', '34', 'jjsajdajs'),
(12, 2, 'Jaya', '11', '4', NULL, 'Laki-laki', 'dasdas', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '085789575544712', 'hhdsahdha', '2026-06-07 21:47:00', 'Selesai', 'Cash', NULL, 'Verified', NULL, 170000.00, 51000.00, 119000.00, '2026-06-07 14:47:16', '2026-06-07 17:21:57', NULL, '2026-06-08 00:20:07', '2026-06-08 00:20:07', NULL, NULL),
(13, 2, 'Udin petot', '4', '1.2', NULL, 'Laki-laki', 'jdjsajdjas', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '08547896276', 'jdjsajdaj', '2026-06-07 22:47:00', 'Selesai', 'Cash', NULL, 'Verified', NULL, 170000.00, 51000.00, 119000.00, '2026-06-07 14:47:51', '2026-06-07 17:21:57', NULL, '2026-06-08 00:20:07', '2026-06-08 00:20:07', NULL, NULL),
(14, 1, 'Yusruksssdada', '7', '3', NULL, 'Laki-laki', 'hhdsahhdas', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '085789575544712', 'jdhashdhsa', '2026-06-11 21:48:00', 'Selesai', 'Cash', NULL, 'Verified', NULL, 30000.00, 9000.00, 21000.00, '2026-06-07 14:48:24', '2026-06-07 17:21:57', NULL, '2026-06-08 00:20:07', '2026-06-08 00:20:07', NULL, NULL),
(15, 3, 'Judi', '4', '1', NULL, 'Laki-laki', 'dshahda', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '085789575544712', 'bjdbsabhd', '2026-06-07 23:51:00', 'Selesai', 'Cash', NULL, 'Verified', NULL, 30000.00, 9000.00, 21000.00, '2026-06-07 14:51:53', '2026-06-07 17:21:57', NULL, '2026-06-08 00:20:07', '2026-06-08 00:20:07', NULL, NULL),
(16, 3, 'Dell', '8 bulan', '4', '1.3', 'Perempuan', 'Ya', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '085789575544', 'Ga', '2026-06-08 01:18:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 80000.00, 36500.00, 43500.00, '2026-06-07 18:18:46', '2026-06-07 18:33:04', NULL, '2026-06-07 20:31:25', '2026-06-07 20:31:40', '32', 'Anak tenang'),
(17, 2, 'Sella', '5 bulan', '2', '3.3', 'Perempuan', 'Ga', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '085789575544', 'Ya', '2026-06-08 02:00:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 50000.00, 27500.00, 22500.00, '2026-06-07 18:19:19', '2026-06-07 18:33:03', NULL, '2026-06-07 20:32:30', '2026-06-07 20:32:41', '33', 'Sip'),
(18, 3, 'Kiki', '2', '1', '2.4', 'Perempuan', 'Jalan Baru', 'https://maps.app.goo.gl/HDW7SfpEx5PJbH1J8', '08547896276', 'Susah tidur', '2026-06-08 02:00:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 150000.00, 75000.00, 75000.00, '2026-06-07 18:31:06', '2026-06-07 18:33:01', NULL, '2026-06-07 20:31:53', '2026-06-07 20:32:00', '33', 'Sip'),
(19, 2, 'Wika', '1', '2', '2', 'Perempuan', 'sda', '', '085789575544712', 'dsada', '2026-06-10 01:52:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 30000.00, 9000.00, 21000.00, '2026-06-07 18:53:00', '2026-06-07 21:39:33', NULL, '2026-06-07 21:44:03', '2026-06-07 21:44:11', '33', 'dsadsasd');

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
(2, 2, 4, 50000.00, 55.00, 27500.00, '2026-05-29 11:46:56', '2026-05-29 11:46:56', NULL),
(3, 3, 6, 30000.00, 30.00, 9000.00, '2026-06-05 11:51:18', '2026-06-05 11:51:18', NULL),
(4, 3, 1, 150000.00, 50.00, 75000.00, '2026-06-05 11:51:18', '2026-06-05 11:51:18', NULL),
(5, 4, 6, 30000.00, 30.00, 9000.00, '2026-06-05 12:01:14', '2026-06-05 12:01:14', NULL),
(6, 5, 5, 170000.00, 30.00, 51000.00, '2026-06-05 12:06:43', '2026-06-05 12:06:43', NULL),
(7, 5, 4, 50000.00, 55.00, 27500.00, '2026-06-05 12:06:43', '2026-06-05 12:06:43', NULL),
(8, 6, 5, 170000.00, 30.00, 51000.00, '2026-06-05 12:27:30', '2026-06-05 12:27:30', NULL),
(9, 7, 5, 170000.00, 30.00, 51000.00, '2026-06-05 12:36:48', '2026-06-05 12:36:48', NULL),
(10, 8, 5, 170000.00, 30.00, 51000.00, '2026-06-05 12:44:55', '2026-06-05 12:44:55', NULL),
(11, 8, 4, 50000.00, 55.00, 27500.00, '2026-06-05 12:44:55', '2026-06-05 12:44:55', NULL),
(12, 8, 6, 30000.00, 30.00, 9000.00, '2026-06-05 12:44:55', '2026-06-05 12:44:55', NULL),
(13, 9, 6, 30000.00, 30.00, 9000.00, '2026-06-05 13:19:18', '2026-06-05 13:19:18', NULL),
(14, 9, 4, 50000.00, 55.00, 27500.00, '2026-06-05 13:19:18', '2026-06-05 13:19:18', NULL),
(15, 10, 5, 170000.00, 30.00, 51000.00, '2026-06-07 14:36:59', '2026-06-07 14:36:59', NULL),
(16, 11, 5, 170000.00, 30.00, 51000.00, '2026-06-07 14:44:47', '2026-06-07 14:44:47', NULL),
(17, 12, 5, 170000.00, 30.00, 51000.00, '2026-06-07 14:47:16', '2026-06-07 14:47:16', NULL),
(18, 13, 5, 170000.00, 30.00, 51000.00, '2026-06-07 14:47:51', '2026-06-07 14:47:51', NULL),
(19, 14, 6, 30000.00, 30.00, 9000.00, '2026-06-07 14:48:24', '2026-06-07 14:48:24', NULL),
(20, 15, 6, 30000.00, 30.00, 9000.00, '2026-06-07 14:51:53', '2026-06-07 14:51:53', NULL),
(21, 16, 6, 30000.00, 30.00, 9000.00, '2026-06-07 18:18:46', '2026-06-07 18:18:46', NULL),
(22, 16, 4, 50000.00, 55.00, 27500.00, '2026-06-07 18:18:46', '2026-06-07 18:18:46', NULL),
(23, 17, 4, 50000.00, 55.00, 27500.00, '2026-06-07 18:19:19', '2026-06-07 18:19:19', NULL),
(24, 18, 1, 150000.00, 50.00, 75000.00, '2026-06-07 18:31:06', '2026-06-07 18:31:06', NULL),
(25, 19, 6, 30000.00, 30.00, 9000.00, '2026-06-07 18:53:00', '2026-06-07 18:53:00', NULL);

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
(6, 1, 'update', 'users', 1, '{\"username\":\"ilham\",\"password\":\"[HIDDEN]\",\"foto\":\"\"}', '{\"username\":\"ilham\",\"foto\":\"user_1_1780055499.jpg\"}', '2026-05-29 11:51:39'),
(7, 1, 'update', 'users', 1, '{\"username\":\"ilham\",\"password\":\"[HIDDEN]\",\"foto\":\"user_1_1780055499.jpg\"}', '{\"username\":\"ilham\",\"password\":\"[PASSWORD_DIUBAH]\"}', '2026-06-05 11:48:00'),
(8, 1, 'create', 'appointments', 3, NULL, '{\"Nama Anak\":\"Udin petot\",\"Usia\":\"8 bulan\",\"Berat Badan\":\"2 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085478511235478123\",\"Alamat\":\"dsadas\",\"Waktu Kunjungan\":\"2026-06-06 09:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Cukur Rambut, Pijat Bayi\",\"Total Biaya\":\"Rp 180.000\",\"Total Komisi\":\"Rp 84.000\"}', '2026-06-05 11:51:18'),
(9, 1, 'create', 'appointments', 4, NULL, '{\"Nama Anak\":\"Jaya\",\"Usia\":\"5 bulan\",\"Berat Badan\":\"1.9 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"0854785112354781\",\"Alamat\":\"dsadsa\",\"Waktu Kunjungan\":\"2026-06-05 20:01:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Cukur Rambut\",\"Total Biaya\":\"Rp 30.000\",\"Total Komisi\":\"Rp 9.000\"}', '2026-06-05 12:01:14'),
(10, 1, 'create', 'appointments', 5, NULL, '{\"Nama Anak\":\"Alicia\",\"Usia\":\"8 bulan\",\"Berat Badan\":\"4 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"085820664592\",\"Alamat\":\"Ya disitu\",\"Waktu Kunjungan\":\"2026-06-07 09:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Laksa, Renang\",\"Total Biaya\":\"Rp 220.000\",\"Total Komisi\":\"Rp 78.500\"}', '2026-06-05 12:06:43'),
(11, 3, 'update', 'appointments', 4, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-05 14:21:15\"}', '2026-06-05 12:21:16'),
(12, 1, 'create', 'appointments', 6, NULL, '{\"Nama Anak\":\"Kina\",\"Usia\":\"12\",\"Berat Badan\":\"4 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"sada\",\"Waktu Kunjungan\":\"2026-06-05 20:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Pijat Laksa\",\"Total Biaya\":\"Rp 170.000\",\"Total Komisi\":\"Rp 51.000\"}', '2026-06-05 12:27:30'),
(13, 3, 'update', 'appointments', 4, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-05 14:27:56\",\"Catatan\":\"Sudah selesai\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-06-05 12:27:56'),
(14, 3, 'update', 'appointments', 6, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-05 14:28:15\",\"Suhu Anak\":\"35\",\"BB Real\":\"4\"}', '2026-06-05 12:28:15'),
(15, 3, 'update', 'appointments', 6, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-05 14:28:34\",\"Catatan\":\"Sudah\",\"Metode Bayar (Terapis)\":\"Transfer Bank\",\"Bukti Bayar\":\"payment_6_1780662514.png\"}', '2026-06-05 12:28:34'),
(16, 3, 'update', 'appointments', 3, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-05 14:29:40\",\"Suhu Anak\":\"34\",\"BB Real\":\"34\"}', '2026-06-05 12:29:40'),
(17, 3, 'update', 'appointments', 3, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-05 14:29:46\",\"Catatan\":\"dsadad\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-06-05 12:29:46'),
(18, 3, 'update', 'appointments', 5, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-05 14:30:36\",\"Suhu Anak\":\"33\",\"BB Real\":\"3.5\"}', '2026-06-05 12:30:36'),
(19, 3, 'update', 'appointments', 5, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-05 14:30:51\",\"Catatan\":\"Sudah tenang dan tidak nangis\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-06-05 12:30:51'),
(20, 3, 'update', 'appointments', 2, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-05 14:31:16\",\"Suhu Anak\":\"34\",\"BB Real\":\"4\"}', '2026-06-05 12:31:16'),
(21, 1, 'create', 'appointments', 7, NULL, '{\"Nama Anak\":\"Jaya\",\"Usia\":\"8 bulan\",\"Berat Badan\":\"3 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"dadsa\",\"Waktu Kunjungan\":\"2026-06-05 19:36:00\",\"Terapis\":\"Daniel\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Laksa\",\"Total Biaya\":\"Rp 170.000\",\"Total Komisi\":\"Rp 51.000\"}', '2026-06-05 12:36:48'),
(22, 2, 'update', 'appointments', 7, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-05 14:37:08\",\"Suhu Anak\":\"34\",\"BB Real\":\"3.5\"}', '2026-06-05 12:37:08'),
(23, 2, 'update', 'appointments', 7, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-05 14:37:24\",\"Catatan\":\"done\",\"Metode Bayar (Terapis)\":\"Transfer Bank\",\"Bukti Bayar\":\"payment_7_1780663044.png\"}', '2026-06-05 12:37:24'),
(24, 1, 'create', 'appointments', 8, NULL, '{\"Nama Anak\":\"dasdasd\",\"Usia\":\"8 bulan\",\"Berat Badan\":\"3 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085789575544\",\"Alamat\":\"dsadsa\",\"Waktu Kunjungan\":\"2026-06-05 19:44:00\",\"Terapis\":\"Daniel\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Laksa, Renang, Cukur Rambut\",\"Total Biaya\":\"Rp 250.000\",\"Total Komisi\":\"Rp 87.500\"}', '2026-06-05 12:44:55'),
(25, 2, 'update', 'appointments', 8, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-05 14:45:13\",\"Suhu Anak\":\"34\",\"BB Real\":\"3.2\"}', '2026-06-05 12:45:13'),
(26, 2, 'update', 'appointments', 8, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-05 14:47:42\",\"Catatan\":\"sdadasd\",\"Metode Bayar (Terapis)\":\"Transfer Bank\",\"Bukti Bayar\":\"payment_8_1780663662.jpeg\"}', '2026-06-05 12:47:42'),
(27, 1, 'create', 'appointments', 9, NULL, '{\"Nama Anak\":\"Kintuk\",\"Usia\":\"2 tahun\",\"Berat Badan\":\"6 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"Jl manatap\",\"Waktu Kunjungan\":\"2026-06-05 21:19:00\",\"Terapis\":\"Daniel\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Cukur Rambut, Renang\",\"Total Biaya\":\"Rp 80.000\",\"Total Komisi\":\"Rp 36.500\"}', '2026-06-05 13:19:18'),
(28, 1, 'create', 'appointments', 10, NULL, '{\"Nama Anak\":\"anggi\",\"Usia\":\"12\",\"Berat Badan\":\"4 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"0854785112354781\",\"Alamat\":\"hsahdahsd\",\"Waktu Kunjungan\":\"2026-06-07 21:36:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Laksa\",\"Total Biaya\":\"Rp 170.000\",\"Total Komisi\":\"Rp 51.000\"}', '2026-06-07 14:36:59'),
(29, 3, 'update', 'appointments', 10, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-07 16:37:15\",\"Suhu Anak\":\"35\",\"BB Real\":\"4\"}', '2026-06-07 14:37:15'),
(30, 3, 'update', 'appointments', 10, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-07 16:37:36\",\"Catatan\":\"Sip\",\"Metode Bayar (Terapis)\":\"Transfer Bank\",\"Bukti Bayar\":\"payment_10_1780843056.jpeg\"}', '2026-06-07 14:37:36'),
(31, 1, 'update', 'appointments', 10, '{\"id\":10,\"nama_anak\":\"anggi\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"status_pembayaran\":\"Unverified\"}', '{\"id\":10,\"nama_anak\":\"anggi\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"status_pembayaran\":\"Verified\"}', '2026-06-07 14:38:17'),
(32, 1, 'create', 'appointments', 11, NULL, '{\"Nama Anak\":\"Kevin\",\"Usia\":\"11\",\"Berat Badan\":\"3 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085478511235478123\",\"Alamat\":\"ndadhsa\",\"Waktu Kunjungan\":\"2026-06-07 21:44:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Laksa\",\"Total Biaya\":\"Rp 170.000\",\"Total Komisi\":\"Rp 51.000\"}', '2026-06-07 14:44:47'),
(33, 3, 'update', 'appointments', 11, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-07 16:45:10\",\"Suhu Anak\":\"34\",\"BB Real\":\"3.5\"}', '2026-06-07 14:45:10'),
(34, 3, 'update', 'appointments', 11, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-07 16:45:28\",\"Catatan\":\"jjsajdajs\",\"Metode Bayar (Terapis)\":\"Transfer Bank\",\"Bukti Bayar\":\"payment_11_1780843528.jpeg\"}', '2026-06-07 14:45:28'),
(35, 1, 'update', 'appointments', 11, '{\"id\":11,\"nama_anak\":\"Kevin\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"status_pembayaran\":\"Unverified\"}', '{\"id\":11,\"nama_anak\":\"Kevin\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"status_pembayaran\":\"Verified\"}', '2026-06-07 14:45:48'),
(36, 1, 'create', 'appointments', 12, NULL, '{\"Nama Anak\":\"Jaya\",\"Usia\":\"11\",\"Berat Badan\":\"4 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085789575544712\",\"Alamat\":\"dasdas\",\"Waktu Kunjungan\":\"2026-06-07 21:47:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Laksa\",\"Total Biaya\":\"Rp 170.000\",\"Total Komisi\":\"Rp 51.000\"}', '2026-06-07 14:47:16'),
(37, 1, 'create', 'appointments', 13, NULL, '{\"Nama Anak\":\"Udin petot\",\"Usia\":\"4\",\"Berat Badan\":\"1.2 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"jdjsajdjas\",\"Waktu Kunjungan\":\"2026-06-07 22:47:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Laksa\",\"Total Biaya\":\"Rp 170.000\",\"Total Komisi\":\"Rp 51.000\"}', '2026-06-07 14:47:51'),
(38, 1, 'create', 'appointments', 14, NULL, '{\"Nama Anak\":\"Yusruksssdada\",\"Usia\":\"7\",\"Berat Badan\":\"3 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085789575544712\",\"Alamat\":\"hhdsahhdas\",\"Waktu Kunjungan\":\"2026-06-11 21:48:00\",\"Terapis\":\"Daniel\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Cukur Rambut\",\"Total Biaya\":\"Rp 30.000\",\"Total Komisi\":\"Rp 9.000\"}', '2026-06-07 14:48:24'),
(39, 1, 'create', 'therapists', 3, NULL, '{\"user_id\":4,\"nama_terapis\":\"Anggi\",\"no_whatsapp\":\"08578654434\",\"status_aktif\":1}', '2026-06-07 14:50:59'),
(40, 1, 'create', 'appointments', 15, NULL, '{\"Nama Anak\":\"Judi\",\"Usia\":\"4\",\"Berat Badan\":\"1 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085789575544712\",\"Alamat\":\"dshahda\",\"Waktu Kunjungan\":\"2026-06-07 23:51:00\",\"Terapis\":\"Anggi\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Cukur Rambut\",\"Total Biaya\":\"Rp 30.000\",\"Total Komisi\":\"Rp 9.000\"}', '2026-06-07 14:51:53'),
(41, 1, 'update', 'appointments', 14, '{\"id\":14,\"nama_anak\":\"Yusruksssdada\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"30000.00\",\"total_komisi_kunjungan\":\"9000.00\",\"total_bersih\":\"0.00\",\"status_pembayaran\":\"Unverified\"}', '{\"id\":14,\"nama_anak\":\"Yusruksssdada\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"30000.00\",\"total_komisi_kunjungan\":\"9000.00\",\"total_bersih\":21000,\"status_pembayaran\":\"Verified\"}', '2026-06-07 15:31:47'),
(42, 1, 'update', 'appointments', 15, '{\"id\":15,\"nama_anak\":\"Judi\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"30000.00\",\"total_komisi_kunjungan\":\"9000.00\",\"total_bersih\":\"0.00\",\"status_pembayaran\":\"Unverified\"}', '{\"id\":15,\"nama_anak\":\"Judi\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"30000.00\",\"total_komisi_kunjungan\":\"9000.00\",\"total_bersih\":21000,\"status_pembayaran\":\"Verified\"}', '2026-06-07 15:38:57'),
(43, 1, 'update', 'appointments', 13, '{\"id\":13,\"nama_anak\":\"Udin petot\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"total_bersih\":\"0.00\",\"status_pembayaran\":\"Unverified\"}', '{\"id\":13,\"nama_anak\":\"Udin petot\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"total_bersih\":119000,\"status_pembayaran\":\"Verified\"}', '2026-06-07 15:38:58'),
(44, 1, 'update', 'appointments', 12, '{\"id\":12,\"nama_anak\":\"Jaya\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"total_bersih\":\"0.00\",\"status_pembayaran\":\"Unverified\"}', '{\"id\":12,\"nama_anak\":\"Jaya\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"170000.00\",\"total_komisi_kunjungan\":\"51000.00\",\"total_bersih\":119000,\"status_pembayaran\":\"Verified\"}', '2026-06-07 15:38:59'),
(45, 1, 'delete', 'services', 5, '{\"nama_layanan\":\"Pijat Laksa\",\"harga_saat_ini\":\"170000.00\",\"persentase_komisi\":\"30.00\"}', NULL, '2026-06-07 18:00:58'),
(46, 1, 'create', 'appointments', 16, NULL, '{\"Nama Anak\":\"Dell\",\"Usia\":\"8 bulan\",\"Berat Badan\":\"4 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"085789575544\",\"Alamat\":\"Ya\",\"Waktu Kunjungan\":\"2026-06-08 01:18:00\",\"Terapis\":\"Anggi\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Cukur Rambut, Renang\",\"Total Biaya\":\"Rp 80.000\",\"Total Komisi\":\"Rp 36.500\"}', '2026-06-07 18:18:46'),
(47, 1, 'create', 'appointments', 17, NULL, '{\"Nama Anak\":\"Sella\",\"Usia\":\"5 bulan\",\"Berat Badan\":\"2 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"085789575544\",\"Alamat\":\"Ga\",\"Waktu Kunjungan\":\"2026-06-08 02:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Renang\",\"Total Biaya\":\"Rp 50.000\",\"Total Komisi\":\"Rp 27.500\"}', '2026-06-07 18:19:19'),
(48, 1, 'create', 'appointments', 18, NULL, '{\"Nama Anak\":\"Kiki\",\"Usia\":\"2\",\"Berat Badan\":\"1 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"Jalan Baru\",\"Waktu Kunjungan\":\"2026-06-08 02:00:00\",\"Terapis\":\"Anggi\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat Bayi\",\"Total Biaya\":\"Rp 150.000\",\"Total Komisi\":\"Rp 75.000\"}', '2026-06-07 18:31:06'),
(49, 4, 'update', 'appointments', 16, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-07 20:31:25\",\"Suhu Anak\":\"32\",\"BB Real\":\"1.3\"}', '2026-06-07 18:31:25'),
(50, 4, 'update', 'appointments', 16, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-07 20:31:40\",\"Catatan\":\"Anak tenang\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-06-07 18:31:40'),
(51, 4, 'update', 'appointments', 18, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-07 20:31:53\",\"Suhu Anak\":\"33\",\"BB Real\":\"2.4\"}', '2026-06-07 18:31:53'),
(52, 4, 'update', 'appointments', 18, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-07 20:32:00\",\"Catatan\":\"Sip\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-06-07 18:32:00'),
(53, 3, 'update', 'appointments', 17, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-07 20:32:30\",\"Suhu Anak\":\"33\",\"BB Real\":\"3.3\"}', '2026-06-07 18:32:30'),
(54, 3, 'update', 'appointments', 17, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-07 20:32:41\",\"Catatan\":\"Sip\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-06-07 18:32:41'),
(55, 1, 'update', 'appointments', 18, '{\"id\":18,\"nama_anak\":\"Kiki\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":18,\"nama_anak\":\"Kiki\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":75000,\"status_pembayaran\":\"Verified\"}', '2026-06-07 18:33:01'),
(56, 1, 'update', 'appointments', 17, '{\"id\":17,\"nama_anak\":\"Sella\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"50000.00\",\"total_komisi_kunjungan\":\"27500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":17,\"nama_anak\":\"Sella\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"50000.00\",\"total_komisi_kunjungan\":\"27500.00\",\"total_bersih\":22500,\"status_pembayaran\":\"Verified\"}', '2026-06-07 18:33:03'),
(57, 1, 'update', 'appointments', 16, '{\"id\":16,\"nama_anak\":\"Dell\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"80000.00\",\"total_komisi_kunjungan\":\"36500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":16,\"nama_anak\":\"Dell\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"80000.00\",\"total_komisi_kunjungan\":\"36500.00\",\"total_bersih\":43500,\"status_pembayaran\":\"Verified\"}', '2026-06-07 18:33:04'),
(58, 1, 'create', 'appointments', 19, NULL, '{\"Nama Anak\":\"Kontol\",\"Usia\":\"1\",\"Berat Badan\":\"2 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"085789575544712\",\"Alamat\":\"sda\",\"Waktu Kunjungan\":\"2026-06-10 01:52:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Cukur Rambut\",\"Total Biaya\":\"Rp 30.000\",\"Total Komisi\":\"Rp 9.000\"}', '2026-06-07 18:53:00'),
(59, 3, 'update', 'appointments', 19, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-06-07 21:44:03\",\"Suhu Anak\":\"33\",\"BB Real\":\"2\"}', '2026-06-07 19:44:03'),
(60, 3, 'update', 'appointments', 19, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-06-07 21:44:11\",\"Catatan\":\"dsadsasd\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-06-07 19:44:11'),
(61, 1, 'update', 'appointments', 19, '{\"id\":19,\"nama_anak\":\"Kontol\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"30000.00\",\"total_komisi_kunjungan\":\"9000.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":19,\"nama_anak\":\"Kontol\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"30000.00\",\"total_komisi_kunjungan\":\"9000.00\",\"total_bersih\":21000,\"status_pembayaran\":\"Verified\"}', '2026-06-07 19:44:25');

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
(5, 'Pijat Laksa', 170000.00, 30.00, '2026-05-19 03:49:57', '2026-06-07 18:00:58', '2026-06-07 18:00:58'),
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
(2, 3, 'Karina Wati', '085785415578', 1, '2026-05-29 11:44:57', '2026-05-29 11:44:57', NULL),
(3, 4, 'Anggi', '08578654434', 1, '2026-06-07 14:50:59', '2026-06-07 14:50:59', NULL);

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
(3, 'karin', 'karin', '', 'therapist', '2026-05-29 11:44:37', '2026-05-29 11:44:37', NULL),
(4, 'anggi', 'anggi', '', 'therapist', '2026-06-07 14:50:37', '2026-06-07 14:50:37', NULL);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `appointment_details`
--
ALTER TABLE `appointment_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `therapists`
--
ALTER TABLE `therapists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
