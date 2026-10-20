-- phpMyAdmin SQL Dump
-- Database: `db_awee_babycare`

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `role` enum('admin','therapist') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `kategori`
--

CREATE TABLE IF NOT EXISTS `kategori` (
  `id_kategori` bigint(20) NOT NULL AUTO_INCREMENT,
  `nama_kategori` varchar(150) NOT NULL,
  PRIMARY KEY (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `therapists`
--

CREATE TABLE IF NOT EXISTS `therapists` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nik` char(16) DEFAULT NULL,
  `nama_terapis` varchar(150) NOT NULL,
  `no_whatsapp` varchar(20) NOT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `kelurahan` varchar(100) DEFAULT NULL,
  `kecamatan` varchar(100) DEFAULT NULL,
  `kota_kabupaten` varchar(100) DEFAULT NULL,
  `provinsi` varchar(100) DEFAULT NULL,
  `agama` varchar(30) DEFAULT NULL,
  `status_perkawinan` varchar(30) DEFAULT NULL,
  `status_aktif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_therapists_nik` (`nik`),
  KEY `fk_therapists_user` (`user_id`),
  CONSTRAINT `fk_therapists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `services`
--

CREATE TABLE IF NOT EXISTS `services` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kategori_id` bigint(10) NOT NULL,
  `nama_layanan` varchar(150) NOT NULL,
  `harga_saat_ini` decimal(12,2) NOT NULL,
  `persentase_komisi` decimal(5,2) NOT NULL COMMENT 'Format persentase misal 50.00 untuk 50%',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kategori_id` (`kategori_id`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `appointments`
--

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
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
  `status_pembayaran` enum('Unverified','Verified','Rejected') DEFAULT 'Unverified',
  `alasan_penolakan` text DEFAULT NULL,
  `waktu_penolakan` datetime DEFAULT NULL,
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
  `catatan_terapis` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_appointments_therapist` (`id_therapist`),
  CONSTRAINT `fk_appointments_therapist` FOREIGN KEY (`id_therapist`) REFERENCES `therapists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `appointment_details`
--

CREATE TABLE IF NOT EXISTS `appointment_details` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_appointment` bigint(20) UNSIGNED NOT NULL,
  `id_service` bigint(20) UNSIGNED NOT NULL,
  `harga_snapshot` decimal(12,2) NOT NULL,
  `persentase_komisi_snapshot` decimal(5,2) NOT NULL,
  `nominal_komisi_kalkulasi` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_details_appointment` (`id_appointment`),
  KEY `fk_details_service` (`id_service`),
  CONSTRAINT `fk_details_appointment` FOREIGN KEY (`id_appointment`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_details_service` FOREIGN KEY (`id_service`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `audit_logs`
--

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `aksi` enum('create','update','delete','restore') NOT NULL,
  `nama_tabel` varchar(100) NOT NULL,
  `record_id` bigint(20) UNSIGNED NOT NULL,
  `data_lama` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Nilai sebelum diubah' CHECK (json_valid(`data_lama`)),
  `data_baru` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Nilai setelah diubah' CHECK (json_valid(`data_baru`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_audit_users` (`user_id`),
  CONSTRAINT `fk_audit_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;