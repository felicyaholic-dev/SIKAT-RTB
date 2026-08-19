<?php
/**
 * manager/dashboard.php
 * ------------------------------------------------------------------
 * Ringkasan angka untuk Pengelola: total penghuni aktif, jumlah yang
 * sedang di luar RTB saat ini, dan jumlah izin yang diajukan hari ini.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = requireRole('MANAGER');
$db   = getDb();

$residents = (int) $db->query("SELECT COUNT(*) FROM master_residents WHERE resident_status = 'ACTIVE'")->fetchColumn();
$outside   = (int) $db->query("SELECT COUNT(*) FROM permits WHERE status IN ('SEDANG_DI_LUAR','MENUNGGU_MASUK')")->fetchColumn();
$todayExit = (int) $db->query("
    SELECT COUNT(*) FROM permit_events
    WHERE event_type = 'EXIT' AND DATE(occurred_at) = CURDATE()
")->fetchColumn();
$todayEntry = (int) $db->query("
    SELECT COUNT(*) FROM permit_events
    WHERE event_type = 'ENTRY' AND DATE(occurred_at) = CURDATE()
")->fetchColumn();

$watchlist = $db->query("
    SELECT p.*, r.full_name, r.room_number
    FROM permits p JOIN master_residents r ON r.id = p.resident_id
    WHERE p.status IN ('SEDANG_DI_LUAR','MENUNGGU_MASUK')
    ORDER BY p.planned_departure_at ASC
    LIMIT 10
")->fetchAll();

$pageTitle = 'Dashboard Pengelola';
require __DIR__ . '/../includes/layout_start.php';
?>

<div class="stat-grid">
    <div class="stat-card">
        <span class="stat-number"><?= $residents ?></span>
        <span class="stat-label">Total Penghuni Aktif</span>
    </div>
    <div class="stat-card">
        <span class="stat-number"><?= $outside ?></span>
        <span class="stat-label">Sedang di Luar RTB</span>
    </div>
    <div class="stat-card">
        <span class="stat-number"><?= $todayExit ?></span>
        <span class="stat-label">Keluar Hari Ini</span>
    </div>
    <div class="stat-card">
        <span class="stat-number"><?= $todayEntry ?></span>
        <span class="stat-label">Masuk Hari Ini</span>
    </div>
</div>

<section class="card">
    <h2 class="card-title">Sedang di Luar RTB</h2>
    <?php if (!$watchlist): ?>
        <p class="muted">Tidak ada mahasiswa yang sedang di luar RTB saat ini.</p>
    <?php else: ?>
    <div class="table-wrap">
    <table class="data-table">
        <thead><tr><th>Nama</th><th>Kamar</th><th>Tujuan</th><th>Status</th><th>Rencana Berangkat</th></tr></thead>
        <tbody>
        <?php foreach ($watchlist as $item): ?>
            <tr>
                <td><?= h($item['full_name']) ?></td>
                <td><?= h($item['room_number']) ?></td>
                <td><?= h($item['destination']) ?></td>
                <td><span class="<?= h(permitStatusBadgeClass($item['status'])) ?>"><?= h(permitStatusLabel($item['status'])) ?></span></td>
                <td><?= h(formatDateTime($item['planned_departure_at'])) ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
    <?php endif; ?>
</section>

<?php require __DIR__ . '/../includes/layout_end.php'; ?>
