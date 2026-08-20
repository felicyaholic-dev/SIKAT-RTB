# Flowchart — Pengelola

Alur dari sudut pandang pengelola RTB: kelola data master, pantau kondisi RTB, dan kirim pengumuman. Sumber: [app/manager/](../../app/manager/), [app/actions.ts](../../app/actions.ts).

```mermaid
%%{init: {'flowchart': {'curve': 'linear'}}}%%
flowchart TD
  Start([Mulai]) --> Login["Login: ID BCA + password"]
  Login -->|Lupa password?| ResetReq["Masukkan ID BCA di
  /reset-password/manager"]
  ResetReq --> ResetEmail["Tautan reset dikirim ke
  email terdaftar (kalau ada) —
  pesan sama persis walau
  ID BCA tidak valid"]
  ResetEmail --> ResetClick["Klik tautan (berlaku
  30 menit, sekali pakai)"]
  ResetClick --> ResetNew[Atur password baru]
  ResetNew --> Login
  Login --> RL{Lebih dari 5 percobaan
  gagal dalam 15 menit?}
  RL -->|Ya| RL1[Login ditolak sementara]
  RL1 --> Finish([Selesai])
  RL -->|Tidak| First{Login pertama kali?}
  First -->|Ya| ChangePw[Wajib buat password baru]
  ChangePw --> Home[Masuk ke Dashboard]
  First -->|Tidak| Home

  Home --> Menu{Pilih menu}

  Menu -->|Dashboard| Dash["Lihat ringkasan: penghuni
  di dalam/luar, keluar hari ini,
  grafik aktivitas & jam sibuk
  (rentang tanggal bisa diatur
  bebas via kalender), rekap
  SELURUH wing, aktivitas
  24 jam terakhir"]
  Dash --> Home

  Menu -->|Riwayat| Hist["Lihat riwayat validasi
  keluar-masuk SELURUH satpam,
  tercatat siapa yang
  memvalidasi tiap izin — bisa
  difilter wing & kelas
  (multi-pilih) dan jangka
  waktu; sama seperti Riwayat
  Satpam"]
  Hist --> Home

  Menu -->|Pengaturan: Master Penghuni| MP{Aksi}
  MP -->|Tambah satu| AddOne[Isi ID BCA, nama, kamar
  format WING-NOMOR, kelas,
  gender, password awal,
  WA/email opsional]
  MP -->|Impor massal| Import["Unggah .xlsx
  (ID BCA/Nama/Kamar/Kelas/
  Gender/Password/WA/Email)"]
  Import --> ImportCheck["Tiap baris divalidasi
  independen — baris salah
  dilaporkan, baris benar
  tetap tersimpan"]
  MP -->|Edit| EditOne[Ubah data, termasuk
  nonaktifkan/aktifkan]
  MP -->|Hapus satu / sekelas| DeleteOne["Hapus permanen data,
  akun, dan riwayat izin"]
  AddOne --> CheckWing{Wing dari kamar
  dikenali & gender
  cocok wing itu?}
  EditOne --> CheckWing
  ImportCheck --> CheckWing
  CheckWing -->|Tidak| RejectWing["Ditolak: format kamar
  tidak dikenali atau gender
  tidak sesuai wing"]
  RejectWing --> Home
  CheckWing -->|Ya| CheckRoom{Kamar sudah
  2 penghuni aktif?}
  CheckRoom -->|Ya| RejectRoom[Ditolak: kamar penuh]
  RejectRoom --> Home
  CheckRoom -->|Tidak| SaveResident[Akun & data tersimpan,
  audit log tercatat]
  SaveResident --> Home
  DeleteOne --> SaveResident

  Menu -->|Pengaturan: Master Satpam| MS[Tambah / edit / nonaktifkan
  akun satpam]
  MS --> Home

  Menu -->|Pengaturan: Broadcast| BC[Tulis judul + isi pengumuman]
  BC --> BCSend["Kirim ke pusat notifikasi
  Mahasiswa & Pengelola aktif
  (Satpam tidak punya pusat
  notifikasi), plus Email ke
  penghuni yang punya email"]
  BCSend --> Home

  Menu -->|Pengaturan: Reset riwayat| RH{Cakupan}
  RH -->|Seluruh sistem| RHAll["Hapus semua permits,
  permit_events, notifikasi
  broadcast & delivery"]
  RH -->|Per kelas| RHClass["Hapus izin & event
  milik kelas itu saja"]
  RHAll --> Warn["⚠ Disarankan unduh CSV
  'Semua waktu' dulu
  sebagai arsip"]
  RHClass --> Warn
  Warn --> Home

  Menu -->|Pengaturan: Backup database| Backup["Unduh salinan database
  saat ini (.db) untuk
  disimpan di luar volume"]
  Backup --> Home

  Menu -->|Laporan| Report{Jenis data}
  Report -->|Aktivitas keluar-masuk| ReportFilter[Filter: kelas + periode
  hari ini/7 hari/bulan/tahun/
  semua waktu]
  Report -->|Penghuni di dalam RTB| InsideFilter[Filter: kelas]
  ReportFilter --> Download[Unduh CSV sesuai filter]
  InsideFilter --> Download
  Download --> Home

  Menu -->|Profil| Prof[Ubah nama / ID BCA /
  email akun sendiri, ATAU
  ganti password kapan saja]
  Prof --> Home
  Menu -->|Ganti tema| Theme[Terang / Gelap / Ikuti sistem]
  Theme --> Home
  Menu -->|Keluar| Logout[Logout]
  Logout --> Finish
```

**Catatan:**
- Menu **Riwayat** ini fitur baru — sebelumnya hanya satpam yang punya halaman ini; sekarang Pengelola juga bisa melihat data yang persis sama untuk pemantauan.
- **Broadcast** memicu dua hal sekaligus: notifikasi in-app ke akun Mahasiswa & Pengelola (Satpam tidak punya pusat notifikasi — ikonnya tidak ditampilkan di shell Satpam), dan email ke penghuni yang sudah mengisi alamat email.
- Nama, kelas, dan status penghuni **tetap** hanya bisa diubah lewat menu ini (bukan oleh mahasiswa sendiri); yang boleh diubah mahasiswa sendiri hanya kamar, WA, dan email.
- **Wing** bukan kolom database tersendiri — sistem menurunkannya dari awalan nomor kamar (format `WING-NOMOR`, contoh `A1-101`), lalu mengecek jenis kelamin penghuni harus cocok dengan wing tersebut. Aturan ini berlaku di tambah/edit/impor Pengelola *maupun* saat mahasiswa mengubah kamar sendiri di halaman Profil.
- Grafik **Aktivitas keluar-masuk**, **Jam sibuk**, dan **Rekap wing** di Dashboard masing-masing punya kalender "Dari – Ke" independen sendiri-sendiri (default 7 hari, 30 hari, 30 hari) — mengubah satu tidak memengaruhi yang lain. Panel **Aktivitas terbaru** di Dashboard selalu tetap pada 24 jam terakhir (tidak ikut kalender) — kartu "Di luar RTB" di atasnya tetap menghitung total riil termasuk yang sudah di luar lebih dari 24 jam.
- Filter **Riwayat** (wing & kelas, masing-masing bisa multi-pilih, plus jangka waktu) sekarang identik di halaman Pengelola *dan* Satpam — satu komponen (`components/PermitHistoryPage.tsx`) dipakai keduanya.
- **Password Pengelola bisa diganti kapan saja** dari halaman Profil (`ManagerChangePasswordForm`) — beda dengan Mahasiswa/Satpam yang cuma boleh sekali, saat login pertama. Ditegakkan di `changePasswordAction` (server), bukan cuma disembunyikan di UI: percobaan ganti password dari akun Mahasiswa/Satpam di luar momen login pertama akan ditolak walau dikirim langsung ke server.
- **Reset password Pengelola lewat email** (`requestManagerPasswordReset`/`resetManagerPasswordWithToken`) butuh email sudah diisi di Profil lebih dulu. Token acak (256-bit), di-hash sebelum disimpan (`password_reset_tokens.token_hash`), sekali pakai, kedaluwarsa 30 menit. Pesan yang ditampilkan sama persis baik ID BCA itu Pengelola sungguhan, Pengelola tanpa email, atau ID BCA yang tidak ada — supaya tidak bisa dipakai menebak akun mana yang valid.
- **Backup database**: otomatis harian di volume yang sama (dipicu tiap Dashboard dimuat, disimpan 14 hari) melindungi dari korupsi/salah hapus; tombol **Unduh backup** di Pengaturan untuk salinan manual yang disimpan di luar volume — dua-duanya perlu, beda risiko yang dijaga. Detail di README §11c.
- Kode izin manual (`SKT-`/`SKM-`, dipakai satpam saat scan QR gagal) dibuat lewat `crypto.getRandomValues()` dengan alfabet 32 karakter tanpa karakter ambigu — bukan `Math.random()`. Pencarian kode/QR di halaman Validasi Satpam kena rate limit 20 percobaan "tidak ditemukan" per 15 menit per akun satpam (`SCAN`), terpisah dari rate limit login/reset password.

## Referensi wing

| Wing | Lantai | Jenis kelamin |
| --- | --- | --- |
| ALG | Lantai ALG | Perempuan |
| AG | Lantai AG | Perempuan |
| BG | Lantai BG | Laki-laki |
| A1 | Lantai 1 | Perempuan |
| B1 | Lantai 1 | Perempuan |
| A2 | Lantai 2 | Perempuan |
| B2 | Lantai 2 | Perempuan |
| A3 | Lantai 3 | Laki-laki |
| B3 | Lantai 3 | Laki-laki |
| A5 | Lantai 5 | Laki-laki |

Sumber kebenaran: [lib/wings.ts](../../lib/wings.ts).
