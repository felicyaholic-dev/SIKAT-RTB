<?php
/**
 * config.php
 * ------------------------------------------------------------------
 * Pengaturan koneksi database untuk demo SIKAT RTB versi PHP.
 *
 * Silakan sesuaikan 4 nilai di bawah ini dengan database MySQL yang
 * sudah Anda buat (misalnya lewat phpMyAdmin di XAMPP/Laragon/cPanel).
 *
 * DB_HOST  = alamat server MySQL. Untuk instalasi lokal biasanya "localhost".
 * DB_NAME  = nama database yang sudah Anda buat dan isi dengan database.sql.
 * DB_USER  = username MySQL. Default XAMPP/Laragon biasanya "root".
 * DB_PASS  = password MySQL. Default XAMPP/Laragon biasanya kosong "".
 *            Di cPanel, username & password dibuat sendiri lewat menu
 *            "MySQL Databases" dan biasanya berbentuk cpaneluser_dbuser.
 * ------------------------------------------------------------------
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'sikat_rtb_demo');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Zona waktu ditetapkan ke Asia/Jakarta (WIB) supaya semua tanggal/jam
// yang ditampilkan di layar konsisten dengan aplikasi aslinya.
date_default_timezone_set('Asia/Jakarta');
