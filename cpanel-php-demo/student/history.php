<?php
/**
 * student/history.php
 * ------------------------------------------------------------------
 * Daftar seluruh izin milik mahasiswa yang sedang login, dari yang
 * terbaru, lengkap dengan statusnya masing-masing.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = requireRole('STUDENT');
$db   = getDb();

$stmt = $db->prepare('SELECT r.id FROM master_residents r JOIN accounts a ON a.resident_id = r.id WHERE a.id = ?');
$stmt->execute([$user['id']]);
$resident = $stmt->fetch();

$permits = [];
if ($resident) {
    $stmt = $db->prepare('SELECT * FROM permits WHERE resident_id = ? ORDER BY created_at DESC');
    $stmt->execute([$resident['id']]);
    $permits = $stmt->fetchAll();
}

$pageTitle = 'Riwayat Izin Saya';
require __DIR__ . '/../includes/layout_start.php';
?>

<section class="card">
<?php if (!$permits): ?>
    <p class="muted">Belum ada riwayat izin.</p>
<?php else: ?>
    <div class="table-wrap">
    <table class="data-table">
        <thead>
        <tr>
            <th>Kode Izin</th>
            <th>Kode Masuk</th>
            <th>Tujuan</th>
            <th>Jenis</th>
            <th>Berangkat</th>
            <th>Kembali</th>
            <th>Status</th>
            <th>Diajukan</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($permits as $permit): ?>
            <tr>
                <td><code><?= h($permit['permit_code']) ?></code></td>
                <td><?= $permit['entry_code'] ? '<code>' . h($permit['entry_code']) . '</code>' : '-' ?></td>
                <td><?= h($permit['destination']) ?></td>
                <td><?= h(permitTypeLabel($permit['permit_type'])) ?></td>
                <td><?= h(formatDateTime($permit['planned_departure_at'])) ?></td>
                <td><?= h(formatDateTime($permit['planned_return_at'])) ?></td>
                <td><span class="<?= h(permitStatusBadgeClass($permit['status'])) ?>"><?= h(permitStatusLabel($permit['status'])) ?></span></td>
                <td><?= h(formatDateTime($permit['created_at'])) ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
<?php endif; ?>
</section>

<?php require __DIR__ . '/../includes/layout_end.php'; ?>
