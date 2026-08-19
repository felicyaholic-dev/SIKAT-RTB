<?php
/**
 * includes/db.php
 * ------------------------------------------------------------------
 * Membuka satu koneksi PDO ke MySQL yang dipakai bersama oleh semua
 * halaman. PDO dipilih (bukan mysqli) karena mendukung prepared
 * statement dengan sintaks yang rapi dan tersedia di semua hosting
 * PHP standar (ekstensi pdo_mysql).
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../config.php';

function getDb(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(
                '<h2>Gagal terhubung ke database</h2>' .
                '<p>Periksa pengaturan di <code>config.php</code> (host, nama database, user, password) ' .
                'dan pastikan database sudah diisi dengan <code>database.sql</code>.</p>' .
                '<p style="color:#888">Detail teknis: ' . htmlspecialchars($e->getMessage()) . '</p>'
            );
        }
    }

    return $pdo;
}
