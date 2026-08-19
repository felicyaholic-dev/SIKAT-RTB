<?php
/**
 * includes/history_table.php
 * ------------------------------------------------------------------
 * Tabel HTML riwayat, dipakai oleh security/history.php dan
 * manager/history.php. Membutuhkan variabel $rows (hasil dari
 * getPermitHistory()) sudah tersedia sebelum file ini di-include.
 * ------------------------------------------------------------------
 */
?>
<section class="card">
<?php if (empty($rows)): ?>
    <p class="muted">Belum ada riwayat validasi keluar/masuk.</p>
<?php else: ?>
    <div class="table-wrap">
    <table class="data-table">
        <thead>
        <tr>
            <th>Waktu</th>
            <th>Aksi</th>
            <th>Nama</th>
            <th>Kamar</th>
            <th>Kelas</th>
            <th>Kode</th>
            <th>Tujuan</th>
            <th>Status Izin</th>
            <th>Divalidasi Oleh</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($rows as $row): ?>
            <tr>
                <td><?= h(formatDateTime($row['occurred_at'])) ?></td>
                <td><?= h(eventTypeLabel($row['event_type'])) ?></td>
                <td><?= h($row['full_name']) ?></td>
                <td><?= h($row['room_number']) ?></td>
                <td><?= h($row['class_name']) ?></td>
                <td><code><?= h($row['event_type'] === 'ENTRY' ? ($row['entry_code'] ?: $row['permit_code']) : $row['permit_code']) ?></code></td>
                <td><?= h($row['destination']) ?></td>
                <td><span class="<?= h(permitStatusBadgeClass($row['status'])) ?>"><?= h(permitStatusLabel($row['status'])) ?></span></td>
                <td><?= h($row['performed_by_name'] ?: '-') ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
<?php endif; ?>
</section>
