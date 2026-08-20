# Penjelasan seluruh file — SIKAT RTB

Peta tiap file/folder di project ini dan fungsinya, bahasa awam (non-teknis). Menggantikan versi Word sebelumnya yang sudah basi (masih menyebut folder `cpanel-landing/` yang sudah lama dihapus dari project). Kalau ada file baru yang ditambahkan di kemudian hari dan belum tercatat di sini, tambahkan saja — dokumen ini seharusnya selalu mengikuti isi project yang sebenarnya.

## File konfigurasi di root

| File | Fungsinya |
| --- | --- |
| `package.json` | Daftar semua library yang dipakai project, dan daftar perintah singkat (`pnpm dev`, `pnpm build`, `pnpm test`, dst). |
| `pnpm-lock.yaml` | Catatan versi persis setiap library, dibuat otomatis — jangan diedit manual. |
| `pnpm-workspace.yaml` | Pengaturan tambahan untuk pnpm (izin instalasi library yang perlu proses build native). |
| `next.config.ts` | Pengaturan Next.js: header keamanan (mencegah clickjacking, dll), pengaturan lain saat build. |
| `tsconfig.json` | Pengaturan bahasa TypeScript yang dipakai seluruh kode. |
| `eslint.config.mjs` | Aturan pengecekan kualitas kode otomatis (`pnpm lint`). |
| `postcss.config.mjs` | Pengaturan pemroses CSS untuk Tailwind. |
| `vitest.config.mts` | Pengaturan untuk menjalankan test otomatis (`pnpm test`). |
| `next-env.d.ts` | Dibuat otomatis oleh Next.js, jangan diedit manual. |
| `.env.example` | Contoh isi variabel rahasia/konfigurasi (`SESSION_SECRET`, dll) — bukan nilai asli, aman disimpan di git. |
| `.env.local` | Nilai asli variabel rahasia untuk komputer lokal — **tidak** disimpan di git. |
| `.gitignore` | Daftar file/folder yang sengaja tidak ikut disimpan di git (contoh: `node_modules`, database lokal). |
| `README.md` | Dokumentasi teknis utama: arsitektur, cara setup, keamanan, deployment. Sumber kebenaran paling lengkap. |

## `app/` — Halaman & alur (Next.js App Router)

Struktur folder di `app/` menentukan alamat URL-nya langsung, jadi susunannya tidak bisa diubah bebas.

| File/folder | Fungsinya |
| --- | --- |
| `actions.ts` | Kumpulan seluruh aksi yang dipanggil dari form/tombol di seluruh aplikasi (login, ganti password, ajukan izin, validasi satpam, kelola data pengelola, dll) — logic sebenarnya ada di `lib/db.ts`, file ini yang menjembatani form ke logic tersebut. |
| `actions.test.ts` | Test otomatis untuk sebagian `actions.ts` (kebijakan ganti password per peran). |
| `layout.tsx` | Bingkai halaman paling luar — memuat font, tema, dan splash screen. |
| `loading.tsx` | Layar loading singkat saat halaman pertama kali dibuka. |
| `globals.css` | Definisi warna, radius, dan gaya visual yang dipakai di seluruh aplikasi (termasuk mode gelap). |
| `page.tsx` | Landing page publik (sebelum login). |
| `activate/page.tsx` | Alamat pintasan lama yang otomatis mengarahkan ke landing page dengan form login terbuka. |
| `login/` | Halaman & form login. |
| `change-password/` | Halaman ganti password wajib saat login pertama. |
| `reset-password/` | Reset password Pengelola lewat email (`manager/`) — Mahasiswa dan Satpam tidak punya reset mandiri, harus lewat Pengelola langsung. |
| `api/backup/route.ts` | Endpoint unduh salinan database (khusus Pengelola). |
| `api/notifications/route.ts` | Endpoint ambil daftar notifikasi & tandai sudah dibaca. |
| `api/reports/daily.csv/route.ts` | Endpoint unduh laporan dalam bentuk CSV. |
| `api/student/permit-status/route.ts` | Endpoint yang dicek berkala oleh halaman mahasiswa untuk tahu kalau izinnya baru saja diputuskan satpam. |
| `api/student/current-permit-code/route.ts` | Endpoint yang di-polling tiap 15 detik oleh halaman mahasiswa untuk mengambil QR/kode izin yang sedang berlaku saat itu (QR/kode berputar tiap 15 detik, anti-screenshot — lihat README §10). |
| `student/` | Seluruh halaman & komponen khusus Mahasiswa: beranda, ajukan izin, QR aktif, riwayat, profil. |
| `security/` | Seluruh halaman & komponen khusus Satpam: validasi (scan/kode), riwayat, profil. |
| `manager/` | Seluruh halaman & komponen khusus Pengelola: dashboard, master penghuni/satpam, broadcast, laporan, pengaturan, profil. |

## `components/` — Komponen yang dipakai lintas peran

| File | Fungsinya |
| --- | --- |
| `AppShell.tsx` | Bingkai halaman setelah login: sidebar, menu navigasi per peran, header (ikon tema & notifikasi). |
| `AuthShell.tsx` | Bingkai halaman untuk layar sebelum login (login, reset password). |
| `Brand.tsx` | Logo SIKAT RTB (digambar sebagai SVG langsung di kode, bukan file gambar terpisah). |
| `FormModal.tsx` | Kerangka popup form yang dipakai banyak halaman (tambah/edit data, dll) — sudah termasuk penguncian fokus keyboard di dalam popup. |
| `useFocusTrap.ts` | Fungsi bantu yang dipakai `FormModal`, `NotificationCenter`, dan `LoginModal` supaya saat popup terbuka, tombol Tab di keyboard tetap berputar di dalam popup, tidak "bocor" ke halaman di belakangnya. |
| `LoginModal.tsx` | Popup form login yang bisa dibuka dari landing page. |
| `NotificationCenter.tsx` | Ikon lonceng notifikasi beserta popup isinya (Mahasiswa & Pengelola saja — Satpam tidak punya, lihat README §9 model data). |
| `HistoryFilters.tsx` | Kontrol filter (wing, kelas, jangka waktu) untuk halaman Riwayat. |
| `PermitHistoryList.tsx` / `PermitHistoryPage.tsx` | Tampilan daftar riwayat validasi izin — dipakai bersama oleh halaman Riwayat Satpam dan Pengelola supaya keduanya identik. |
| `PermitQr.tsx` | Tampilan QR izin mahasiswa, termasuk proteksi ringan dari screenshot (blur saat tab tidak aktif, dll). |
| `PasswordField.tsx` | Input password dengan ikon mata untuk tampilkan/sembunyikan isian — dipakai di semua form password (login, ganti password, password awal penghuni/satpam, reset password Pengelola). |
| `LiveRefresh.tsx` | Badge kecil "LIVE" yang bikin halaman me-refresh data otomatis tiap beberapa detik (dipakai Dashboard Pengelola). |
| `MobileProfileLogout.tsx` | Tombol keluar akun yang cuma muncul di layar HP (sidebar desktop sudah punya tombolnya sendiri). |
| `SplashScreen.tsx` | Animasi logo singkat sekali saat aplikasi pertama kali dimuat. |
| `ThemeProvider.tsx` / `ThemeToggle.tsx` | Pengaturan & tombol ganti mode Terang/Gelap/Ikuti sistem. |

## `lib/` — Logic murni (bukan tampilan)

| File | Fungsinya |
| --- | --- |
| `db.ts` | Inti aplikasi: akses database, seluruh aturan bisnis (validasi wing/kamar, siklus izin, rate limit, audit log, dll). File terbesar dan terpenting di project ini. |
| `db.test.ts` | Test otomatis untuk `db.ts` — bagian terbesar dari test suite project. |
| `auth.ts` | Login/sesi: pembuatan token sesi (JWT), pengecekan sesi & peran di server, deteksi IP untuk rate limit. |
| `email.ts` | Pengiriman email otomatis (izin disetujui/ditolak, broadcast, dll) lewat layanan Resend. |
| `whatsapp.ts` | Kode pengiriman WhatsApp lewat Meta Cloud API — ada di kode tapi sengaja tidak aktif (lihat README §10a), disimpan untuk kemungkinan diaktifkan lagi nanti. |
| `excel-import.ts` | Pembaca file `.xlsx` untuk fitur impor massal data penghuni. |
| `qr.ts` | Pembuat gambar QR (format SVG) dari kode izin. |
| `wings.ts` | Daftar wing/lantai asrama beserta aturan jenis kelaminnya. |
| `wings.test.ts` | Test otomatis untuk `wings.ts`. |
| `ui.ts` | Kumpulan fungsi bantu tampilan yang dipakai berulang (format tanggal ke zona waktu Jakarta, label status, dll). |

## `types/` — Deklarasi tipe untuk library tanpa tipe bawaan

| File | Fungsinya |
| --- | --- |
| `bcryptjs.d.ts`, `better-sqlite3.d.ts`, `barcode-detector.d.ts` | Memberi tahu TypeScript bentuk data dari library-library ini, karena library-nya sendiri tidak menyediakan definisi tipe resmi/lengkap. |

## `scripts/` — Perintah baris-perintah (CLI)

| File | Fungsinya |
| --- | --- |
| `reset-db.ts` | Mengosongkan database lokal (`pnpm db:reset`). |
| `reset-history.ts` | Mengosongkan riwayat izin saja, dari terminal (`pnpm db:reset-history`) — versi command-line dari tombol Reset Riwayat di halaman Pengaturan. |
| `restore-db.ts` | Memulihkan database dari file backup (`pnpm db:restore`). |
| `export-mysql.ts` | Mengubah database jadi format yang bisa diimpor ke MySQL — dipakai kalau suatu saat pindah dari SQLite ke MySQL/cPanel. |

## `test/` — Perlengkapan test

| File | Fungsinya |
| --- | --- |
| `stubs/server-only.ts` | Pengganti kosong untuk penanda `import "server-only"`, supaya kode yang memakainya bisa tetap dites lewat Vitest (Vitest tidak paham penanda itu, hanya Next.js yang paham). |

## `docs/` — Dokumentasi (bukan bagian aplikasi yang berjalan)

| Folder | Fungsinya |
| --- | --- |
| `diagrams/` | Data Flow Diagram dan flowchart alur tiap peran (Mahasiswa, Satpam, Pengelola). |
| `database/` | Skema database siap pakai (`schema.sql`) untuk migrasi ke MySQL/cPanel, plus penjelasan tiap tabel. |
| `basis-data/` | Bahan siap pakai untuk BAB III proposal (Perancangan Basis Data Relasional): dokumen Word lengkap dengan SQL, dan diagram ER. |
| `dokumen-proyek/` | Dokumen proyek/laporan (folder ini sendiri) — termasuk file penjelasan ini. |

## `data/` — Database (tidak ikut disimpan di git)

Berisi file database SQLite (`sikat.db`) untuk pengembangan lokal. Isinya sengaja tidak disimpan di git (lihat `.gitignore`) karena berisi data yang berubah terus dan bisa berbeda-beda di tiap komputer/lingkungan.

## `public/`

Folder standar Next.js untuk aset statis (gambar, ikon). Saat ini kosong — logo aplikasi digambar langsung sebagai SVG di kode (`components/Brand.tsx`), jadi belum ada aset statis yang perlu disimpan di sini.
