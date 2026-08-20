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
  First -->|Ya| ChangePw["Wajib buat password baru
  (satu-satunya kesempatan)"]
  ChangePw --> ChangePwEmail["Email konfirmasi dikirim
  (bila email sudah diisi)"]
  ChangePwEmail --> Home[Masuk ke Beranda]
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

  Choice -->|Ajukan izin keluar| Apply["Isi tujuan, jam keluar
  (tanggal selalu hari ini,
  tidak bisa dipilih)"]
  Apply --> Curfew{Jam keluar
  05.00–22.00?}
  Curfew -->|Tidak, jam malam
  22.00–04.59| RejectCurfew[Ditolak: pengajuan
  keluar jam malam
  tidak diperbolehkan]
  RejectCurfew --> Home
  Curfew -->|Ya| QR["Status: MENUNGGU_KELUAR
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
  Choice -->|Keluar| Logout["Logout — izin yang masih
  menunggu (belum divalidasi
  satpam) otomatis dibatalkan"]
  Logout --> Finish
```

**Catatan:**
- Satu izin **masuk** tidak bisa ditolak satpam (hanya dikonfirmasi) — beda dengan izin **keluar** yang bisa ditolak.
- Notifikasi WA dan Email dikirim otomatis di titik yang sama, tapi masing-masing independen: kalau salah satu kanal belum diaktifkan Pengelola (belum ada kredensial), kanal lain tetap jalan.
- Edit kamar/WA/email bisa dilakukan kapan saja dari halaman Profil, tidak menunggu proses izin selesai.
- Kamar wajib format `WING-NOMOR` (contoh `A1-101`) dan wing-nya harus cocok dengan jenis kelamin mahasiswa — lihat tabel wing di [flowchart-pengelola.md](flowchart-pengelola.md#referensi-wing).
- **Password hanya bisa diganti sekali**, saat login pertama (langkah "Wajib buat password baru" di atas). Setelah itu, mahasiswa tidak bisa mengganti password sendiri lagi, dan **tidak ada jalur reset mandiri** — kalau lupa, satu-satunya cara adalah menghubungi Pengelola RTB untuk direset. Sistem mengirim email konfirmasi (`sendPasswordChangedEmail`) begitu password baru itu tersimpan, kalau email di Master Penghuni sudah diisi — jaga-jaga supaya ada catatan yang bisa dicek ulang kalau lupa.
- **Logout membatalkan izin yang masih menunggu validasi satpam** (`MENUNGGU_KELUAR`/`MENUNGGU_MASUK`) — QR/kode tidak lagi punya batas waktu akhir sejak berputar tiap 15 detik (lihat di bawah), jadi logout jadi titik pembersihan alaminya. Login berikutnya selalu mulai dari **Ajukan Izin** baru. Tidak berlaku untuk status `SEDANG_DI_LUAR`, yang tetap dipertahankan karena itu status nyata mahasiswa di dunia fisik.
- **QR/kode izin berputar tiap 15 detik**, bukan nilai tetap sejak dibuat — turunan HMAC dari secret per izin (`qr_token`) + jendela waktu saat itu (`currentPermitCode` di `lib/db.ts`), mirip TOTP. Halaman mahasiswa polling `/api/student/current-permit-code` tiap 15 detik supaya QR/kode yang tampil selalu yang berlaku, tanpa perlu isi ulang form. Screenshot lama, kode yang ditulis di kertas, atau kode yang dibagikan ke orang lain berhenti berfungsi maksimal ~30 detik kemudian (toleransi ±1 jendela) — terlepas dari izinnya sudah diproses satpam atau belum.
- **QR tidak bisa dibuat screenshot-proof 100% dari sisi visual** — itu di luar kendali halaman web mana pun (screenshot/screen-recording terjadi di level OS, bukan lewat browser). Yang benar-benar diterapkan (`components/PermitQr.tsx`): klik-kanan/tekan-lama "simpan gambar" dinonaktifkan, dan QR di-blur otomatis saat tab/aplikasi tidak aktif (agar tidak nampak di thumbnail app-switcher). Perlindungan sebenarnya ya rotasi 15 detik di atas.
- Validasi satpam **tidak akan pernah menandai QR di luar sistem sebagai valid** — `getPermitForSecurity` menghitung ulang kode yang seharusnya berlaku *saat itu juga* (turunan HMAC dari `qr_token`, toleransi ±1 jendela 15 detik) dan mencocokkannya persis, bukan membandingkan ke `permit_code`/`entry_code` yang tersimpan tetap di database; kode apa pun yang tidak cocok, tidak valid, di luar jendela waktu yang berlaku, atau sudah pernah dipakai selalu tampil pesan generik "Terjadi kesalahan".
- Label `permit_code`/`entry_code` (dipakai di laporan/riwayat, bukan lagi yang divalidasi satpam — lihat poin rotasi QR di atas) dibuat lewat `crypto.getRandomValues()` (alfabet 32 karakter tanpa karakter ambigu), bukan `Math.random()` — sama seperti `qr_token` yang memakai `crypto.randomUUID()` sebagai secret rotasi.
- **Tanggal izin keluar/masuk selalu hari ini** — field tanggal di form hanya tampilan, tidak bisa diedit ke kemarin atau besok. `createPermitAction` menghitung tanggalnya sendiri di server (zona Jakarta), bukan memercayai nilai dari form, jadi tidak bisa dimanipulasi lewat request langsung; yang tetap bisa mahasiswa pilih hanya jam-nya.
- **Jam malam (22.00–04.59): pengajuan izin keluar ditolak** — hanya berlaku untuk waktu keluar, bukan waktu kembali. Ditegakkan di `createPermit` (`lib/db.ts`), bukan cuma `min`/`max` di form.
- **Login juga dibatasi per alamat IP** (`LOGIN_IP`), terpisah dari batas per ID BCA — supaya satu sumber yang mencoba banyak ID BCA berbeda (password spraying) tetap tertahan. Batasnya 5/30 menit (lihat README §10 untuk tradeoff-nya di WiFi bersama satu gedung asrama).
