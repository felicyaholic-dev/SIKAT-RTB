<?php
/**
 * includes/auth.php
 * ------------------------------------------------------------------
 * Semua urusan sesi login: memverifikasi ID BCA + password, menyimpan
 * data user yang sedang login ke $_SESSION, dan fungsi bantu untuk
 * membatasi akses halaman berdasarkan role (STUDENT/SECURITY/MANAGER).
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Mengembalikan '../' jika file yang memanggil berada di dalam folder
// student/security/manager, atau '' jika berada di folder utama.
// Dipakai supaya tautan navigasi & redirect tetap benar dari folder mana pun.
function appBase(): string
{
    $dir = basename(dirname($_SERVER['SCRIPT_NAME']));
    return in_array($dir, ['student', 'security', 'manager'], true) ? '../' : '';
}

// Mencoba login dengan ID BCA + password polos. Mengembalikan array data
// user jika berhasil, atau null jika ID BCA/password salah atau akun nonaktif.
function attemptLogin(string $bcaId, string $password): ?array
{
    $bcaId = strtoupper(trim($bcaId));
    $stmt = getDb()->prepare('SELECT * FROM accounts WHERE bca_id = ? LIMIT 1');
    $stmt->execute([$bcaId]);
    $account = $stmt->fetch();

    if (!$account || !(int) $account['is_active']) {
        return null;
    }
    if (!password_verify($password, $account['password_hash'])) {
        return null;
    }

    $user = [
        'id'          => (int) $account['id'],
        'bca_id'      => $account['bca_id'],
        'full_name'   => $account['full_name'],
        'role'        => $account['role'],
        'resident_id' => $account['resident_id'] !== null ? (int) $account['resident_id'] : null,
    ];

    $_SESSION['user'] = $user;
    return $user;
}

function currentUser(): ?array
{
    return $_SESSION['user'] ?? null;
}

function logoutUser(): void
{
    $_SESSION = [];
    session_destroy();
}

// Dipanggil di baris paling atas setiap halaman yang butuh login.
// Jika role tidak cocok, user diarahkan kembali ke dashboard role-nya sendiri.
function requireRole(string $role): array
{
    $user = currentUser();
    if (!$user) {
        redirectTo(appBase() . 'login.php');
    }
    if ($user['role'] !== $role) {
        redirectTo(appBase() . roleDashboardPath($user['role']));
    }
    return $user;
}

function roleDashboardPath(string $role): string
{
    switch ($role) {
        case 'STUDENT':
            return 'student/dashboard.php';
        case 'SECURITY':
            return 'security/dashboard.php';
        case 'MANAGER':
            return 'manager/dashboard.php';
        default:
            return 'login.php';
    }
}

function roleLabel(string $role): string
{
    $labels = [
        'STUDENT'  => 'Mahasiswa',
        'SECURITY' => 'Satpam',
        'MANAGER'  => 'Pengelola',
    ];
    return $labels[$role] ?? $role;
}
