<?php
/**
 * security/history.php
 * ------------------------------------------------------------------
 * Riwayat validasi keluar/masuk dari SEMUA satpam (bukan hanya yang
 * sedang login), supaya setiap petugas bisa melihat aktivitas satu
 * sama lain. Dipakai juga oleh manager/history.php lewat query yang
 * sama persis.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/history_query.php';

$user = requireRole('SECURITY');
$rows = getPermitHistory(getDb());

$pageTitle = 'Riwayat Validasi';
require __DIR__ . '/../includes/layout_start.php';
require __DIR__ . '/../includes/history_table.php';
require __DIR__ . '/../includes/layout_end.php';
