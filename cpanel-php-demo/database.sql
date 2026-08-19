-- ============================================================================
-- database.sql — SIKAT RTB (Demo PHP + MySQL)
-- ----------------------------------------------------------------------------
-- Cara pakai (lewat phpMyAdmin):
--   1. Buat database baru, misalnya "sikat_rtb_demo" (collation utf8mb4 apa
--      saja, contoh: utf8mb4_general_ci).
--   2. Buka database itu, klik tab "SQL".
--   3. Copy-paste SELURUH isi file ini, lalu klik tombol "Go" / "Kirim".
--   4. Sesuaikan config.php dengan nama database yang Anda buat.
--
-- Struktur tabel di bawah ini mengikuti persis docs/database/schema.sql pada
-- project utama (Next.js). Ditambahkan data contoh (seed) di bagian bawah
-- supaya begitu selesai import, demo langsung bisa dicoba tanpa input manual:
-- 1 akun pengelola, 1 akun+data satpam, 4 akun+data mahasiswa, dan 4 izin
-- contoh dalam status yang berbeda-beda.
--
-- Password SEMUA akun demo adalah: demo123
-- (disimpan sebagai hash bcrypt, dibuat dengan cara yang sama seperti
-- PHP password_hash($password, PASSWORD_BCRYPT) — jadi password_verify()
-- di login.php bisa langsung mencocokkannya).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STRUKTUR TABEL
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS master_residents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bca_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  gender VARCHAR(30) NOT NULL DEFAULT 'TIDAK_DISEBUTKAN',
  resident_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  phone_number VARCHAR(30),
  email VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT UNIQUE,
  bca_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES master_residents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS security_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bca_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(30) NOT NULL DEFAULT 'TIDAK_DISEBUTKAN',
  staff_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT NOT NULL,
  permit_code VARCHAR(100) NOT NULL UNIQUE,
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  destination VARCHAR(255) NOT NULL,
  permit_type VARCHAR(50) NOT NULL DEFAULT 'IZIN_PRIBADI',
  planned_departure_at DATETIME NOT NULL,
  planned_return_at DATETIME NOT NULL,
  entry_code VARCHAR(50),
  status VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES master_residents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permit_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permit_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  performed_by_account_id INT,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (permit_id) REFERENCES permits(id),
  FOREIGN KEY (performed_by_account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_account_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS manager_bootstrap_links (
  bootstrap_bca_id VARCHAR(50) PRIMARY KEY,
  account_id INT NOT NULL UNIQUE,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_by_account_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification_deliveries (
  notification_id INT NOT NULL,
  account_id INT NOT NULL,
  read_at DATETIME,
  PRIMARY KEY (notification_id, account_id),
  FOREIGN KEY (notification_id) REFERENCES broadcast_notifications(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. DATA CONTOH (SEED) — supaya demo langsung bisa dicoba setelah import
-- ----------------------------------------------------------------------------

-- 2a. Data induk penghuni (mahasiswa)
INSERT INTO master_residents (id, bca_id, full_name, room_number, class_name, gender, resident_status, phone_number, email) VALUES
(1, '200001', 'Ahmad Fadillah', 'A101', 'TI-3A', 'LAKI_LAKI', 'ACTIVE', '6281234567001', 'ahmad.fadillah@example.com'),
(2, '200002', 'Siti Nurhaliza', 'A102', 'TI-3A', 'PEREMPUAN', 'ACTIVE', '6281234567002', 'siti.nurhaliza@example.com'),
(3, '200003', 'Budi Santoso', 'B201', 'SI-2B', 'LAKI_LAKI', 'ACTIVE', '6281234567003', 'budi.santoso@example.com'),
(4, '200004', 'Dewi Lestari', 'B202', 'SI-2B', 'PEREMPUAN', 'ACTIVE', '6281234567004', 'dewi.lestari@example.com');

-- 2b. Data petugas satpam
INSERT INTO security_staff (id, bca_id, full_name, gender, staff_status) VALUES
(1, '90001', 'Joko Prasetyo', 'LAKI_LAKI', 'ACTIVE');

-- 2c. Akun login untuk semua role.
-- Password untuk SEMUA akun di bawah ini: demo123
-- Hash bcrypt berikut dibuat dari 'demo123' (setara password_hash('demo123', PASSWORD_BCRYPT)).
INSERT INTO accounts (id, resident_id, bca_id, full_name, role, password_hash, is_active, must_change_password) VALUES
(1, NULL, '100001', 'Pengelola RTB', 'MANAGER', '$2a$10$BQFWjx60eTDeUAyZoIFvoeTq.djajCKH1Jf/UHabE5gGfW23le3LW', 1, 0),
(2, NULL, '90001',  'Joko Prasetyo', 'SECURITY', '$2a$10$BQFWjx60eTDeUAyZoIFvoeTq.djajCKH1Jf/UHabE5gGfW23le3LW', 1, 0),
(3, 1,    '200001', 'Ahmad Fadillah', 'STUDENT', '$2a$10$BQFWjx60eTDeUAyZoIFvoeTq.djajCKH1Jf/UHabE5gGfW23le3LW', 1, 0),
(4, 2,    '200002', 'Siti Nurhaliza', 'STUDENT', '$2a$10$BQFWjx60eTDeUAyZoIFvoeTq.djajCKH1Jf/UHabE5gGfW23le3LW', 1, 0),
(5, 3,    '200003', 'Budi Santoso',   'STUDENT', '$2a$10$BQFWjx60eTDeUAyZoIFvoeTq.djajCKH1Jf/UHabE5gGfW23le3LW', 1, 0),
(6, 4,    '200004', 'Dewi Lestari',   'STUDENT', '$2a$10$BQFWjx60eTDeUAyZoIFvoeTq.djajCKH1Jf/UHabE5gGfW23le3LW', 1, 0);

-- 2d. Contoh izin dalam 4 status yang berbeda, supaya antrian tidak kosong
--     saat pertama kali login (satu per status utama: menunggu keluar,
--     sedang di luar, menunggu masuk, selesai).
INSERT INTO permits (id, resident_id, permit_code, qr_token, destination, permit_type, planned_departure_at, planned_return_at, entry_code, status, created_at) VALUES
(1, 1, 'SKT-DEM01', 'a1111111-1111-4111-8111-111111111111', 'Pulang ke rumah orang tua',      'IZIN_PRIBADI',       '2026-08-19 08:00:00', '2026-08-19 08:00:00', NULL,        'MENUNGGU_KELUAR', NOW()),
(2, 2, 'SKT-DEM02', 'a2222222-2222-4222-8222-222222222222', 'Bimbingan skripsi di kampus',    'IZIN_AKADEMIK',      '2026-08-19 07:30:00', '2026-08-19 07:30:00', NULL,        'SEDANG_DI_LUAR',  NOW()),
(3, 3, 'SKT-DEM03', 'a3333333-3333-4333-8333-333333333333', 'Berobat ke klinik kampus',       'IZIN_KESEHATAN',     '2026-08-18 09:00:00', '2026-08-18 12:00:00', 'SKM-DEM03', 'MENUNGGU_MASUK',  NOW()),
(4, 4, 'SKT-DEM04', 'a4444444-4444-4444-8444-444444444444', 'Menghadiri acara keluarga',      'KEPERLUAN_KELUARGA', '2026-08-17 10:00:00', '2026-08-17 18:00:00', 'SKM-DEM04', 'SELESAI',         NOW());

-- 2e. Jejak proses (permit_events) untuk masing-masing izin di atas, supaya
--     halaman Riwayat (Satpam & Pengelola) juga tidak kosong.
INSERT INTO permit_events (permit_id, event_type, performed_by_account_id, occurred_at) VALUES
-- Permit #1 (Ahmad) — baru mengajukan, masih menunggu satpam.
(1, 'EXIT_REQUESTED', 3, NOW()),
-- Permit #2 (Siti) — sudah disetujui keluar, sekarang di luar RTB.
(2, 'EXIT_REQUESTED', 4, NOW()),
(2, 'EXIT',            2, NOW()),
-- Permit #3 (Budi) — sudah kembali & lapor, menunggu konfirmasi satpam.
(3, 'EXIT_REQUESTED',  5, NOW()),
(3, 'EXIT',             2, NOW()),
(3, 'ENTRY_REQUESTED',  5, NOW()),
-- Permit #4 (Dewi) — siklus penuh, sudah selesai.
(4, 'EXIT_REQUESTED',  6, NOW()),
(4, 'EXIT',             2, NOW()),
(4, 'ENTRY_REQUESTED',  6, NOW()),
(4, 'ENTRY',            2, NOW());

-- Selesai. Silakan login di login.php dengan salah satu akun demo (lihat README.md).
