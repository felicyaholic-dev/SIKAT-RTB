# DFD SIKAT RTB

Diturunkan langsung dari schema database ([lib/db.ts](../../lib/db.ts)) dan alur server action ([app/actions.ts](../../app/actions.ts)) yang berjalan saat ini — termasuk notifikasi WhatsApp + Email, riwayat global Pengelola, dan edit kontak mandiri oleh mahasiswa.

## DFD Level 0 (Diagram Konteks)

Sistem sebagai satu proses tunggal dan pertukaran data dengan pihak luar.

```mermaid
flowchart LR
  MHS[Mahasiswa / Penghuni]
  SAT[Satpam]
  PGL[Pengelola]
  WA[WhatsApp Cloud API]
  EMAIL[Resend Email API]

  SYS((0.0
  Sistem SIKAT RTB))

  MHS -->|Login, ajukan izin,
  edit kontak sendiri
  kamar/WA/email| SYS
  SYS -->|Status izin, QR,
  riwayat, notifikasi| MHS

  SAT -->|Login, validasi QR
  / kode izin| SYS
  SYS -->|Data penghuni
  sedang di luar,
  riwayat validasi| SAT

  PGL -->|Data master penghuni
  / satpam, impor Excel,
  pengumuman, reset riwayat| SYS
  SYS -->|Dashboard, riwayat
  global, laporan| PGL

  SYS -->|Kirim pesan template| WA
  WA -->|Status kirim| SYS
  SYS -->|Kirim email HTML| EMAIL
  EMAIL -->|Status kirim| SYS
```

## DFD Level 1

Memecah proses tunggal menjadi lima proses utama dan seluruh tabel data yang dipakai.

```mermaid
flowchart TD
  MHS[Mahasiswa]
  SAT[Satpam]
  PGL[Pengelola]
  WA[WhatsApp Cloud API]
  EMAIL[Resend Email API]

  P1((1.0
  Manajemen
  Data Master))
  P2((2.0
  Autentikasi
  & Akun))
  P3((3.0
  Pengajuan &
  Validasi Izin))
  P4((4.0
  Notifikasi))
  P5((5.0
  Monitoring &
  Pelaporan))

  D1[(D1 master_residents)]
  D2[(D2 accounts)]
  D3[(D3 security_staff)]
  D4[(D4 permits)]
  D5[(D5 permit_events)]
  D6[(D6 login_attempts)]
  D7[(D7 broadcast_notifications)]
  D8[(D8 notification_deliveries)]
  D9[(D9 audit_logs)]

  PGL -->|Tambah/edit/hapus penghuni
  & satpam, impor Excel| P1
  MHS -->|Edit kamar, WA,
  email milik sendiri| P1
  P1 --> D1
  P1 --> D3
  P1 -->|Buat akun awal| D2
  P1 --> D9

  MHS -->|ID BCA + password,
  ganti/reset password| P2
  SAT -->|ID BCA + password| P2
  PGL -->|ID BCA + password| P2
  P2 --> D6
  P2 -.->|Cek & update kredensial| D2
  P2 -->|Sesi login| MHS
  P2 -->|Sesi login| SAT
  P2 -->|Sesi login| PGL

  MHS -->|Ajukan izin, konfirmasi
  waktu kembali, batalkan| P3
  SAT -->|Validasi keluar
  / masuk| P3
  P3 --> D4
  P3 --> D5
  P3 -.->|Cek data penghuni| D1
  P3 -->|Status & QR izin| MHS
  P3 -->|Data penghuni di luar| SAT

  P3 -->|Trigger: status berubah| P4
  PGL -->|Buat pengumuman
  broadcast| P4
  P4 --> D7
  P4 --> D8
  P4 -->|Kirim pesan template| WA
  WA -->|Status kirim| P4
  P4 -->|Kirim email HTML| EMAIL
  EMAIL -->|Status kirim| P4
  P4 -->|Notifikasi diterima| MHS

  D1 -.-> P5
  D4 -.-> P5
  D5 -.-> P5
  D9 -.-> P5
  P5 -->|Dashboard, riwayat
  global keluar-masuk,
  laporan + CSV| PGL
  P5 -->|Riwayat global
  keluar-masuk| SAT
```

> Catatan: `manager_bootstrap_links` tidak digambarkan — hanya dipakai sekali saat setup akun Pengelola pertama, bukan bagian dari alur data operasional harian.

## Perubahan sejak versi sebelumnya

- **Proses 1.0** sekarang ditulis oleh dua aktor: Pengelola (data lengkap) *dan* Mahasiswa (kamar/WA/email milik sendiri saja) — sebelumnya hanya Pengelola.
- **Proses 4.0** sekarang mengirim ke dua kanal eksternal: WhatsApp Cloud API *dan* Resend Email API (sebelumnya cuma WhatsApp).
- **Proses 5.0** outputnya juga mengalir ke Satpam — sejak halaman Riwayat pengelola dan satpam sama-sama menampilkan riwayat validasi gabungan seluruh satpam (bukan hanya milik akun yang login).
