# Penjelasan seluruh file — SIKAT RTB

Peta tiap file/folder di project ini dan fungsinya, ditulis dengan bahasa sehari-hari (non-teknis). Urutan file di tiap tabel mengikuti urutan abjad seperti yang tampil langsung di foldernya, supaya mudah dicocokkan sambil membuka foldernya.

Kalau ada file baru yang ditambahkan di kemudian hari dan belum tercatat di sini, tambahkan saja sesuai urutan abjad — dokumen ini seharusnya selalu mengikuti isi project yang sebenarnya.

## File di root project

| File | Fungsinya |
| --- | --- |
| `.env.example` | Contoh daftar pengaturan rahasia yang dibutuhkan aplikasi (kunci sesi login, dll) — isinya cuma contoh, bukan nilai asli, jadi aman ikut disimpan di git. |
| `.env.local` | Nilai asli dari pengaturan rahasia tadi, khusus untuk komputer ini — **tidak** ikut disimpan di git supaya tidak bocor ke orang lain. |
| `.github/dependabot.yml` | Pengaturan supaya GitHub secara otomatis memeriksa update library yang dipakai project ini setiap minggu, dan mengumpulkannya jadi satu usulan perubahan (bukan satu-satu). |
| `.github/workflows/ci.yml` | Pengaturan pemeriksaan otomatis oleh GitHub: setiap ada perubahan kode dikirim, otomatis dicek kerapian kode, dijalankan seluruh pengujian otomatis, dan dicoba di-build — supaya kesalahan ketahuan sebelum masuk ke kode utama. |
| `.gitignore` | Daftar file/folder yang sengaja tidak ikut disimpan di git (contoh: folder library pihak ketiga, file database lokal). |
| `eslint.config.mjs` | Aturan pengecekan kerapian kode secara otomatis. |
| `next-env.d.ts` | Dibuat otomatis oleh kerangka aplikasi (Next.js), tidak perlu dan tidak boleh diedit manual. |
| `next.config.ts` | Pengaturan keamanan & teknis aplikasi secara keseluruhan: mengunci akses kamera cuma untuk fitur pindai QR Satpam (fitur lain seperti mikrofon/lokasi otomatis ditolak), beberapa lapis pengaman browser supaya halaman ini tidak bisa disisipkan diam-diam ke situs lain untuk menipu pengguna, dan pengaturan teknis lain saat aplikasi disiapkan untuk dipakai publik. |
| `package.json` | Daftar semua komponen/library luar yang dipakai project, dan daftar perintah singkat untuk menjalankannya (mulai aplikasi, menjalankan pengujian otomatis, dst). |
| `pnpm-lock.yaml` | Catatan versi persis setiap komponen/library yang dipakai, dibuat otomatis — jangan diedit manual. |
| `pnpm-workspace.yaml` | Pengaturan tambahan untuk alat instalasi library (pnpm). |
| `postcss.config.mjs` | Pengaturan alat yang memproses tampilan/gaya visual (CSS) aplikasi. |
| `README.md` | Dokumentasi utama project: tujuan, cara kerja, cara pasang, keamanan, dll. Dokumen paling lengkap dan paling utama. |
| `tsconfig.json` | Pengaturan bahasa pemrograman yang dipakai seluruh kode aplikasi. |
| `vitest.config.mts` | Pengaturan untuk menjalankan pengujian otomatis aplikasi. |

## `app/` — Semua halaman yang dilihat pengguna

Susunan folder di dalam `app/` menentukan alamat halaman (URL) secara langsung, jadi tidak bisa diubah-ubah sembarangan.

| File/folder | Fungsinya |
| --- | --- |
| `actions.test.ts` | Pengujian otomatis untuk sebagian isi `actions.ts` (aturan ganti password per peran pengguna). |
| `actions.ts` | Kumpulan seluruh tindakan yang dipicu tombol/form di seluruh aplikasi (login, ganti password, ajukan izin, validasi satpam, kelola data oleh pengelola, dll). Aturan sebenarnya ada di `lib/db.ts`; file ini yang menghubungkan tombol/form ke aturan tersebut. |
| `activate/` | Alamat lama yang otomatis mengarahkan pengunjung ke halaman utama dengan form login langsung terbuka (untuk link lama yang mungkin masih beredar). |
| `api/backup/route.ts` | Menyediakan salinan database untuk diunduh Pengelola (tombol Backup Database). |
| `api/notifications/route.ts` | Menyediakan daftar notifikasi untuk ditampilkan, dan mencatat notifikasi mana yang sudah dibaca. |
| `api/reports/daily.csv/route.ts` | Menyediakan file laporan aktivitas harian (format CSV, bisa dibuka di Excel) untuk diunduh. |
| `api/student/current-permit-code/route.ts` | Dicek ulang otomatis tiap 15 detik oleh halaman mahasiswa, untuk mengambil QR/kode izin yang sedang berlaku saat itu. Kode ini sengaja berganti tiap 15 detik supaya tidak bisa disalahgunakan lewat screenshot lama (lihat README §10). |
| `api/student/permit-status/route.ts` | Dicek ulang otomatis oleh halaman mahasiswa, untuk tahu kalau izinnya baru saja diputuskan (disetujui/ditolak) satpam. |
| `change-password/ChangePasswordForm.tsx` | Form ganti password wajib di login pertama: password awal, password baru, konfirmasi password baru. |
| `change-password/page.tsx` | Halaman ganti password wajib. Otomatis melompati halaman ini kalau penggunanya sudah pernah ganti password. |
| `globals.css` | Definisi warna, bentuk sudut, dan gaya visual yang dipakai di seluruh aplikasi (termasuk mode gelap). |
| `layout.tsx` | Bingkai paling luar dari setiap halaman — memuat jenis huruf, tema, dan animasi logo pembuka. |
| `loading.tsx` | Layar loading singkat yang muncul saat halaman pertama kali dibuka. |
| `login/LoginForm.tsx` | Form login: isian ID BCA dan password. |
| `login/page.tsx` | Alamat lama, otomatis mengarahkan ke halaman utama dengan form login langsung terbuka. |
| `manager/AddResidentForm.tsx` | Jendela pop-up "Tambah penghuni" (di halaman Pengaturan): isi ID BCA, nama, kamar, kelas, dan password awal — otomatis membuatkan akun login untuk penghuni baru. |
| `manager/DashboardRangeFilter.tsx` | Kontrol pilih rentang tanggal (dari–sampai) untuk grafik-grafik di halaman Dashboard. |
| `manager/DeleteResidentsByClass.tsx` | Jendela pop-up konfirmasi untuk menghapus seluruh data satu kelas/angkatan sekaligus (dipakai saat satu angkatan sudah tidak lagi tinggal di RTB). |
| `manager/EditResidentForm.tsx` | Jendela pop-up untuk mengubah data satu penghuni, dan tombol hapus satu penghuni — dipakai di tabel halaman Pengaturan. |
| `manager/history/page.tsx` | Halaman Riwayat Pengelola: daftar keputusan izin keluar-masuk seluruh penghuni, bisa difilter. |
| `manager/ImportResidentsForm.tsx` | Jendela pop-up untuk mengunggah file Excel berisi banyak data penghuni sekaligus (impor massal). |
| `manager/ManagerChangePasswordForm.tsx` | Form ganti password khusus akun Pengelola — bisa dipakai kapan saja, beda dari akun mahasiswa/satpam yang cuma bisa sekali di awal. |
| `manager/ManagerProfileForm.tsx` | Form ubah data pribadi akun Pengelola (nama, ID BCA, email). |
| `manager/NotificationBroadcast.tsx` | Form kirim pengumuman ke seluruh pengguna aktif, beserta daftar riwayat pengumuman yang pernah dikirim dan tombol hapus. |
| `manager/page.tsx` | Halaman Dashboard utama Pengelola: ringkasan jumlah penghuni di dalam/luar RTB, grafik aktivitas, jam tersibuk, rekap per wing, dan aktivitas terbaru. |
| `manager/profile/page.tsx` | Halaman Profil Pengelola: data akun, memuat form ubah profil dan form ganti password. |
| `manager/ReportFilters.tsx` | Kontrol filter kelas untuk halaman Laporan. |
| `manager/ResetHistoryControl.tsx` | Tombol dan konfirmasi untuk mengosongkan riwayat izin (semua atau per kelas), di halaman Pengaturan. |
| `manager/SecurityStaffControl.tsx` | Tabel data satpam beserta form tambah/ubah/hapus akun satpam, di halaman Pengaturan. |
| `manager/stats/page.tsx` | Halaman Laporan: ringkasan aktivitas keluar-masuk per periode waktu, atau daftar penghuni yang sedang di dalam RTB — bisa diunduh sebagai CSV. |
| `manager/users/page.tsx` | Halaman Pengaturan: tabel seluruh penghuni & akunnya, kontrol master satpam, tombol unduh backup database, dan reset riwayat. |
| `page.tsx` | Halaman utama yang pertama kali dilihat pengunjung sebelum login. |
| `reset-password/manager/confirm/ManagerResetConfirmForm.tsx` | Form isi password baru, muncul setelah pengguna klik tautan reset dari email. |
| `reset-password/manager/confirm/page.tsx` | Halaman tujuan tautan reset password dari email, memuat form isi password baru. |
| `reset-password/manager/ManagerResetRequestForm.tsx` | Form minta tautan reset password: isi ID BCA, tautan dikirim ke email yang sudah terdaftar untuk akun itu. |
| `reset-password/manager/page.tsx` | Halaman awal reset password Pengelola, memuat form permintaan tautan reset. Mahasiswa dan Satpam tidak punya reset mandiri, harus menghubungi Pengelola langsung. |
| `security/outside/page.tsx` | Halaman Riwayat Satpam: daftar validasi keluar-masuk, bisa difilter — tampilannya sama dengan Riwayat Pengelola. |
| `security/page.tsx` | Halaman utama Validasi Satpam: memindai atau memasukkan kode izin, lalu menampilkan detailnya untuk diputuskan. |
| `security/profile/page.tsx` | Halaman Profil Satpam: data akun, hanya bisa dilihat — perubahan data dilakukan oleh Pengelola. |
| `security/QrScanner.tsx` | Bagian yang membaca QR lewat kamera perangkat, lalu memberi tahu kode yang berhasil terbaca. |
| `security/ValidatePermit.tsx` | Jendela pop-up yang menampilkan detail satu pengajuan izin (nama, kamar, tujuan, jadwal) beserta tombol setuju/tolak untuk satpam. |
| `student/ActivePermitCard.tsx` | Tampilan kartu QR/kode izin yang sedang berlaku, beserta tombol batalkan pengajuan. |
| `student/apply/page.tsx` | Halaman Ajukan Izin: menampilkan form pengajuan baru, atau kartu QR kalau sedang menunggu keputusan/izin sedang aktif. |
| `student/history/page.tsx` | Halaman Riwayat pribadi mahasiswa: lima aktivitas keluar-masuk terakhir. |
| `student/page.tsx` | Halaman Beranda Mahasiswa: ringkasan status hunian (di dalam/luar RTB) saat ini. |
| `student/permit/page.tsx` | Alamat lama, otomatis mengarahkan ke halaman Ajukan Izin. |
| `student/PermitForm.tsx` | Form pengajuan izin keluar, atau form konfirmasi kembali ke RTB — satu file dipakai untuk kedua mode. |
| `student/profile/page.tsx` | Halaman Profil Mahasiswa: data akun, memuat form ubah kamar/WA/email. |
| `student/StudentContactForm.tsx` | Form ubah kamar, nomor WA, dan email milik sendiri. |
| `student/StudentPermitDecisionWatcher.tsx` | Pengecekan otomatis di halaman Ajukan Izin, untuk memunculkan pemberitahuan singkat begitu satpam baru saja memutuskan izinnya (disetujui/ditolak). |

## `components/` — Bagian tampilan yang dipakai bersama di banyak halaman

| File | Fungsinya |
| --- | --- |
| `AppShell.tsx` | Bingkai halaman setelah login: menu samping, navigasi sesuai peran pengguna, dan bagian atas halaman (ikon tema & notifikasi). |
| `AuthShell.tsx` | Bingkai halaman untuk layar sebelum login (login, reset password). |
| `Brand.tsx` | Logo SIKAT RTB — digambar langsung lewat kode (bukan file gambar terpisah), supaya tetap tajam di ukuran layar berapa pun. |
| `FormModal.tsx` | Kerangka jendela pop-up form yang dipakai banyak halaman (tambah/ubah data, dll), sudah termasuk pengaturan supaya tombol Tab di keyboard tidak "bocor" keluar dari pop-up saat sedang terbuka. |
| `HistoryFilters.tsx` | Kontrol filter (wing, kelas, jangka waktu) untuk halaman Riwayat. |
| `LiveRefresh.tsx` | Tanda kecil "LIVE" yang membuat halaman memuat ulang datanya sendiri secara berkala tanpa perlu di-refresh manual (dipakai di Dashboard Pengelola). |
| `LoginModal.tsx` | Jendela pop-up form login yang bisa dibuka dari halaman utama. |
| `MobileProfileLogout.tsx` | Tombol keluar akun yang cuma muncul di layar HP (di layar komputer, tombolnya sudah ada di menu samping). |
| `NotificationCenter.tsx` | Ikon lonceng notifikasi beserta pop-up isinya (khusus Mahasiswa & Pengelola — Satpam tidak punya notifikasi, lihat README §9). |
| `PasswordField.tsx` | Kotak isian password dengan ikon mata untuk menampilkan/menyembunyikan tulisan — dipakai di semua form password di aplikasi ini. |
| `PermitHistoryList.tsx` | Tampilan daftar riwayat validasi izin. |
| `PermitHistoryPage.tsx` | Bingkai halaman Riwayat lengkap (filter + daftar) — dipakai bersama oleh halaman Riwayat Satpam dan Pengelola supaya tampilannya identik. |
| `PermitQr.tsx` | Tampilan QR izin milik mahasiswa, termasuk perlindungan ringan dari screenshot (gambar jadi buram saat tab sedang tidak aktif, dll). |
| `SplashScreen.tsx` | Animasi logo singkat yang muncul sekali saat aplikasi pertama kali dibuka. |
| `ThemeProvider.tsx` | Pengaturan mode tampilan Terang/Gelap/Ikuti sistem untuk seluruh aplikasi. |
| `ThemeToggle.tsx` | Tombol untuk mengganti mode tampilan tersebut. |
| `useFocusTrap.ts` | Fungsi bantu yang dipakai `FormModal`, `NotificationCenter`, dan `LoginModal` supaya saat pop-up terbuka, tombol Tab di keyboard tetap berputar di dalam pop-up saja. |

## `data/` — Database (tidak ikut disimpan di git)

| File | Fungsinya |
| --- | --- |
| `.gitkeep` | File kosong, satu-satunya isi folder ini yang sengaja tetap disimpan di git — supaya folder `data/` tetap ada walau file database di dalamnya diabaikan git. |
| `sikat.db` | File database utama untuk pengembangan di komputer ini. Isinya data sungguhan (penghuni, izin, dll) yang bisa beda-beda di tiap komputer, makanya sengaja tidak ikut disimpan di git (lihat `.gitignore`). |
| `sikat.db-shm`, `sikat.db-wal` | File pendukung sementara yang dibuat otomatis saat aplikasi berjalan. Tidak perlu diurus manual, ikut diabaikan git seperti `sikat.db`. |

## `docs/` — Dokumentasi (bukan bagian aplikasi yang berjalan)

| File/folder | Fungsinya |
| --- | --- |
| `basis-data/` | Bahan untuk BAB III proposal (Perancangan Basis Data Relasional): diagram hubungan antar tabel (ER) beserta penjelasannya. |
| `database/` | Skema database siap pakai (`schema.sql`) untuk memindahkan struktur database ini ke MySQL/cPanel. |
| `diagrams/` | Data Flow Diagram dan flowchart alur tiap peran (Mahasiswa, Satpam, Pengelola) — format PDF, sudah disetujui dosen pembimbing. |
| `dokumen-proyek/` | Dokumen proyek/laporan (folder ini sendiri): penjelasan fitur & keamanan aplikasi, dan file penjelasan ini. |
| `README.md` | Peta singkat isi folder `docs/`, menunjuk ke dokumen yang lebih lengkap (README utama dan file penjelasan ini). |

## `lib/` — Aturan dan logika inti (bukan tampilan)

| File | Fungsinya |
| --- | --- |
| `auth.ts` | Mengatur login dan status "sedang login": membuat kode sesi rahasia saat login berhasil, memeriksa kode itu tiap kali ada permintaan ke server, memastikan hanya peran yang berhak yang bisa membuka suatu halaman, dan mendeteksi percobaan login bertubi-tubi dari alamat yang sama supaya bisa dibatasi otomatis (mencegah tebak-tebak password). |
| `db.test.ts` | Pengujian otomatis untuk `db.ts` — bagian terbesar dari seluruh pengujian project. |
| `db.ts` | Inti aplikasi: seluruh akses ke database dan aturan bisnisnya (validasi wing/kamar, alur izin keluar-masuk, pembatasan percobaan, catatan riwayat aktivitas, dll). File terbesar dan terpenting di project ini. |
| `email.ts` | Pengiriman email otomatis (izin disetujui/ditolak, pengumuman, dll) lewat layanan pengirim email bernama Resend. |
| `excel-import.ts` | Pembaca file Excel (`.xlsx`) untuk fitur impor data penghuni secara massal. |
| `qr.ts` | Pembuat gambar QR dari kode izin, untuk dipindai satpam di gerbang. |
| `ui.ts` | Kumpulan fungsi bantu tampilan yang dipakai berulang-ulang (format tanggal ke zona waktu Jakarta, label status izin, dll). |
| `whatsapp.ts` | Kode pengiriman WhatsApp — sudah ditulis lengkap tapi sengaja tidak diaktifkan (lihat README §10a), disimpan untuk kemungkinan dipakai lagi di masa depan. |
| `wings.test.ts` | Pengujian otomatis untuk `wings.ts`. |
| `wings.ts` | Daftar wing/gedung asrama beserta aturan jenis kelamin masing-masing. |

## `public/`

Folder standar untuk gambar/ikon yang disajikan langsung apa adanya. Saat ini kosong — logo aplikasi digambar langsung lewat kode (`components/Brand.tsx`), jadi belum ada file gambar yang perlu disimpan di sini.

## `scripts/` — Perintah yang dijalankan lewat terminal (bukan lewat tampilan aplikasi)

| File | Fungsinya |
| --- | --- |
| `export-mysql.ts` | Mengubah database jadi format yang bisa dipindahkan ke MySQL — dipakai kalau suatu saat pindah dari database lokal ke MySQL/cPanel. |
| `reset-db.ts` | Mengosongkan seluruh isi database lokal, lewat terminal (`pnpm db:reset`). |
| `reset-history.ts` | Mengosongkan riwayat izin saja, lewat terminal (`pnpm db:reset-history`) — versi terminal dari tombol Reset Riwayat di halaman Pengaturan. |
| `restore-db.ts` | Memulihkan database dari file backup, lewat terminal (`pnpm db:restore`). |

## `test/` — Perlengkapan tambahan supaya pengujian otomatis bisa berjalan

| File | Fungsinya |
| --- | --- |
| `stubs/server-only.ts` | Pengganti kosong untuk satu penanda khusus di kode (`import "server-only"`) yang dipakai supaya sebagian kode hanya boleh berjalan di server. Penanda ini cuma dikenali aplikasi saat berjalan sungguhan, sedangkan alat pengujian otomatis tidak — file ini membuat alat pengujian tetap bisa membaca kode tersebut tanpa error. |

## `types/` — Catatan bentuk data untuk tiga komponen yang dipakai

| File | Fungsinya |
| --- | --- |
| `barcode-detector.d.ts`, `bcryptjs.d.ts`, `better-sqlite3.d.ts` | Memberi tahu alat bantu penulisan kode bagaimana bentuk data dari tiga komponen ini, karena komponennya sendiri tidak menyediakan info itu secara lengkap. File ini murni membantu proses penulisan kode, tidak memengaruhi jalannya aplikasi untuk pengguna akhir. |
