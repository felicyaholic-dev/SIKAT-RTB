<?php
/**
 * includes/layout_start.php
 * ------------------------------------------------------------------
 * Header HTML + navigasi yang dipakai bersama di semua halaman setelah
 * login. Sebelum include file ini, set variabel $pageTitle (judul yang
 * tampil di tab browser & atas halaman).
 *
 * Wajib require_once includes/auth.php dulu sebelum file ini, supaya
 * fungsi currentUser()/appBase() sudah tersedia.
 * ------------------------------------------------------------------
 */

$user  = currentUser();
$base  = appBase();
$title = isset($pageTitle) ? $pageTitle . ' — SIKAT RTB Demo' : 'SIKAT RTB Demo';
$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= h($title) ?></title>
<link rel="stylesheet" href="<?= h($base) ?>assets/style.css">
</head>
<body>
<header class="topbar">
    <div class="topbar-inner">
        <a class="brand" href="<?= h($base . ($user ? roleDashboardPath($user['role']) : 'login.php')) ?>">
            SIKAT RTB <span class="brand-tag">Demo PHP</span>
        </a>
        <?php if ($user): ?>
        <nav class="nav">
            <?php if ($user['role'] === 'STUDENT'): ?>
                <a href="<?= h($base) ?>student/dashboard.php">Dashboard</a>
                <a href="<?= h($base) ?>student/apply.php">Izin Keluar</a>
                <a href="<?= h($base) ?>student/history.php">Riwayat</a>
            <?php elseif ($user['role'] === 'SECURITY'): ?>
                <a href="<?= h($base) ?>security/dashboard.php">Validasi</a>
                <a href="<?= h($base) ?>security/history.php">Riwayat</a>
            <?php elseif ($user['role'] === 'MANAGER'): ?>
                <a href="<?= h($base) ?>manager/dashboard.php">Dashboard</a>
                <a href="<?= h($base) ?>manager/residents.php">Penghuni</a>
                <a href="<?= h($base) ?>manager/history.php">Riwayat</a>
            <?php endif; ?>
        </nav>
        <div class="user-box">
            <span class="user-name"><?= h($user['full_name']) ?></span>
            <span class="user-role"><?= h(roleLabel($user['role'])) ?></span>
            <a class="logout-link" href="<?= h($base) ?>logout.php">Keluar</a>
        </div>
        <?php endif; ?>
    </div>
</header>
<main class="page">
    <?php if (isset($pageTitle)): ?>
        <h1 class="page-title"><?= h($pageTitle) ?></h1>
    <?php endif; ?>
    <?php if ($flash): ?>
        <div class="flash flash-<?= h($flash['type']) ?>"><?= h($flash['message']) ?></div>
    <?php endif; ?>
