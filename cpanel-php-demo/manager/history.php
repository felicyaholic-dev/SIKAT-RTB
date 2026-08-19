<?php
/**
 * manager/history.php
 * ------------------------------------------------------------------
 * Sama persis dengan security/history.php (satu sumber data), supaya
 * Pengelola melihat aktivitas keluar-masuk yang sama dengan Satpam.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/history_query.php';

$user = requireRole('MANAGER');
$rows = getPermitHistory(getDb());

$pageTitle = 'Riwayat Validasi';
require __DIR__ . '/../includes/layout_start.php';
require __DIR__ . '/../includes/history_table.php';
require __DIR__ . '/../includes/layout_end.php';
