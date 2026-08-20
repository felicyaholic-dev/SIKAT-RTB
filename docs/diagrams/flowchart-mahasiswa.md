# Flowchart — Mahasiswa

Alur dari sudut pandang penghuni: login, ajukan izin, sampai kembali ke RTB. Sumber: [app/student/](../../app/student/), [app/actions.ts](../../app/actions.ts).

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
  ChangePw --> Home[Masuk ke Beranda]
  First -->|Tidak| Home

  Home --> Choice{Pilih aktivitas}
  Choice -->|Edit profil| Profile["Ubah kamar / nomor WA / email
  (opsional, langsung tersimpan
  ke data Pengelola)"]
  Profile --> CheckWing{Kamar baru: wing dikenali
  & gender cocok wing itu?}
  CheckWing -->|Tidak| RejectWing[Ditolak: format/gender
  kamar tidak sesuai]
  RejectWing --> Home
  CheckWing -->|Ya| SaveProfile[Data kamar tersimpan]
  SaveProfile --> Home

  Choice -->|Ajukan izin keluar| Apply[Isi tujuan, tanggal, jam keluar]
  Apply --> QR["Status: MENUNGGU_KELUAR
  kode SKT- + QR aktif"]
  QR --> Cancel1{Batalkan sebelum
  diproses satpam?}
  Cancel1 -->|Ya| Del1[Pengajuan dihapus]
  Del1 --> Finish
  Cancel1 -->|Tidak| Wait1[Tunjukkan QR ke satpam
  di gerbang]
  Wait1 --> Decision{Satpam memutuskan}
  Decision -->|Ditolak| Rejected[Status: DIBATALKAN]
  Rejected --> NotifReject["Terima notifikasi
  WA + Email: ditolak"]
  NotifReject --> Home

  Decision -->|Disetujui| Outside["Status: SEDANG_DI_LUAR"]
  Outside --> NotifApprove["Terima notifikasi
  WA + Email: disetujui"]
  NotifApprove --> ReturnApply[Ajukan konfirmasi masuk,
  isi estimasi waktu kembali]
  ReturnApply --> EntryQR["Status: MENUNGGU_MASUK
  kode SKM-"]
  EntryQR --> Cancel2{Batalkan sebelum
  diproses satpam?}
  Cancel2 -->|Ya| Del2[Pengajuan dihapus]
  Del2 --> Finish
  Cancel2 -->|Tidak| Wait2[Tunjukkan kode ke satpam
  saat kembali]
  Wait2 --> EntryConfirm[Satpam catat masuk]
  EntryConfirm --> Done["Status: SELESAI
  masuk Riwayat"]
  Done --> NotifEntry["Terima notifikasi
  WA + Email: konfirmasi masuk"]
  NotifEntry --> Home

  Choice -->|Lihat notifikasi| NotifCenter[Buka Pusat Notifikasi:
  pengumuman dari Pengelola]
  NotifCenter --> Home
  Choice -->|Lihat riwayat| History[Buka Riwayat izin sendiri]
  History --> Home
  Choice -->|Ganti tema| Theme[Terang / Gelap / Ikuti sistem]
  Theme --> Home
  Choice -->|Keluar| Logout[Logout]
  Logout --> Finish
```

**Catatan:**
- Satu izin **masuk** tidak bisa ditolak satpam (hanya dikonfirmasi) — beda dengan izin **keluar** yang bisa ditolak.
- Notifikasi WA dan Email dikirim otomatis di titik yang sama, tapi masing-masing independen: kalau salah satu kanal belum diaktifkan Pengelola (belum ada kredensial), kanal lain tetap jalan.
- Edit kamar/WA/email bisa dilakukan kapan saja dari halaman Profil, tidak menunggu proses izin selesai.
- Kamar wajib format `WING-NOMOR` (contoh `A1-101`) dan wing-nya harus cocok dengan jenis kelamin mahasiswa — lihat tabel wing di [flowchart-pengelola.md](flowchart-pengelola.md#referensi-wing).
- **Password hanya bisa diganti sekali**, saat login pertama (langkah "Wajib buat password baru" di atas). Setelah itu, mahasiswa tidak bisa mengganti password sendiri lagi — kalau lupa, gunakan **Reset Password** mandiri di halaman login (verifikasi ID BCA + nama + kamar), bukan menu ganti password.
- **QR tidak bisa di-screenshot 100%** — itu di luar kendali halaman web mana pun (screenshot/screen-recording terjadi di level OS, bukan lewat browser). Yang benar-benar diterapkan (`components/PermitQr.tsx`): klik-kanan/tekan-lama "simpan gambar" dinonaktifkan, dan QR di-blur otomatis saat tab/aplikasi tidak aktif (agar tidak nampak di thumbnail app-switcher). Perlindungan sebenarnya tetap di server: QR/kode izin sekali pakai (`decidePermit`) — begitu divalidasi satpam, salinan apa pun (termasuk screenshot lama) langsung tidak berlaku.
- Validasi satpam **tidak akan pernah menandai QR di luar sistem sebagai valid** — `getPermitForSecurity` mencocokkan kode yang dipindai persis (`=`, bukan pencarian sebagian) terhadap `permit_code`/`qr_token`/`entry_code` yang tersimpan; kode apa pun yang tidak cocok selalu tampil "Izin tidak ditemukan".
- Kode `SKT-`/`SKM-` dibuat lewat `crypto.getRandomValues()` (alfabet 32 karakter tanpa karakter ambigu), bukan `Math.random()` — sama seperti `qr_token` yang sudah lebih dulu memakai `crypto.randomUUID()`.
