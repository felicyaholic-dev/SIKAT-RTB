<?php
/**
 * includes/history_query.php
 * ------------------------------------------------------------------
 * Query riwayat keluar-masuk yang dipakai bersama oleh halaman
 * "Riwayat" milik Satpam dan Pengelola, supaya keduanya menampilkan
 * data yang identik (siapa memvalidasi apa, dan kapan).
 * ------------------------------------------------------------------
 */

function getPermitHistory(PDO $db, int $limit = 300): array
{
    $stmt = $db->prepare("
        SELECT e.id AS event_id, e.event_type, e.occurred_at,
            p.permit_code, p.entry_code, p.destination, p.status,
            r.full_name, r.room_number, r.class_name,
            a.full_name AS performed_by_name
        FROM permit_events e
        JOIN permits p ON p.id = e.permit_id
        JOIN master_residents r ON r.id = p.resident_id
        LEFT JOIN accounts a ON a.id = e.performed_by_account_id
        WHERE e.event_type IN ('EXIT', 'ENTRY', 'EXIT_REJECTED')
        ORDER BY e.occurred_at DESC, e.id DESC
        LIMIT " . (int) $limit . "
    ");
    $stmt->execute();
    return $stmt->fetchAll();
}
