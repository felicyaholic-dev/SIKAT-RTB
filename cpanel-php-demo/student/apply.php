<?php
/**
 * student/apply.php
 * ------------------------------------------------------------------
 * Dua mode di satu halaman, tergantung status izin aktif mahasiswa:
 *
 *  1) Tidak ada izin aktif -> form "Ajukan Izin Keluar". Setelah submit,
 *     dibuat baris permits baru berstatus MENUNGGU_KELUAR + kode izin
 *     (format SKT-XXXXX) yang harus ditunjukkan ke satpam.
 *
 *  2) Status aktif SEDANG_DI_LUAR -> form "Lapor Sudah Kembali". Setelah
 *     submit, permit yang sama diberi kode masuk (format SKM-XXXXX) dan
 *     statusnya berubah jadi MENUNGGU_MASUK.
 *
 *  Kalau status aktif MENUNGGU_KELUAR/MENUNGGU_MASUK, mahasiswa belum
 *  bisa mengajukan apa pun sampai satpam memvalidasi kode yang berjalan.
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
    redirectTo('dashboard.php');
}

$stmt = $db->prepare("
    SELECT * FROM permits
    WHERE resident_id = ? AND status IN ('MENUNGGU_KELUAR','SEDANG_DI_LUAR','MENUNGGU_MASUK')
    ORDER BY created_at DESC LIMIT 1
");
$stmt->execute([$resident['id']]);
$activePermit = $stmt->fetch();

$permitTypes = ['IZIN_PRIBADI', 'IZIN_AKADEMIK', 'IZIN_KESEHATAN', 'KEPERLUAN_KELUARGA', 'LAINNYA'];

$error = '';
$successCode = null;
$successMode = null; // 'EXIT' or 'ENTRY'

$mode = 'NEW';
if ($activePermit) {
    $mode = $activePermit['status'] === 'SEDANG_DI_LUAR' ? 'RETURN' : 'BLOCKED';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $mode === 'NEW') {
    $destination = trim($_POST['destination'] ?? '');
    $permitType  = $_POST['permit_type'] ?? 'IZIN_PRIBADI';
    $departure   = trim($_POST['departure'] ?? '');

    if ($destination === '' || $departure === '' || !in_array($permitType, $permitTypes, true)) {
        $error = 'Lengkapi tujuan, jenis izin, dan waktu keluar.';
    } else {
        $departureSql = str_replace('T', ' ', $departure) . ':00';
        $permitCode = generateCode('SKT');
        $qrToken    = generateQrToken();

        $insert = $db->prepare("
            INSERT INTO permits (resident_id, permit_code, qr_token, destination, permit_type, planned_departure_at, planned_return_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'MENUNGGU_KELUAR')
        ");
        $insert->execute([$resident['id'], $permitCode, $qrToken, $destination, $permitType, $departureSql, $departureSql]);
        $permitId = (int) $db->lastInsertId();

        $db->prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'EXIT_REQUESTED', ?)")
            ->execute([$permitId, $user['id']]);

        $successCode = $permitCode;
        $successMode = 'EXIT';
        $mode = 'DONE';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $mode === 'RETURN') {
    $returnAt = trim($_POST['return_at'] ?? '');

    if ($returnAt === '') {
        $error = 'Masukkan waktu kembali ke RTB.';
    } else {
        $returnSql = str_replace('T', ' ', $returnAt) . ':00';
        $entryCode = generateCode('SKM');

        $update = $db->prepare("UPDATE permits SET entry_code = ?, planned_return_at = ?, status = 'MENUNGGU_MASUK' WHERE id = ?");
        $update->execute([$entryCode, $returnSql, $activePermit['id']]);

        $db->prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'ENTRY_REQUESTED', ?)")
            ->execute([$activePermit['id'], $user['id']]);

        $successCode = $entryCode;
        $successMode = 'ENTRY';
        $mode = 'DONE';
    }
}

$pageTitle = 'Izin Keluar';
require __DIR__ . '/../includes/layout_start.php';
?>

<div class="card card-narrow">

<?php if ($mode === 'DONE'): ?>
    <?php if ($successMode === 'EXIT'): ?>
        <h2 class="card-title">Pengajuan Berhasil</h2>
        <p>Izin keluar Anda sudah tercatat dengan status <strong>Menunggu Keluar</strong>. Tunjukkan kode berikut ke satpam untuk divalidasi:</p>
    <?php else: ?>
        <h2 class="card-title">Laporan Kembali Berhasil</h2>
        <p>Status Anda sekarang <strong>Menunggu Masuk</strong>. Tunjukkan kode berikut ke satpam saat tiba di RTB:</p>
    <?php endif; ?>
    <div class="code-box"><?= h($successCode) ?></div>
    <a class="btn btn-primary" href="dashboard.php">Kembali ke Dashboard</a>

<?php elseif ($mode === 'BLOCKED'): ?>
    <h2 class="card-title">Belum Bisa Mengajukan</h2>
    <p class="muted">
        Anda masih memiliki izin dengan status
        <span class="<?= h(permitStatusBadgeClass($activePermit['status'])) ?>"><?= h(permitStatusLabel($activePermit['status'])) ?></span>.
        Tunjukkan kode <code><?= h($activePermit['status'] === 'MENUNGGU_MASUK' ? $activePermit['entry_code'] : $activePermit['permit_code']) ?></code> ke satpam terlebih dahulu.
    </p>
    <a class="btn" href="dashboard.php">Kembali ke Dashboard</a>

<?php elseif ($mode === 'RETURN'): ?>
    <h2 class="card-title">Lapor Sudah Kembali ke RTB</h2>
    <p class="muted">Izin <code><?= h($activePermit['permit_code']) ?></code> ke <?= h($activePermit['destination']) ?> sedang berjalan (status: Sedang di Luar).</p>
    <?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
    <form method="post" action="apply.php" class="form">
        <label for="return_at">Waktu Kembali</label>
        <input type="datetime-local" id="return_at" name="return_at" required
               value="<?= h(date('Y-m-d\TH:i')) ?>">
        <button type="submit" class="btn btn-primary btn-block">Buat Kode Masuk</button>
    </form>

<?php else: ?>
    <h2 class="card-title">Ajukan Izin Keluar</h2>
    <?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
    <form method="post" action="apply.php" class="form">
        <label for="destination">Tujuan</label>
        <input type="text" id="destination" name="destination" required placeholder="Contoh: Pulang ke rumah, kampus, dll"
               value="<?= h($_POST['destination'] ?? '') ?>">

        <label for="permit_type">Jenis Izin</label>
        <select id="permit_type" name="permit_type">
            <?php foreach ($permitTypes as $type): ?>
                <option value="<?= h($type) ?>" <?= ($_POST['permit_type'] ?? '') === $type ? 'selected' : '' ?>>
                    <?= h(permitTypeLabel($type)) ?>
                </option>
            <?php endforeach; ?>
        </select>

        <label for="departure">Waktu Berangkat</label>
        <input type="datetime-local" id="departure" name="departure" required
               value="<?= h(date('Y-m-d\TH:i')) ?>">

        <button type="submit" class="btn btn-primary btn-block">Ajukan Izin</button>
    </form>
<?php endif; ?>

</div>

<?php require __DIR__ . '/../includes/layout_end.php'; ?>
