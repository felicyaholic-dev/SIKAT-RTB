<?php
/**
 * student/dashboard.php
 * ------------------------------------------------------------------
 * Halaman utama mahasiswa: data diri (kamar/kelas/HP/email) dan status
 * izin yang sedang berjalan (kalau ada), plus tombol ke halaman
 * pengajuan izin.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = requireRole('STUDENT');
$db   = getDb();

$stmt = $db->prepare('SELECT r.* FROM master_residents r JOIN accounts a ON a.resident_id = r.id WHERE a.id = ?');
$stmt->execute([$user['id']]);
$resident = $stmt->fetch();

if (!$resident) {
    $pageTitle = 'Dashboard Mahasiswa';
    require __DIR__ . '/../includes/layout_start.php';
    echo '<div class="flash flash-error">Data penghuni untuk akun ini tidak ditemukan. Hubungi Pengelola RTB.</div>';
    require __DIR__ . '/../includes/layout_end.php';
    exit;
}

$stmt = $db->prepare("
    SELECT * FROM permits
    WHERE resident_id = ? AND status IN ('MENUNGGU_KELUAR','SEDANG_DI_LUAR','MENUNGGU_MASUK')
    ORDER BY created_at DESC LIMIT 1
");
$stmt->execute([$resident['id']]);
$activePermit = $stmt->fetch();

$pageTitle = 'Dashboard Mahasiswa';
require __DIR__ . '/../includes/layout_start.php';
?>

<div class="grid-2">
    <section class="card">
        <h2 class="card-title">Profil Saya</h2>
        <table class="detail-table">
            <tr><th>ID BCA</th><td><?= h($resident['bca_id']) ?></td></tr>
            <tr><th>Nama Lengkap</th><td><?= h($resident['full_name']) ?></td></tr>
            <tr><th>Kamar</th><td><?= h($resident['room_number']) ?></td></tr>
            <tr><th>Kelas</th><td><?= h($resident['class_name']) ?></td></tr>
            <tr><th>No. HP/WA</th><td><?= h($resident['phone_number'] ?: '-') ?></td></tr>
            <tr><th>Email</th><td><?= h($resident['email'] ?: '-') ?></td></tr>
            <tr><th>Status</th><td><?= h($resident['resident_status']) ?></td></tr>
        </table>
    </section>

    <section class="card">
        <h2 class="card-title">Status Izin Saat Ini</h2>
        <?php if (!$activePermit): ?>
            <p class="muted">Anda tidak sedang memiliki izin keluar yang aktif.</p>
            <a class="btn btn-primary" href="apply.php">Ajukan Izin Keluar</a>
        <?php else: ?>
            <table class="detail-table">
                <tr><th>Status</th><td><span class="<?= h(permitStatusBadgeClass($activePermit['status'])) ?>"><?= h(permitStatusLabel($activePermit['status'])) ?></span></td></tr>
                <tr><th>Kode Izin</th><td><code><?= h($activePermit['permit_code']) ?></code></td></tr>
                <?php if ($activePermit['entry_code']): ?>
                <tr><th>Kode Masuk</th><td><code><?= h($activePermit['entry_code']) ?></code></td></tr>
                <?php endif; ?>
                <tr><th>Tujuan</th><td><?= h($activePermit['destination']) ?></td></tr>
                <tr><th>Jenis Izin</th><td><?= h(permitTypeLabel($activePermit['permit_type'])) ?></td></tr>
                <tr><th>Rencana Berangkat</th><td><?= h(formatDateTime($activePermit['planned_departure_at'])) ?></td></tr>
                <tr><th>Rencana Kembali</th><td><?= h(formatDateTime($activePermit['planned_return_at'])) ?></td></tr>
            </table>

            <?php if ($activePermit['status'] === 'MENUNGGU_KELUAR'): ?>
                <p class="muted">Tunjukkan kode izin ini ke satpam untuk divalidasi sebelum keluar RTB.</p>
            <?php elseif ($activePermit['status'] === 'SEDANG_DI_LUAR'): ?>
                <p class="muted">Anda tercatat sedang di luar RTB.</p>
                <a class="btn btn-primary" href="apply.php">Lapor Sudah Kembali</a>
            <?php elseif ($activePermit['status'] === 'MENUNGGU_MASUK'): ?>
                <p class="muted">Tunjukkan kode masuk ini ke satpam untuk dikonfirmasi saat tiba di RTB.</p>
            <?php endif; ?>
        <?php endif; ?>
    </section>
</div>

<?php require __DIR__ . '/../includes/layout_end.php'; ?>
