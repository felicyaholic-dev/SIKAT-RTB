# SIKAT RTB — Demo PHP + MySQL

## Apa ini?

Ini adalah versi **percontohan (proof-of-concept)** dari sistem SIKAT RTB (Sistem Izin Keluar Masuk Asrama), ditulis ulang dengan **PHP polos + MySQL** tanpa framework apa pun.

Aplikasi utama SIKAT RTB yang sesungguhnya dibangun dengan Next.js (TypeScript) dan SQLite, lalu di-deploy di Railway. Folder `cpanel-php-demo/` ini **bukan** aplikasi yang sama, dan **bukan** untuk dipakai sebagai aplikasi produksi sungguhan. Folder ini dibuat khusus untuk keperluan **skripsi**, yaitu untuk menunjukkan bahwa alur data dan proses bisnis yang sama pada sistem aslinya juga bisa diimplementasikan memakai PHP + MySQL biasa — teknologi yang umum tersedia di hosting cPanel kampus.

Karena sifatnya proof-of-concept, beberapa hal sengaja **tidak** dibuat di sini (berbeda dari aplikasi asli), yaitu:

- Tidak ada verifikasi email atau OTP.
- Tidak ada notifikasi WhatsApp/email otomatis.
- Tidak ada pembatasan percobaan login (rate limiting).
- Tidak ada token CSRF pada form.
- Fitur kelola data (tambah/ubah/hapus penghuni & satpam) di halaman Pengelola sengaja dibuat read-only saja, karena fokus demo ini adalah alur **izin keluar–masuk**, bukan alur administrasi data induk.

Yang **tetap** dijaga karena penting untuk keamanan dasar walau ini cuma demo:

- Semua query ke database memakai **PDO prepared statement** (tidak ada SQL string yang digabung manual), jadi aman dari SQL injection.
- Semua password disimpan sebagai **hash bcrypt** memakai `password_hash()`, dan dicocokkan memakai `password_verify()` — tidak ada password polos yang tersimpan di database.

## Kebutuhan sistem

- PHP 7.4 ke atas (idealnya PHP 8.x), dengan ekstensi **PDO MySQL** aktif (`pdo_mysql`). Ekstensi ini sudah aktif secara default di hampir semua hosting cPanel dan di XAMPP/Laragon.
- MySQL / MariaDB.
- **Tidak butuh Composer, tidak butuh `npm install`, tidak ada proses build.** Tinggal upload/copy folder ini, arahkan document root ke sana, lalu jalankan.

## Cara menjalankan di komputer sendiri (XAMPP / Laragon)

1. Copy seluruh folder `cpanel-php-demo/` ke dalam folder web server Anda:
   - XAMPP: `C:\xampp\htdocs\cpanel-php-demo\`
   - Laragon: `C:\laragon\www\cpanel-php-demo\`
2. Nyalakan Apache dan MySQL dari control panel XAMPP/Laragon.
3. Buka `http://localhost/phpmyadmin` di browser.
4. Buat database baru, misalnya beri nama `sikat_rtb_demo`.
5. Klik database tersebut, buka tab **SQL**, lalu copy-paste seluruh isi file `database.sql` dari folder ini, dan klik **Go** / **Kirim**. Ini akan membuat semua 10 tabel sekaligus mengisi data contoh (akun demo, data penghuni, dan beberapa izin contoh).
6. Buka file `config.php`, sesuaikan 4 baris `define(...)` di bagian atas dengan pengaturan database Anda:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'sikat_rtb_demo'); // samakan dengan nama database yang dibuat di langkah 4
   define('DB_USER', 'root');           // default XAMPP/Laragon
   define('DB_PASS', '');               // default XAMPP/Laragon (kosong)
   ```
7. Buka browser ke `http://localhost/cpanel-php-demo/` — akan otomatis diarahkan ke halaman login.

## Cara menjalankan di cPanel (untuk pengetesan lokal PHP di cPanel)

1. Lewat menu **MySQL Databases** di cPanel, buat database baru dan user baru, lalu hubungkan user tersebut ke database (beri semua hak akses/"All Privileges").
2. Buka **phpMyAdmin** dari cPanel, pilih database yang baru dibuat, buka tab **SQL**, lalu copy-paste isi `database.sql` dan jalankan.
3. Upload seluruh isi folder `cpanel-php-demo/` (lewat File Manager atau FTP) ke dalam folder public (misalnya `public_html/sikat-demo/` atau sebuah subdomain terpisah).
4. Edit `config.php` langsung dari File Manager cPanel, isi `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` sesuai dengan yang dibuat di langkah 1. Di cPanel, biasanya nama database & user otomatis diberi awalan seperti `namacpanel_sikat_rtb_demo`.
5. Akses lewat browser sesuai lokasi upload, misalnya `https://domainanda.com/sikat-demo/`.

## Akun demo (untuk login)

Password **sama untuk semua akun**: `demo123`

| Role | ID BCA (username login) | Password |
| --- | --- | --- |
| Pengelola | `100001` | `demo123` |
| Satpam | `90001` | `demo123` |
| Mahasiswa (Ahmad Fadillah, kamar A101) | `200001` | `demo123` |
| Mahasiswa (Siti Nurhaliza, kamar A102) | `200002` | `demo123` |
| Mahasiswa (Budi Santoso, kamar B201) | `200003` | `demo123` |
| Mahasiswa (Dewi Lestari, kamar B202) | `200004` | `demo123` |

Login memakai **ID BCA + password**, bukan email — mengikuti cara login aplikasi aslinya.

Data contoh (`database.sql`) sudah menyertakan 4 izin dalam status berbeda-beda supaya antrian tidak kosong saat pertama kali dicoba:

- `SKT-DEM01` milik Ahmad — status **Menunggu Keluar** (coba divalidasi lewat akun Satpam).
- `SKT-DEM02` milik Siti — status **Sedang di Luar**.
- `SKT-DEM03` / kode masuk `SKM-DEM03` milik Budi — status **Menunggu Masuk** (coba dikonfirmasi lewat akun Satpam).
- `SKT-DEM04` / kode masuk `SKM-DEM04` milik Dewi — status **Selesai** (sudah lengkap satu siklus, muncul di halaman Riwayat).

## Alur yang bisa dicoba

1. **Login sebagai Mahasiswa** (`200001` / `demo123`) → buka menu "Izin Keluar" → isi tujuan & waktu berangkat → sistem membuatkan **kode izin** (format `SKT-XXXXX`).
2. **Login sebagai Satpam** (`90001` / `demo123`) → buka menu "Validasi" → masukkan kode izin tadi → sistem menampilkan detail mahasiswanya → klik **Setujui Keluar**. Status mahasiswa berubah jadi "Sedang di Luar".
3. Login lagi sebagai mahasiswa yang sama → karena sedang di luar, form berubah jadi "Lapor Sudah Kembali" → isi waktu kembali → sistem membuatkan **kode masuk** (format `SKM-XXXXX`).
4. Login lagi sebagai Satpam → masukkan kode masuk tadi → klik **Konfirmasi Masuk**. Status berubah jadi "Selesai".
5. **Login sebagai Pengelola** (`100001` / `demo123`) → lihat ringkasan statistik di Dashboard, daftar penghuni, dan riwayat lengkap validasi keluar-masuk dari semua satpam.

## Struktur folder

```
cpanel-php-demo/
  README.md                 <- file ini
  database.sql               Struktur 10 tabel + data contoh, tinggal import lewat phpMyAdmin
  config.php                  Pengaturan koneksi database (host/nama db/user/password)
  index.php                   Halaman awal, mengarahkan ke login atau dashboard sesuai sesi
  login.php                   Form login (ID BCA + password)
  logout.php                  Keluar dari sesi login
  includes/
    db.php                     Membuka satu koneksi PDO ke MySQL
    auth.php                   Fungsi login/logout/cek sesi/cek role
    helpers.php                Fungsi bantu: buat kode izin, terjemahan status, format tanggal, dll
    layout_start.php           Bagian atas HTML (head + navigasi) yang dipakai semua halaman
    layout_end.php             Bagian bawah HTML (footer) yang dipakai semua halaman
    history_query.php          Query riwayat validasi (dipakai bersama oleh Satpam & Pengelola)
    history_table.php          Tabel HTML riwayat (dipakai bersama oleh Satpam & Pengelola)
  student/
    dashboard.php               Profil + status izin aktif mahasiswa
    apply.php                   Form ajukan izin keluar / lapor sudah kembali
    history.php                 Riwayat izin milik mahasiswa yang login
  security/
    dashboard.php               Cari & validasi kode izin/masuk, daftar yang sedang di luar
    history.php                 Riwayat validasi dari seluruh satpam
  manager/
    dashboard.php                Ringkasan statistik
    residents.php                 Daftar seluruh data penghuni (read-only)
    history.php                   Riwayat validasi (sama seperti punya satpam)
  assets/
    style.css                     Satu file CSS polos untuk semua halaman
```

## Catatan penting

- **Ini bukan untuk produksi.** Jangan pakai `config.php` dengan kredensial database asli, dan jangan upload folder ini ke hosting publik yang bisa diakses siapa saja tanpa pengamanan tambahan.
- Data & alur bisnis (format kode izin `SKT-XXXXX`/`SKM-XXXXX`, urutan status `Menunggu Keluar → Sedang di Luar → Menunggu Masuk → Selesai`, dan `Dibatalkan` jika satpam menolak) mengikuti persis logika di aplikasi utama (`lib/db.ts`), supaya perbandingan kedua implementasi (Next.js/SQLite vs PHP/MySQL) adil dan konsisten.
