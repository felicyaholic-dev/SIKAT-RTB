<?php
/**
 * index.php
 * ------------------------------------------------------------------
 * Halaman pintu masuk. Kalau sudah login, langsung diarahkan ke
 * dashboard sesuai role. Kalau belum, diarahkan ke halaman login.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/includes/auth.php';

$user = currentUser();
if ($user) {
    redirectTo(roleDashboardPath($user['role']));
}
redirectTo('login.php');
