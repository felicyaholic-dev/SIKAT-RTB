<?php
/**
 * logout.php
 * ------------------------------------------------------------------
 * Menghapus sesi login lalu kembali ke halaman login.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/includes/auth.php';

logoutUser();
redirectTo('login.php');
