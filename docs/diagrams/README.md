# Diagram SIKAT RTB

Diturunkan langsung dari kode yang berjalan saat ini (schema database + server actions), bukan dari rencana awal.

- **[dfd.md](dfd.md)** — Data Flow Diagram Level 0 (konteks) dan Level 1, mencakup seluruh 9 tabel data operasional dan kedua kanal notifikasi (WhatsApp + Email).
- **[flowchart-mahasiswa.md](flowchart-mahasiswa.md)** — alur penghuni: login, ajukan izin, sampai kembali ke RTB, dan edit kontak sendiri.
- **[flowchart-satpam.md](flowchart-satpam.md)** — alur petugas keamanan: validasi QR/kode di gerbang, riwayat gabungan seluruh satpam.
- **[flowchart-pengelola.md](flowchart-pengelola.md)** — alur pengelola: kelola data master, broadcast, laporan, reset riwayat tahunan.

Setiap flowchart dipisah per peran (bukan satu diagram gabungan) supaya masing-masing lebih mudah dibaca dan langsung relevan dengan tugas peran tersebut.
