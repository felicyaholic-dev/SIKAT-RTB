# Flowchart — Satpam

Alur dari sudut pandang petugas keamanan di gerbang. Sumber: [app/security/](../../app/security/), [app/actions.ts](../../app/actions.ts).

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
  ChangePw --> Home["Masuk ke Validasi Cepat
  (halaman utama satpam)"]
  First -->|Tidak| Home

  Home --> Mode{Kamera aktif?}
  Mode -->|Ya| Scan[Pindai QR mahasiswa]
  Mode -->|Tidak / gagal| Manual[Masukkan kode izin manual]
  Scan --> Lookup[Sistem tampilkan data:
  nama, kamar, tujuan,
  estimasi kembali, status]
  Manual --> Lookup

  Lookup --> Valid{Kode/QR valid untuk
  status saat ini?}
  Valid -->|Tidak, kedaluwarsa,
  atau sudah dipakai| Reject0[Tampilkan pesan error,
  tidak ada perubahan data]
  Reject0 --> Home

  Valid -->|Ya, status
  MENUNGGU_KELUAR| ExitDecision{Keputusan}
  ExitDecision -->|Tolak| ExitReject["Catat: EXIT_REJECTED
  Status izin: DIBATALKAN"]
  ExitReject --> NotifReject[Sistem kirim notifikasi
  WA + Email ke mahasiswa]
  NotifReject --> Home
  ExitDecision -->|Setuju| ExitApprove["Catat: EXIT
  Status izin: SEDANG_DI_LUAR"]
  ExitApprove --> NotifApprove[Sistem kirim notifikasi
  WA + Email ke mahasiswa]
  NotifApprove --> Home

  Valid -->|Ya, status
  MENUNGGU_MASUK| EntryConfirm["Catat: ENTRY
  Status izin: SELESAI
  (tidak bisa ditolak)"]
  EntryConfirm --> NotifEntry[Sistem kirim notifikasi
  WA + Email ke mahasiswa]
  NotifEntry --> Home

  Home --> OtherMenu{Menu lain}
  OtherMenu -->|Riwayat| History["Lihat riwayat validasi
  SELURUH satpam (bukan cuma
  akun sendiri), tercatat siapa
  yang memvalidasi apa — bisa
  difilter wing/kelas (multi-pilih)
  dan jangka waktu, sama seperti
  halaman Riwayat Pengelola"]
  History --> Home
  OtherMenu -->|Profil| Profile[Lihat data diri sendiri]
  Profile --> Home
  OtherMenu -->|Ganti tema| Theme[Terang / Gelap / Ikuti sistem]
  Theme --> Home
  OtherMenu -->|Keluar| Logout[Logout]
  Logout --> Finish
```

**Catatan:**
- Setiap keputusan (setuju/tolak/konfirmasi masuk) dicatat sebagai *event* dengan `performed_by_account_id` — jadi identitas satpam yang memutuskan selalu tersimpan, dan muncul di halaman Riwayat sebagai "oleh [nama satpam]".
- Halaman **Riwayat** menampilkan aktivitas dari *semua* satpam yang pernah bertugas, bukan cuma yang sedang login — supaya satpam shift berikutnya bisa lihat kelanjutan kasus dari shift sebelumnya.
- Halaman **Riwayat** Satpam dan Pengelola sekarang memakai komponen yang sama persis (`components/PermitHistoryPage.tsx`): filter wing dan kelas bisa multi-pilih (checkbox, bukan satu per satu), filter jangka waktu (Hari ini/7 hari/Bulan ini/Tahun ini/Semua waktu), dan tanpa filter berarti "semua". Hanya rute (`/security/outside` vs `/manager/history`) dan label peran yang beda.
- **Password hanya bisa diganti sekali**, saat login pertama (langkah "Wajib buat password baru" di atas). Satpam tidak punya reset password mandiri (beda dengan mahasiswa) — kalau lupa, hubungi Pengelola RTB untuk direset.
- Langkah **Valid?** di atas mencocokkan kode/QR yang dipindai persis (`=`, bukan pencarian sebagian) terhadap `permit_code`/`qr_token`/`entry_code` di database (`getPermitForSecurity`). QR atau kode apa pun yang bukan dari SIKAT RTB — atau kode asli yang sudah dipakai/kedaluwarsa — selalu jatuh ke jalur "Izin tidak ditemukan", tidak pernah tertulis valid.
