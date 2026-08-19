<?php
/**
 * login.php
 * ------------------------------------------------------------------
 * Form login dengan ID BCA + password (bukan email/username, mengikuti
 * aplikasi aslinya). Password diverifikasi dengan password_verify()
 * terhadap hash bcrypt yang tersimpan di kolom accounts.password_hash.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/includes/auth.php';

$user = currentUser();
if ($user) {
    redirectTo(roleDashboardPath($user['role']));
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $bcaId    = trim($_POST['bca_id'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    if ($bcaId === '' || $password === '') {
        $error = 'ID BCA dan password wajib diisi.';
    } else {
        $loggedInUser = attemptLogin($bcaId, $password);
        if ($loggedInUser) {
            redirectTo(roleDashboardPath($loggedInUser['role']));
        }
        $error = 'ID BCA atau password salah, atau akun tidak aktif.';
    }
}

$pageTitle = null;
require __DIR__ . '/includes/layout_start.php';
?>
<div class="login-wrap">
    <div class="login-card">
        <h1 class="login-title">Masuk ke SIKAT RTB</h1>
        <p class="login-subtitle">Demo PHP &mdash; Sistem Izin Keluar Masuk RTB</p>

        <?php if ($error): ?>
            <div class="flash flash-error"><?= h($error) ?></div>
        <?php endif; ?>

        <form method="post" action="login.php" class="form">
            <label for="bca_id">ID BCA</label>
            <input type="text" id="bca_id" name="bca_id" inputmode="numeric" autocomplete="username"
                   value="<?= h($_POST['bca_id'] ?? '') ?>" required autofocus>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" autocomplete="current-password" required>

            <button type="submit" class="btn btn-primary btn-block">Masuk</button>
        </form>

        <div class="login-hint">
            <p><strong>Akun demo</strong> (password sama untuk semua: <code>demo123</code>)</p>
            <table class="hint-table">
                <tr><td>Pengelola</td><td><code>100001</code></td></tr>
                <tr><td>Satpam</td><td><code>90001</code></td></tr>
                <tr><td>Mahasiswa</td><td><code>200001</code></td></tr>
            </table>
        </div>
    </div>
</div>
<?php require __DIR__ . '/includes/layout_end.php'; ?>
