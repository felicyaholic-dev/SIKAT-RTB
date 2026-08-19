# Flowchart — Pengelola

Alur dari sudut pandang pengelola RTB: kelola data master, pantau kondisi RTB, dan kirim pengumuman. Sumber: [app/manager/](../../app/manager/), [app/actions.ts](../../app/actions.ts).

```mermaid
%%{init: {'flowchart': {'curve': 'linear'}}}%%
flowchart TD
  Start([Mulai]) --> Login["Login: ID BCA + password"]
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
  grafik 7 hari, grafik jam sibuk
  30 hari, rekap wing paling aktif,
  mahasiswa di luar saat ini"]
  Dash --> Home

  Menu -->|Riwayat| Hist["Lihat riwayat validasi
  keluar-masuk SELURUH satpam,
  tercatat siapa yang
  memvalidasi tiap izin"]
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
  SELURUH akun aktif, plus
  WA + Email ke penghuni
  yang punya nomor/email"]
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

  Menu -->|Laporan| Report{Jenis data}
  Report -->|Aktivitas keluar-masuk| ReportFilter[Filter: kelas + periode
  hari ini/7 hari/bulan/tahun/
  semua waktu]
  Report -->|Penghuni di dalam RTB| InsideFilter[Filter: kelas]
  ReportFilter --> Download[Unduh CSV sesuai filter]
  InsideFilter --> Download
  Download --> Home

  Menu -->|Profil| Prof[Ubah nama / ID BCA
  akun sendiri]
  Prof --> Home
  Menu -->|Ganti tema| Theme[Terang / Gelap / Ikuti sistem]
  Theme --> Home
  Menu -->|Keluar| Logout[Logout]
  Logout --> Finish
```

**Catatan:**
- Menu **Riwayat** ini fitur baru — sebelumnya hanya satpam yang punya halaman ini; sekarang Pengelola juga bisa melihat data yang persis sama untuk pemantauan.
- **Broadcast** memicu tiga hal sekaligus: notifikasi in-app ke semua akun, pesan WhatsApp, dan email — dua yang terakhir hanya ke penghuni yang sudah mengisi nomor WA/email.
- Nama, kelas, dan status penghuni **tetap** hanya bisa diubah lewat menu ini (bukan oleh mahasiswa sendiri); yang boleh diubah mahasiswa sendiri hanya kamar, WA, dan email.
- **Wing** bukan kolom database tersendiri — sistem menurunkannya dari awalan nomor kamar (format `WING-NOMOR`, contoh `A1-101`), lalu mengecek jenis kelamin penghuni harus cocok dengan wing tersebut. Aturan ini berlaku di tambah/edit/impor Pengelola *maupun* saat mahasiswa mengubah kamar sendiri di halaman Profil.

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
