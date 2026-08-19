<?php
/**
 * security/dashboard.php
 * ------------------------------------------------------------------
 * Halaman kerja satpam sehari-hari:
 *  - Form validasi: satpam mengetik kode izin (SKT-xxxxx, saat mahasiswa
 *    mau keluar) atau kode masuk (SKM-xxxxx, saat mahasiswa kembali).
 *    Sistem mencari izin yang cocok lalu menampilkan detail + tombol
 *    aksi (setujui/tolak untuk keluar, konfirmasi untuk masuk).
 *  - Daftar pantauan: siapa saja yang sedang di luar RTB saat ini.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = requireRole('SECURITY');
$db   = getDb();

$error = '';
$found = null; // permit row currently looked up, joined with resident info

// Langkah 1: cari izin berdasarkan kode yang diketik satpam.
function findPermitByCode(PDO $db, string $code): ?array
{
    $code = strtoupper(trim($code));
    $stmt = $db->prepare("
        SELECT p.*, r.full_name, r.room_number, r.class_name
        FROM permits p
        JOIN master_residents r ON r.id = p.resident_id
        WHERE (p.status = 'MENUNGGU_KELUAR' AND p.permit_code = ?)
           OR (p.status = 'MENUNGGU_MASUK' AND p.entry_code = ?)
        LIMIT 1
    ");
    $stmt->execute([$code, $code]);
    $row = $stmt->fetch();
    return $row ?: null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'lookup') {
    $code = trim($_POST['code'] ?? '');
    if ($code === '') {
        $error = 'Masukkan kode izin atau kode masuk terlebih dahulu.';
    } else {
        $found = findPermitByCode($db, $code);
        if (!$found) {
            $error = 'Kode tidak ditemukan atau sudah tidak berlaku. Pastikan kode benar dan belum divalidasi sebelumnya.';
        }
    }
}

// Langkah 2: proses keputusan (setuju/tolak keluar, atau konfirmasi masuk).
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && in_array($_POST['action'], ['approve_exit', 'reject_exit', 'confirm_entry'], true)) {
    $permitId = (int) ($_POST['permit_id'] ?? 0);
    $stmt = $db->prepare('SELECT * FROM permits WHERE id = ?');
    $stmt->execute([$permitId]);
    $permit = $stmt->fetch();

    if (!$permit) {
        setFlash('error', 'Izin tidak ditemukan.');
    } else {
        $action = $_POST['action'];
        $ok = false;
        $message = '';

        if ($action === 'approve_exit' && $permit['status'] === 'MENUNGGU_KELUAR') {
            $update = $db->prepare("UPDATE permits SET status = 'SEDANG_DI_LUAR' WHERE id = ? AND status = 'MENUNGGU_KELUAR'");
            $update->execute([$permitId]);
            if ($update->rowCount() === 1) {
                $db->prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'EXIT', ?)")->execute([$permitId, $user['id']]);
                $ok = true;
                $message = 'Izin keluar disetujui. Mahasiswa kini berstatus Sedang di Luar.';
            }
        } elseif ($action === 'reject_exit' && $permit['status'] === 'MENUNGGU_KELUAR') {
            $update = $db->prepare("UPDATE permits SET status = 'DIBATALKAN' WHERE id = ? AND status = 'MENUNGGU_KELUAR'");
            $update->execute([$permitId]);
            if ($update->rowCount() === 1) {
                $db->prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'EXIT_REJECTED', ?)")->execute([$permitId, $user['id']]);
                $ok = true;
                $message = 'Izin keluar ditolak. Mahasiswa tetap berstatus di dalam RTB.';
            }
        } elseif ($action === 'confirm_entry' && $permit['status'] === 'MENUNGGU_MASUK') {
            $update = $db->prepare("UPDATE permits SET status = 'SELESAI' WHERE id = ? AND status = 'MENUNGGU_MASUK'");
            $update->execute([$permitId]);
            if ($update->rowCount() === 1) {
                $db->prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'ENTRY', ?)")->execute([$permitId, $user['id']]);
                $ok = true;
                $message = 'Masuk dikonfirmasi. Mahasiswa kini tercatat kembali di RTB.';
            }
        }

        if (!$ok && $message === '') {
            $message = 'Status izin sudah berubah (mungkin sudah diproses satpam lain). Silakan cari ulang kodenya.';
        }
        setFlash($ok ? 'success' : 'error', $message);
    }
    redirectTo('dashboard.php');
}

// Daftar pantauan: siapa yang sedang di luar / menunggu masuk saat ini.
$watchlist = $db->query("
    SELECT p.*, r.full_name, r.room_number
    FROM permits p JOIN master_residents r ON r.id = p.resident_id
    WHERE p.status IN ('SEDANG_DI_LUAR','MENUNGGU_MASUK')
    ORDER BY p.planned_departure_at ASC
")->fetchAll();

$pageTitle = 'Validasi Keluar / Masuk';
require __DIR__ . '/../includes/layout_start.php';
?>

<section class="card card-narrow">
    <h2 class="card-title">Cari Kode</h2>
    <p class="muted">Masukkan kode izin (SKT-xxxxx) saat mahasiswa hendak keluar, atau kode masuk (SKM-xxxxx) saat mahasiswa kembali.</p>
    <?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
    <form method="post" action="dashboard.php" class="form form-inline">
        <input type="hidden" name="action" value="lookup">
        <input type="text" name="code" placeholder="Contoh: SKT-A1B2C" required autofocus
               value="<?= h($_POST['code'] ?? '') ?>" style="text-transform:uppercase">
        <button type="submit" class="btn btn-primary">Cari</button>
    </form>
</section>

<?php if ($found): ?>
<section class="card card-narrow">
    <h2 class="card-title">Detail Izin Ditemukan</h2>
    <table class="detail-table">
        <tr><th>Nama</th><td><?= h($found['full_name']) ?></td></tr>
        <tr><th>Kamar</th><td><?= h($found['room_number']) ?></td></tr>
        <tr><th>Kelas</th><td><?= h($found['class_name']) ?></td></tr>
        <tr><th>Tujuan</th><td><?= h($found['destination']) ?></td></tr>
        <tr><th>Jenis Izin</th><td><?= h(permitTypeLabel($found['permit_type'])) ?></td></tr>
        <tr><th>Status</th><td><span class="<?= h(permitStatusBadgeClass($found['status'])) ?>"><?= h(permitStatusLabel($found['status'])) ?></span></td></tr>
        <?php if ($found['status'] === 'MENUNGGU_KELUAR'): ?>
        <tr><th>Kode Izin</th><td><code><?= h($found['permit_code']) ?></code></td></tr>
        <?php else: ?>
        <tr><th>Kode Masuk</th><td><code><?= h($found['entry_code']) ?></code></td></tr>
        <?php endif; ?>
    </table>

    <?php if ($found['status'] === 'MENUNGGU_KELUAR'): ?>
        <div class="btn-row">
            <form method="post" action="dashboard.php" onsubmit="return confirm('Setujui izin keluar ini?');">
                <input type="hidden" name="action" value="approve_exit">
                <input type="hidden" name="permit_id" value="<?= (int) $found['id'] ?>">
                <button type="submit" class="btn btn-success">Setujui Keluar</button>
            </form>
            <form method="post" action="dashboard.php" onsubmit="return confirm('Tolak izin keluar ini?');">
                <input type="hidden" name="action" value="reject_exit">
                <input type="hidden" name="permit_id" value="<?= (int) $found['id'] ?>">
                <button type="submit" class="btn btn-danger">Tolak</button>
            </form>
        </div>
    <?php elseif ($found['status'] === 'MENUNGGU_MASUK'): ?>
        <div class="btn-row">
            <form method="post" action="dashboard.php" onsubmit="return confirm('Konfirmasi mahasiswa sudah masuk RTB?');">
                <input type="hidden" name="action" value="confirm_entry">
                <input type="hidden" name="permit_id" value="<?= (int) $found['id'] ?>">
                <button type="submit" class="btn btn-success">Konfirmasi Masuk</button>
            </form>
        </div>
    <?php endif; ?>
</section>
<?php endif; ?>

<section class="card">
    <h2 class="card-title">Sedang di Luar RTB (<?= count($watchlist) ?>)</h2>
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
