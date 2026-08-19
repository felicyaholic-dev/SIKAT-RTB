# Struktur database SIKAT RTB

10 tabel. Isi `schema.sql` di folder ini tinggal copy-paste ke tab **SQL** di phpMyAdmin lalu klik **Go** untuk membuat semuanya sekaligus.

| Tabel | Fungsi |
| --- | --- |
| `master_residents` | Data induk penghuni (ID BCA, nama, kamar, kelas, gender, status, no. HP, email) |
| `accounts` | Akun login semua role (mahasiswa/satpam/pengelola), terhubung ke `master_residents` untuk role mahasiswa |
| `security_staff` | Data petugas satpam |
| `permits` | Pengajuan izin keluar-masuk (kode izin, QR token, tujuan, jadwal, status) |
| `permit_events` | Jejak setiap perubahan status pada satu izin (siapa yang memproses, kapan) |
| `audit_logs` | Log aktivitas umum di sistem |
| `login_attempts` | Percobaan login, untuk rate-limit brute force |
| `manager_bootstrap_links` | Penghubung akun pengelola awal saat sistem pertama kali di-setup |
| `broadcast_notifications` | Pengumuman yang dibuat pengelola |
| `notification_deliveries` | Status baca notifikasi per akun penerima |

## Relasi antar tabel

- `accounts.resident_id` → `master_residents.id`
- `permits.resident_id` → `master_residents.id`
- `permit_events.permit_id` → `permits.id`
- `permit_events.performed_by_account_id` → `accounts.id`
- `manager_bootstrap_links.account_id` → `accounts.id`
- `broadcast_notifications.created_by_account_id` → `accounts.id`
- `notification_deliveries.notification_id` → `broadcast_notifications.id`
- `notification_deliveries.account_id` → `accounts.id`

## Sumber

Diturunkan dari schema asli (SQLite) di `lib/db.ts` pada project utama.
