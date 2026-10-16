  -- phpMyAdmin SQL Dump
  -- version 5.2.1
  -- https://www.phpmyadmin.net/
  --
  -- Host: 127.0.0.1
  -- Generation Time: Oct 16, 2026 at 07:18 AM
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
    `nama_pasien` varchar(150) DEFAULT NULL COMMENT 'Isi dengan "-" jika treatment ibu',
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
    `suhu_pasien` varchar(20) DEFAULT NULL,
    `catatan_terapis` text DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  --
  -- Dumping data for table `appointments`
  --

  INSERT INTO `appointments` (`id`, `id_therapist`, `nama_pasien`, `usia_saat_ini`, `bb_saat_ini`, `bb_real_terapis`, `jenis_kelamin`, `alamat_lengkap`, `link_shareloc`, `no_hp_ortu`, `keluhan_awal`, `waktu_reservasi`, `status_jadwal`, `metode_bayar_admin`, `metode_bayar_terapis`, `status_pembayaran`, `bukti_bayar_url`, `total_harga_kunjungan`, `total_komisi_kunjungan`, `total_bersih`, `created_at`, `updated_at`, `deleted_at`, `waktu_mulai_layanan`, `waktu_selesai_layanan`, `suhu_pasien`, `catatan_terapis`) VALUES
  (1, 1, 'Alinea Salsa', '14 bulan', '3', '3.4', 'Perempuan', 'Jl sana', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '08547896276', 'Pijat', '2026-07-11 19:11:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 55000.00, 16500.00, 38500.00, '2026-07-11 12:11:25', '2026-07-11 12:19:26', NULL, '2026-07-11 14:19:01', '2026-07-11 14:19:11', '35', 'Sudah'),
  (3, 1, 'dsadasd', '32 Tahun', '55', '50', 'Perempuan', 'dsadsa', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '085789575544', 'dsadsa', '2026-07-13 19:44:00', 'Selesai', 'Transfer Bank', 'Transfer Bank', 'Verified', 'payment_3_1783774136.jpeg', 150000.00, 75000.00, 75000.00, '2026-07-11 12:44:08', '2026-07-11 12:49:26', NULL, '2026-07-11 14:48:40', '2026-07-11 14:48:56', NULL, 'Sudah'),
  (4, 1, 'Julian', '2 Tahun', '3', '2', 'Laki-laki', 'Jl sana', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '08547896276', 'pijat bayi dan ibu hamil', '2026-10-14 10:00:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 195000.00, 72500.00, 122500.00, '2026-10-13 02:03:11', '2026-10-13 02:58:21', NULL, '2026-10-13 04:45:26', '2026-10-13 04:57:58', NULL, '-'),
  (5, 1, 'Mary', '15 bulan', '1.3', '1.3', 'Perempuan', 'Jl Mantap', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '081349024053', 'Pijat dan moms', '2026-10-13 09:14:00', 'Selesai', 'Transfer Bank', 'Cash', 'Verified', NULL, 205000.00, 91500.00, 113500.00, '2026-10-13 02:15:02', '2026-10-13 02:44:14', NULL, '2026-10-13 04:39:31', '2026-10-13 04:42:10', NULL, '-'),
  (6, 1, 'Kitty', '13 bulan', '1.4', '1.2', 'Perempuan', 'Jl sana', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '08547896276', 'Pijat', '2026-10-06 11:26:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 55000.00, 16500.00, 38500.00, '2026-10-13 02:25:20', '2026-10-13 02:58:22', NULL, '2026-10-13 04:38:54', '2026-10-13 04:57:45', NULL, '-'),
  (7, 1, 'Julian', '8 bulan', '0.8', '1', 'Laki-laki', 'Jl Pinty', 'https://maps.app.goo.gl/387nXXyFuiKRuK5K6', '08547896276', 'dsada', '2026-10-13 10:49:00', 'Selesai', 'Transfer Bank', 'Cash', 'Verified', NULL, 55000.00, 16500.00, 38500.00, '2026-10-13 02:48:41', '2026-10-13 02:58:19', NULL, '2026-10-13 04:53:11', '2026-10-13 04:57:00', NULL, '-'),
  (8, 1, 'Mbappe', '3 tahun', '4.3', '4.5', 'Laki-laki', 'Jl Madrid', 'https://maps.app.goo.gl/NTeUpNyXLZVU8HeQ9', '085789575544', '-', '2026-10-15 09:59:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 55000.00, 16500.00, 38500.00, '2026-10-13 02:59:11', '2026-10-16 04:13:20', NULL, NULL, NULL, NULL, NULL),
  (9, 1, 'Udin', '14 bulan', '2.2', '2.5', 'Laki-laki', 'DPR', 'https://maps.app.goo.gl/ynhMXk5D7hcHtm4u7', '085820664592', 'pijat', '2026-10-16 11:00:00', 'Selesai', 'Transfer Bank', 'Transfer Bank', 'Verified', 'payment_9_1792123769.jpg', 150000.00, 75000.00, 75000.00, '2026-10-16 04:01:08', '2026-10-16 04:11:30', NULL, '2026-10-16 06:05:38', '2026-10-16 06:09:29', NULL, 'sip'),
  (10, 1, 'Rafa A', '14 bulan', '2.2', '2', 'Laki-laki', 'situ', 'https://maps.app.goo.gl/ynhMXk5D7hcHtm4u7', '085820664592', 'sadas', '2026-10-16 12:02:00', 'Selesai', 'Cash', 'Cash', 'Verified', NULL, 300000.00, 150000.00, 150000.00, '2026-10-16 04:02:38', '2026-10-16 04:36:44', NULL, '2026-10-16 06:36:03', '2026-10-16 06:36:10', NULL, 'dsa'),
  (11, 1, 'kinta', '12 bulan', '2.5', NULL, 'Laki-laki', 'dsasd', 'https://maps.app.goo.gl/ynhMXk5D7hcHtm4u7', '085820664592', 'dsadas', '2026-10-16 13:40:00', 'Selesai', 'Cash', NULL, 'Unverified', NULL, 140000.00, 56000.00, NULL, '2026-10-16 04:40:42', '2026-10-16 04:55:39', NULL, NULL, NULL, NULL, ''),
  (12, 1, 'kintass', '12 bulan', '2.5', NULL, 'Laki-laki', 'dasda', 'https://maps.app.goo.gl/ynhMXk5D7hcHtm4u7', '085820664592', 'dsads', '2026-10-16 13:55:00', 'Dibatalkan', 'Cash', NULL, 'Unverified', NULL, 55000.00, 16500.00, NULL, '2026-10-16 04:56:00', '2026-10-16 04:56:19', NULL, NULL, NULL, NULL, '[Dibatalkan 16/10/2026 06:56: Permintaan Pasien / Ortu]'),
  (13, 1, 'kintassdsssad', '12 bulan', '2.5', NULL, 'Laki-laki', 'dsad', 'https://maps.app.goo.gl/ynhMXk5D7hcHtm4u7', '085820664592', 'dsadsa', '2026-10-16 13:00:00', 'Menunggu', 'Cash', NULL, 'Unverified', NULL, 55000.00, 16500.00, NULL, '2026-10-16 04:56:47', '2026-10-16 04:56:47', NULL, NULL, NULL, NULL, NULL),
  (14, 1, 'dsadsaskintassdsssad', '12 bulan', '2.5', NULL, 'Laki-laki', 'dsadas', 'https://maps.app.goo.gl/ynhMXk5D7hcHtm4u7', '085820664592', 'dadas', '2026-10-16 14:00:00', 'Menunggu', 'Cash', NULL, 'Unverified', NULL, 55000.00, 16500.00, NULL, '2026-10-16 04:58:38', '2026-10-16 04:58:38', NULL, NULL, NULL, NULL, NULL);

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
  (1, 1, 4, 55000.00, 30.00, 16500.00, '2026-07-11 12:11:25', '2026-07-11 12:11:25', NULL),
  (3, 3, 3, 150000.00, 50.00, 75000.00, '2026-07-11 12:44:08', '2026-07-11 12:44:08', NULL),
  (4, 4, 4, 55000.00, 30.00, 16500.00, '2026-10-13 02:03:11', '2026-10-13 02:03:11', NULL),
  (5, 4, 2, 140000.00, 40.00, 56000.00, '2026-10-13 02:03:11', '2026-10-13 02:03:11', NULL),
  (6, 5, 4, 55000.00, 30.00, 16500.00, '2026-10-13 02:15:02', '2026-10-13 02:15:02', NULL),
  (7, 5, 3, 150000.00, 50.00, 75000.00, '2026-10-13 02:15:02', '2026-10-13 02:15:02', NULL),
  (8, 6, 4, 55000.00, 30.00, 16500.00, '2026-10-13 02:25:20', '2026-10-13 02:25:20', NULL),
  (9, 7, 4, 55000.00, 30.00, 16500.00, '2026-10-13 02:48:41', '2026-10-13 02:48:41', NULL),
  (10, 8, 4, 55000.00, 30.00, 16500.00, '2026-10-13 02:59:11', '2026-10-13 02:59:11', NULL),
  (11, 9, 3, 150000.00, 50.00, 75000.00, '2026-10-16 04:01:08', '2026-10-16 04:01:08', NULL),
  (12, 10, 3, 150000.00, 50.00, 75000.00, '2026-10-16 04:02:38', '2026-10-16 04:02:38', NULL),
  (13, 10, 3, 150000.00, 50.00, 75000.00, '2026-10-16 04:02:38', '2026-10-16 04:02:38', NULL),
  (14, 11, 2, 140000.00, 40.00, 56000.00, '2026-10-16 04:40:42', '2026-10-16 04:40:42', NULL),
  (15, 12, 4, 55000.00, 30.00, 16500.00, '2026-10-16 04:56:00', '2026-10-16 04:56:00', NULL),
  (16, 13, 4, 55000.00, 30.00, 16500.00, '2026-10-16 04:56:47', '2026-10-16 04:56:47', NULL),
  (17, 14, 4, 55000.00, 30.00, 16500.00, '2026-10-16 04:58:38', '2026-10-16 04:58:38', NULL);

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
  (1, 1, 'create', 'services', 2, NULL, '{\"kategori_id\":\"1\",\"nama_layanan\":\"Pijat laktasi+Oksitosin\",\"type_layanan\":\"\",\"harga_saat_ini\":\"140000\",\"persentase_komisi\":\"40\"}', '2026-07-11 12:07:06'),
  (2, 1, 'create', 'services', 3, NULL, '{\"kategori_id\":\"2\",\"nama_layanan\":\"Pijat laktasi+Oksitosin\",\"type_layanan\":\"\",\"harga_saat_ini\":\"150000\",\"persentase_komisi\":\"50\"}', '2026-07-11 12:07:25'),
  (3, 1, 'create', 'services', 4, NULL, '{\"kategori_id\":\"3\",\"nama_layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"type_layanan\":\"\",\"harga_saat_ini\":\"55000\",\"persentase_komisi\":\"30\"}', '2026-07-11 12:09:09'),
  (4, 1, 'create', 'therapists', 1, NULL, '{\"user_id\":2,\"nama_terapis\":\"Karina Wati\",\"no_whatsapp\":\"085563244\",\"status_aktif\":1}', '2026-07-11 12:10:42'),
  (5, 1, 'create', 'appointments', 1, NULL, '{\"Nama Anak\":\"Alinea Salsa\",\"Usia\":\"14 bulan\",\"Berat Badan\":\"3 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"Jl sana\",\"Waktu Kunjungan\":\"2026-07-11 19:11:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"Total Biaya\":\"Rp 55.000\",\"Total Komisi\":\"Rp 16.500\"}', '2026-07-11 12:11:25'),
  (6, 2, 'update', 'appointments', 1, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-07-11 14:19:01\",\"Suhu Anak\":\"35\",\"BB Real\":\"3.4\"}', '2026-07-11 12:19:01'),
  (7, 2, 'update', 'appointments', 1, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-07-11 14:19:11\",\"Catatan\":\"Sudah\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-07-11 12:19:11'),
  (8, 1, 'update', 'appointments', 1, '{\"id\":1,\"nama_anak\":\"Alinea Salsa\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":1,\"nama_anak\":\"Alinea Salsa\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":38500,\"status_pembayaran\":\"Verified\"}', '2026-07-11 12:19:26'),
  (9, 1, 'create', 'appointments', 2, NULL, '{\"Nama Ortu\":\"Salsa\",\"Nama Anak\":\"\",\"Usia\":\"32 Tahun\",\"Berat Badan\":\"53.8 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"085789575544\",\"Alamat\":\"Jl Sana\",\"Waktu Kunjungan\":\"2026-07-11 20:30:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat laktasi+Oksitosin\",\"Total Biaya\":\"Rp 140.000\",\"Total Komisi\":\"Rp 56.000\"}', '2026-07-11 12:31:08'),
  (10, 1, 'create', 'appointments', 3, NULL, '{\"Nama Pasien\":\"dsadasd\",\"Usia\":\"32 Tahun\",\"Berat Badan\":\"55 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"085789575544\",\"Alamat\":\"dsadsa\",\"Waktu Kunjungan\":\"2026-07-13 19:44:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Pijat laktasi+Oksitosin\",\"Total Biaya\":\"Rp 150.000\",\"Total Komisi\":\"Rp 75.000\"}', '2026-07-11 12:44:08'),
  (11, 2, 'update', 'appointments', 3, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-07-11 14:48:40\",\"Suhu Pasien\":null,\"BB Real\":\"50\"}', '2026-07-11 12:48:40'),
  (12, 2, 'update', 'appointments', 3, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-07-11 14:48:56\",\"Catatan\":\"Sudah\",\"Metode Bayar (Terapis)\":\"Transfer Bank\",\"Bukti Bayar\":\"payment_3_1783774136.jpeg\"}', '2026-07-11 12:48:56'),
  (13, 1, 'update', 'appointments', 3, '{\"id\":3,\"nama_pasien\":\"dsadasd\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":3,\"nama_pasien\":\"dsadasd\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":75000,\"status_pembayaran\":\"Verified\"}', '2026-07-11 12:49:26'),
  (14, 1, 'create', 'appointments', 4, NULL, '{\"Nama Pasien\":\"Julian\",\"Usia\":\"2 Tahun\",\"Berat Badan\":\"3 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"Jl sana\",\"Waktu Kunjungan\":\"2026-10-14 10:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu, Pijat laktasi+Oksitosin\",\"Total Biaya\":\"Rp 195.000\",\"Total Komisi\":\"Rp 72.500\"}', '2026-10-13 02:03:11'),
  (15, 1, 'create', 'appointments', 5, NULL, '{\"Nama Pasien\":\"Mary\",\"Usia\":\"15 bulan\",\"Berat Badan\":\"1.3 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"081349024053\",\"Alamat\":\"Jl Mantap\",\"Waktu Kunjungan\":\"2026-10-13 09:14:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu, Pijat laktasi+Oksitosin\",\"Total Biaya\":\"Rp 205.000\",\"Total Komisi\":\"Rp 91.500\"}', '2026-10-13 02:15:02'),
  (16, 1, 'create', 'appointments', 6, NULL, '{\"Nama Pasien\":\"Kitty\",\"Usia\":\"13 bulan\",\"Berat Badan\":\"1.4 kg\",\"Jenis Kelamin\":\"Perempuan\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"Jl sana\",\"Waktu Kunjungan\":\"2026-10-06 11:26:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"Total Biaya\":\"Rp 55.000\",\"Total Komisi\":\"Rp 16.500\"}', '2026-10-13 02:25:20'),
  (17, 2, 'update', 'appointments', 6, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-10-13 04:38:54\",\"Suhu Pasien\":null,\"BB Real\":\"1.2\"}', '2026-10-13 02:38:54'),
  (18, 2, 'update', 'appointments', 5, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-10-13 04:39:31\",\"Suhu Pasien\":null,\"BB Real\":\"1.3\"}', '2026-10-13 02:39:31'),
  (19, 2, 'update', 'appointments', 5, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-10-13 04:42:10\",\"Catatan\":\"-\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-10-13 02:42:10'),
  (20, 1, 'update', 'appointments', 5, '{\"id\":5,\"nama_pasien\":\"Mary\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"205000.00\",\"total_komisi_kunjungan\":\"91500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":5,\"nama_pasien\":\"Mary\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"205000.00\",\"total_komisi_kunjungan\":\"91500.00\",\"total_bersih\":113500,\"status_pembayaran\":\"Verified\"}', '2026-10-13 02:44:15'),
  (21, 2, 'update', 'appointments', 4, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-10-13 04:45:26\",\"Suhu Pasien\":null,\"BB Real\":\"2\"}', '2026-10-13 02:45:26'),
  (22, 1, 'create', 'appointments', 7, NULL, '{\"Nama Pasien\":\"Julian\",\"Usia\":\"8 bulan\",\"Berat Badan\":\"0.8 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"08547896276\",\"Alamat\":\"Jl Pinty\",\"Waktu Kunjungan\":\"2026-10-13 10:49:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"Total Biaya\":\"Rp 55.000\",\"Total Komisi\":\"Rp 16.500\"}', '2026-10-13 02:48:41'),
  (23, 2, 'update', 'appointments', 7, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-10-13 04:53:11\",\"Suhu Pasien\":null,\"BB Real\":\"1\"}', '2026-10-13 02:53:11'),
  (24, 2, 'update', 'appointments', 7, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-10-13 04:57:00\",\"Catatan\":\"-\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-10-13 02:57:00'),
  (25, 2, 'update', 'appointments', 6, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-10-13 04:57:45\",\"Catatan\":\"-\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-10-13 02:57:45'),
  (26, 2, 'update', 'appointments', 4, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-10-13 04:57:58\",\"Catatan\":\"-\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-10-13 02:57:58'),
  (27, 1, 'update', 'appointments', 7, '{\"id\":7,\"nama_pasien\":\"Julian\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":7,\"nama_pasien\":\"Julian\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":38500,\"status_pembayaran\":\"Verified\"}', '2026-10-13 02:58:19'),
  (28, 1, 'update', 'appointments', 4, '{\"id\":4,\"nama_pasien\":\"Julian\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"195000.00\",\"total_komisi_kunjungan\":\"72500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":4,\"nama_pasien\":\"Julian\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"195000.00\",\"total_komisi_kunjungan\":\"72500.00\",\"total_bersih\":122500,\"status_pembayaran\":\"Verified\"}', '2026-10-13 02:58:21'),
  (29, 1, 'update', 'appointments', 6, '{\"id\":6,\"nama_pasien\":\"Kitty\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":6,\"nama_pasien\":\"Kitty\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":38500,\"status_pembayaran\":\"Verified\"}', '2026-10-13 02:58:22'),
  (30, 1, 'create', 'appointments', 8, NULL, '{\"Nama Pasien\":\"Mbappe\",\"Usia\":\"3 tahun\",\"Berat Badan\":\"4.3 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085789575544\",\"Alamat\":\"Jl Madrid\",\"Waktu Kunjungan\":\"2026-10-15 09:59:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"Total Biaya\":\"Rp 55.000\",\"Total Komisi\":\"Rp 16.500\"}', '2026-10-13 02:59:11'),
  (31, 1, 'create', 'services', 5, NULL, '{\"kategori_id\":\"2\",\"nama_layanan\":\"dsad\",\"type_layanan\":\"\",\"harga_saat_ini\":\"120000\",\"persentase_komisi\":\"50\"}', '2026-10-13 03:00:46'),
  (32, 1, 'delete', 'services', 5, '{\"kategori_id\":2,\"nama_layanan\":\"dsad\",\"type_layanan\":\"\",\"harga_saat_ini\":\"120000.00\",\"persentase_komisi\":\"50.00\"}', NULL, '2026-10-13 03:00:49'),
  (33, 1, 'restore', 'services', 5, '{\"kategori_id\":2,\"nama_layanan\":\"dsad\",\"type_layanan\":\"\",\"harga_saat_ini\":\"120000.00\",\"persentase_komisi\":\"50.00\"}', '{\"id\":5,\"kategori_id\":2,\"nama_layanan\":\"dsad\",\"harga_saat_ini\":\"120000.00\",\"persentase_komisi\":\"50.00\",\"created_at\":\"2026-10-13 10:00:46\",\"updated_at\":\"2026-10-13 10:16:39\",\"deleted_at\":null}', '2026-10-13 03:16:39'),
  (34, 1, 'delete', 'services', 4, '{\"kategori_id\":3,\"nama_layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"harga_saat_ini\":\"55000.00\",\"persentase_komisi\":\"30.00\"}', NULL, '2026-10-13 03:19:09'),
  (35, 1, 'restore', 'services', 4, '{\"kategori_id\":3,\"nama_layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"harga_saat_ini\":\"55000.00\",\"persentase_komisi\":\"30.00\"}', '{\"id\":4,\"kategori_id\":3,\"nama_layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"harga_saat_ini\":\"55000.00\",\"persentase_komisi\":\"30.00\",\"created_at\":\"2026-07-11 19:09:09\",\"updated_at\":\"2026-10-13 10:19:22\",\"deleted_at\":null}', '2026-10-13 03:19:22'),
  (36, 1, 'delete', 'therapists', 1, '{\"user_id\":2,\"nama_terapis\":\"Karina Wati\",\"no_whatsapp\":\"085563244\",\"status_aktif\":1}', NULL, '2026-10-13 03:20:56'),
  (37, 1, 'restore', 'therapists', 1, '{\"user_id\":2,\"nama_terapis\":\"Karina Wati\",\"no_whatsapp\":\"085563244\",\"status_aktif\":1}', '{\"id\":1,\"user_id\":2,\"nama_terapis\":\"Karina Wati\",\"no_whatsapp\":\"085563244\",\"status_aktif\":1,\"created_at\":\"2026-07-11 19:10:42\",\"updated_at\":\"2026-10-13 10:21:28\",\"deleted_at\":null}', '2026-10-13 03:21:28'),
  (38, 1, 'delete', 'services', 5, '{\"kategori_id\":2,\"nama_layanan\":\"dsad\",\"harga_saat_ini\":\"120000.00\",\"persentase_komisi\":\"50.00\"}', NULL, '2026-10-13 03:22:47'),
  (39, 1, 'delete', 'services', 5, '{\"kategori_id\":2,\"nama_layanan\":\"dsad\",\"harga_saat_ini\":\"120000.00\",\"persentase_komisi\":\"50.00\"}', '{\"keterangan\":\"Hapus permanen manual oleh pengguna\",\"snapshot_lama\":\"{\\\"kategori_id\\\":2,\\\"nama_layanan\\\":\\\"dsad\\\",\\\"harga_saat_ini\\\":\\\"120000.00\\\",\\\"persentase_komisi\\\":\\\"50.00\\\"}\"}', '2026-10-13 03:31:46'),
  (40, 1, 'create', 'appointments', 9, NULL, '{\"Nama Pasien\":\"Udin\",\"Usia\":\"14 bulan\",\"Berat Badan\":\"2.2 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085820664592\",\"Alamat\":\"DPR\",\"Waktu Kunjungan\":\"2026-10-16 11:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Transfer Bank\",\"Layanan\":\"Pijat laktasi+Oksitosin\",\"Total Biaya\":\"Rp 150.000\",\"Total Komisi\":\"Rp 75.000\"}', '2026-10-16 04:01:08'),
  (41, 1, 'create', 'appointments', 10, NULL, '{\"Nama Pasien\":\"Rafa A\",\"Usia\":\"14 bulan\",\"Berat Badan\":\"2.2 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085820664592\",\"Alamat\":\"situ\",\"Waktu Kunjungan\":\"2026-10-16 12:02:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat laktasi+Oksitosin, Pijat laktasi+Oksitosin\",\"Total Biaya\":\"Rp 300.000\",\"Total Komisi\":\"Rp 150.000\"}', '2026-10-16 04:02:38'),
  (42, 2, 'update', 'appointments', 9, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-10-16 06:05:38\",\"Suhu Pasien\":null,\"BB Real\":\"2.5\"}', '2026-10-16 04:05:38'),
  (43, 2, 'update', 'appointments', 9, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-10-16 06:09:29\",\"Catatan\":\"sip\",\"Metode Bayar (Terapis)\":\"Transfer Bank\",\"Bukti Bayar\":\"payment_9_1792123769.jpg\"}', '2026-10-16 04:09:29'),
  (44, 1, 'update', 'appointments', 8, '{\"id\":8,\"nama_pasien\":\"Mbappe\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":8,\"nama_pasien\":\"Mbappe\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":null,\"total_harga_kunjungan\":\"55000.00\",\"total_komisi_kunjungan\":\"16500.00\",\"total_bersih\":38500,\"status_pembayaran\":\"Verified\"}', '2026-10-16 04:11:26'),
  (45, 1, 'update', 'appointments', 9, '{\"id\":9,\"nama_pasien\":\"Udin\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":9,\"nama_pasien\":\"Udin\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":75000,\"status_pembayaran\":\"Verified\"}', '2026-10-16 04:11:30'),
  (46, 1, 'update', 'appointments', 9, '{\"id\":9,\"nama_pasien\":\"Udin\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":\"75000.00\",\"status_pembayaran\":\"Verified\"}', '{\"id\":9,\"nama_pasien\":\"Udin\",\"metode_bayar_admin\":\"Transfer Bank\",\"metode_bayar_terapis\":\"Transfer Bank\",\"total_harga_kunjungan\":\"150000.00\",\"total_komisi_kunjungan\":\"75000.00\",\"total_bersih\":75000,\"status_pembayaran\":\"Verified\"}', '2026-10-16 04:11:30'),
  (47, 1, 'update', 'appointments', 10, '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Menunggu\"}', '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Dibatalkan\",\"Alasan Pembatalan\":\"-\"}', '2026-10-16 04:31:08'),
  (48, 1, 'update', 'appointments', 10, '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Dibatalkan\"}', '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Menunggu\"}', '2026-10-16 04:31:27'),
  (49, 1, 'update', 'appointments', 10, '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Menunggu\"}', '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Dibatalkan\",\"Alasan Pembatalan\":\"Permintaan Pasien \\/ Ortu\"}', '2026-10-16 04:31:33'),
  (50, 1, 'update', 'appointments', 10, '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Dibatalkan\"}', '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Menunggu\"}', '2026-10-16 04:34:46'),
  (51, 1, 'update', 'appointments', 10, '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Menunggu\"}', '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Dibatalkan\",\"Alasan Pembatalan\":\"Jadwal Dobel \\/ Salah Input\"}', '2026-10-16 04:34:58'),
  (52, 1, 'update', 'appointments', 10, '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Dibatalkan\"}', '{\"nama_pasien\":\"Rafa A\",\"Status Jadwal\":\"Menunggu\"}', '2026-10-16 04:35:28'),
  (53, 2, 'update', 'appointments', 10, NULL, '{\"Status\":\"Diproses\",\"Waktu Mulai\":\"2026-10-16 06:36:03\",\"Suhu Pasien\":null,\"BB Real\":\"2\"}', '2026-10-16 04:36:03'),
  (54, 2, 'update', 'appointments', 10, NULL, '{\"Status\":\"Selesai\",\"Waktu Selesai\":\"2026-10-16 06:36:10\",\"Catatan\":\"dsa\",\"Metode Bayar (Terapis)\":\"Cash\",\"Bukti Bayar\":null}', '2026-10-16 04:36:10'),
  (55, 1, 'update', 'appointments', 10, '{\"id\":10,\"nama_pasien\":\"Rafa A\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"300000.00\",\"total_komisi_kunjungan\":\"150000.00\",\"total_bersih\":null,\"status_pembayaran\":\"Unverified\"}', '{\"id\":10,\"nama_pasien\":\"Rafa A\",\"metode_bayar_admin\":\"Cash\",\"metode_bayar_terapis\":\"Cash\",\"total_harga_kunjungan\":\"300000.00\",\"total_komisi_kunjungan\":\"150000.00\",\"total_bersih\":150000,\"status_pembayaran\":\"Verified\"}', '2026-10-16 04:36:44'),
  (56, 1, 'create', 'appointments', 11, NULL, '{\"Nama Pasien\":\"kinta\",\"Usia\":\"12 bulan\",\"Berat Badan\":\"2.5 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085820664592\",\"Alamat\":\"dsasd\",\"Waktu Kunjungan\":\"2026-10-16 13:40:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Pijat laktasi+Oksitosin\",\"Total Biaya\":\"Rp 140.000\",\"Total Komisi\":\"Rp 56.000\"}', '2026-10-16 04:40:42'),
  (57, 1, 'update', 'appointments', 11, '{\"nama_pasien\":\"kinta\",\"Status Jadwal\":\"Menunggu\"}', '{\"nama_pasien\":\"kinta\",\"Status Jadwal\":\"Selesai\"}', '2026-10-16 04:55:39'),
  (58, 1, 'create', 'appointments', 12, NULL, '{\"Nama Pasien\":\"kintass\",\"Usia\":\"12 bulan\",\"Berat Badan\":\"2.5 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085820664592\",\"Alamat\":\"dasda\",\"Waktu Kunjungan\":\"2026-10-16 13:55:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"Total Biaya\":\"Rp 55.000\",\"Total Komisi\":\"Rp 16.500\"}', '2026-10-16 04:56:00'),
  (59, 1, 'update', 'appointments', 12, '{\"nama_pasien\":\"kintass\",\"Status Jadwal\":\"Menunggu\"}', '{\"nama_pasien\":\"kintass\",\"Status Jadwal\":\"Dibatalkan\",\"Alasan Pembatalan\":\"Permintaan Pasien \\/ Ortu\"}', '2026-10-16 04:56:19'),
  (60, 1, 'create', 'appointments', 13, NULL, '{\"Nama Pasien\":\"kintassdsssad\",\"Usia\":\"12 bulan\",\"Berat Badan\":\"2.5 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085820664592\",\"Alamat\":\"dsad\",\"Waktu Kunjungan\":\"2026-10-16 13:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"Total Biaya\":\"Rp 55.000\",\"Total Komisi\":\"Rp 16.500\"}', '2026-10-16 04:56:47'),
  (61, 1, 'create', 'appointments', 14, NULL, '{\"Nama Pasien\":\"dsadsaskintassdsssad\",\"Usia\":\"12 bulan\",\"Berat Badan\":\"2.5 kg\",\"Jenis Kelamin\":\"Laki-laki\",\"No WhatsApp\":\"085820664592\",\"Alamat\":\"dsadas\",\"Waktu Kunjungan\":\"2026-10-16 14:00:00\",\"Terapis\":\"Karina Wati\",\"Metode Bayar\":\"Cash\",\"Layanan\":\"Baby Massage Immune Booster U 0-2 Tahu\",\"Total Biaya\":\"Rp 55.000\",\"Total Komisi\":\"Rp 16.500\"}', '2026-10-16 04:58:38');

  -- --------------------------------------------------------

  --
  -- Table structure for table `kategori`
  --

  CREATE TABLE `kategori` (
    `id_kategori` bigint(20) NOT NULL,
    `nama_kategori` varchar(150) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  --
  -- Dumping data for table `kategori`
  --

  INSERT INTO `kategori` (`id_kategori`, `nama_kategori`) VALUES
  (1, 'Moms Treatment Outlet'),
  (2, 'Moms Treatment Homecare'),
  (3, 'Baby and Kids Outlet');

  -- --------------------------------------------------------

  --
  -- Table structure for table `services`
  --

  CREATE TABLE `services` (
    `id` bigint(20) UNSIGNED NOT NULL,
    `kategori_id` bigint(10) NOT NULL,
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

  INSERT INTO `services` (`id`, `kategori_id`, `nama_layanan`, `harga_saat_ini`, `persentase_komisi`, `created_at`, `updated_at`, `deleted_at`) VALUES
  (2, 1, 'Pijat laktasi+Oksitosin', 140000.00, 40.00, '2026-07-11 12:07:06', '2026-07-11 12:07:06', NULL),
  (3, 2, 'Pijat laktasi+Oksitosin', 150000.00, 50.00, '2026-07-11 12:07:25', '2026-07-11 12:07:25', NULL),
  (4, 3, 'Baby Massage Immune Booster U 0-2 Tahu', 55000.00, 30.00, '2026-07-11 12:09:09', '2026-10-13 03:19:22', NULL);

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
  (1, 2, 'Karina Wati', '085563244', 1, '2026-07-11 12:10:42', '2026-10-13 03:21:28', NULL);

  -- --------------------------------------------------------

  --
  -- Table structure for table `users`
  --

  CREATE TABLE `users` (
    `id` bigint(20) UNSIGNED NOT NULL,
    `username` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `foto` varchar(255) DEFAULT NULL,
    `role` enum('admin','therapist') NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `deleted_at` timestamp NULL DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  --
  -- Dumping data for table `users`
  --

  INSERT INTO `users` (`id`, `username`, `password`, `foto`, `role`, `created_at`, `updated_at`, `deleted_at`) VALUES
  (1, 'admin', 'admin', NULL, 'admin', '2026-06-24 09:28:58', '2026-06-24 09:28:58', NULL),
  (2, 'karin', 'karin', NULL, 'therapist', '2026-07-11 12:09:50', '2026-07-11 12:09:50', NULL);

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
  -- Indexes for table `kategori`
  --
  ALTER TABLE `kategori`
    ADD PRIMARY KEY (`id_kategori`);

  --
  -- Indexes for table `services`
  --
  ALTER TABLE `services`
    ADD PRIMARY KEY (`id`),
    ADD KEY `kategori_id` (`kategori_id`);

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
    MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

  --
  -- AUTO_INCREMENT for table `appointment_details`
  --
  ALTER TABLE `appointment_details`
    MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

  --
  -- AUTO_INCREMENT for table `audit_logs`
  --
  ALTER TABLE `audit_logs`
    MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

  --
  -- AUTO_INCREMENT for table `kategori`
  --
  ALTER TABLE `kategori`
    MODIFY `id_kategori` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

  --
  -- AUTO_INCREMENT for table `services`
  --
  ALTER TABLE `services`
    MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

  --
  -- AUTO_INCREMENT for table `therapists`
  --
  ALTER TABLE `therapists`
    MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

  --
  -- AUTO_INCREMENT for table `users`
  --
  ALTER TABLE `users`
    MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  -- Constraints for table `services`
  --
  ALTER TABLE `services`
    ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id_kategori`);

  --
  -- Constraints for table `therapists`
  --
  ALTER TABLE `therapists`
    ADD CONSTRAINT `fk_therapists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
  COMMIT;

  /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
  /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
  /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
