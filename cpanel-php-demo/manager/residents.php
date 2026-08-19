<?php
/**
 * manager/residents.php
 * ------------------------------------------------------------------
 * Daftar seluruh data induk penghuni (master_residents), read-only.
 * Menunjukkan juga apakah akun login mahasiswanya sudah aktif.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = requireRole('MANAGER');
$db   = getDb();

$residents = $db->query("
    SELECT r.*, CASE WHEN a.id IS NULL THEN 'Belum Ada Akun' ELSE 'Aktif' END AS account_status
    FROM master_residents r LEFT JOIN accounts a ON a.resident_id = r.id
    ORDER BY r.room_number ASC, r.full_name ASC
")->fetchAll();

$pageTitle = 'Data Penghuni';
require __DIR__ . '/../includes/layout_start.php';
?>

<section class="card">
    <p class="muted">Total <?= count($residents) ?> penghuni terdaftar. Halaman ini hanya untuk melihat data (read-only) pada demo ini.</p>
    <div class="table-wrap">
    <table class="data-table">
        <thead>
        <tr>
            <th>ID BCA</th>
            <th>Nama Lengkap</th>
            <th>Kamar</th>
            <th>Kelas</th>
            <th>Gender</th>
            <th>No. HP/WA</th>
            <th>Email</th>
            <th>Status Penghuni</th>
            <th>Status Akun</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($residents as $r): ?>
            <tr>
                <td><?= h($r['bca_id']) ?></td>
                <td><?= h($r['full_name']) ?></td>
                <td><?= h($r['room_number']) ?></td>
                <td><?= h($r['class_name']) ?></td>
                <td><?= h($r['gender']) ?></td>
                <td><?= h($r['phone_number'] ?: '-') ?></td>
                <td><?= h($r['email'] ?: '-') ?></td>
                <td><?= h($r['resident_status']) ?></td>
                <td><?= h($r['account_status']) ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
</section>

<?php require __DIR__ . '/../includes/layout_end.php'; ?>
