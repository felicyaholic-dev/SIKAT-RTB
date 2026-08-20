# Struktur database SIKAT RTB

11 tabel. Isi `schema.sql` di folder ini tinggal copy-paste ke tab **SQL** di phpMyAdmin lalu klik **Go** untuk membuat semuanya sekaligus.

| Tabel | Fungsi |
| --- | --- |
| `master_residents` | Data induk penghuni (ID BCA, nama, kamar, kelas, gender, status, no. HP, email) |
| `accounts` | Akun login semua role (mahasiswa/satpam/pengelola), terhubung ke `master_residents` untuk role mahasiswa; kolom `email` khusus dipakai akun MANAGER untuk reset password mandiri |
| `security_staff` | Data petugas satpam |
| `permits` | Pengajuan izin keluar-masuk (kode izin, QR token, tujuan, jadwal, status) |
| `permit_events` | Jejak setiap perubahan status pada satu izin (siapa yang memproses, kapan) |
| `audit_logs` | Log aktivitas umum di sistem — bisa ditinjau lewat halaman Log Aktivitas Pengelola |
| `login_attempts` | Percobaan login/reset/scan, untuk rate-limit brute force |
| `manager_bootstrap_links` | Penghubung akun pengelola awal saat sistem pertama kali di-setup |
| `broadcast_notifications` | Pengumuman yang dibuat pengelola |
| `notification_deliveries` | Status baca notifikasi per akun penerima |
| `password_reset_tokens` | Token reset password Pengelola (di-hash, sekali pakai, kedaluwarsa 30 menit) |

## Relasi antar tabel

- `accounts.resident_id` → `master_residents.id`
- `permits.resident_id` → `master_residents.id`
- `permit_events.permit_id` → `permits.id`
- `permit_events.performed_by_account_id` → `accounts.id`
- `manager_bootstrap_links.account_id` → `accounts.id`
- `broadcast_notifications.created_by_account_id` → `accounts.id`
- `notification_deliveries.notification_id` → `broadcast_notifications.id`
- `notification_deliveries.account_id` → `accounts.id`
- `password_reset_tokens.account_id` → `accounts.id`

## Wing (bukan kolom database)

Wing bangunan (ALG, AG, BG, A1, B1, A2, B2, A3, B3, A5) **tidak** disimpan sebagai kolom terpisah. Sistem menurunkannya dari awalan `master_residents.room_number`, yang wajib berformat `WING-NOMOR` (contoh `A1-101`). Setiap wing punya jenis kelamin tetap — aplikasi menolak penyimpanan kamar bila jenis kelamin penghuni tidak cocok dengan wing tersebut. Daftar lengkap dan aturannya ada di `lib/wings.ts` pada project utama, dan tabel referensinya ada di [flowchart Pengelola](../diagrams/flowchart-pengelola.md#referensi-wing).

## Sumber

Diturunkan dari schema asli (SQLite) di `lib/db.ts` pada project utama.
