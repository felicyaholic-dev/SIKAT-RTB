<?php
require __DIR__ . '/config.php';

$stats = ['residents' => null, 'permits' => null, 'staff' => null];

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $stats['residents'] = (int) $pdo->query("SELECT COUNT(*) FROM master_residents WHERE resident_status = 'ACTIVE'")->fetchColumn();
    $stats['permits'] = (int) $pdo->query("SELECT COUNT(*) FROM permits")->fetchColumn();
    $stats['staff'] = (int) $pdo->query("SELECT COUNT(*) FROM security_staff WHERE staff_status = 'ACTIVE'")->fetchColumn();
} catch (Throwable $e) {
    // Kredensial belum diisi atau data belum diimpor — halaman tetap tampil tanpa statistik.
}

function stat_value($value) {
    return $value === null ? '—' : number_format($value, 0, ',', '.');
}
?>
<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SIKAT RTB — Sistem Izin Keluar-Masuk Terintegrasi</title>
<style>
  :root {
    --bg: #0b1120;
    --surface: #111a2e;
    --surface-2: #16213a;
    --border: #22304d;
    --text: #e8edf7;
    --text-muted: #93a2c2;
    --accent: #4f7cff;
    --accent-2: #22c55e;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
  header.hero {
    padding: 96px 0 64px;
    text-align: center;
    border-bottom: 1px solid var(--border);
  }
  .badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(79, 124, 255, 0.15);
    color: var(--accent);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 20px;
  }
  h1 {
    font-size: clamp(32px, 5vw, 52px);
    margin: 0 0 16px;
    font-weight: 800;
  }
  .lede {
    max-width: 620px;
    margin: 0 auto;
    color: var(--text-muted);
    font-size: 18px;
  }
  section { padding: 64px 0; }
  section + section { border-top: 1px solid var(--border); }
  h2 {
    font-size: 28px;
    margin: 0 0 8px;
    text-align: center;
  }
  .section-sub {
    text-align: center;
    color: var(--text-muted);
    margin: 0 0 40px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
  }
  .card h3 { margin: 0 0 8px; font-size: 17px; }
  .card p { margin: 0; color: var(--text-muted); font-size: 14px; }
  .icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: rgba(79, 124, 255, 0.15);
    color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    margin-bottom: 14px;
  }
  .roles { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .role-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
  }
  .role-card .tag {
    font-size: 12px;
    color: var(--accent-2);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .role-card h3 { margin: 8px 0 10px; }
  .role-card ul { margin: 0; padding-left: 18px; color: var(--text-muted); font-size: 14px; }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
  }
  .stat {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 28px 20px;
    text-align: center;
  }
  .stat .value { font-size: 36px; font-weight: 800; color: var(--accent); }
  .stat .label { color: var(--text-muted); font-size: 14px; margin-top: 6px; }
  footer {
    padding: 32px 0;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
    border-top: 1px solid var(--border);
  }
</style>
</head>
<body>

<header class="hero">
  <div class="wrap">
    <span class="badge">SIKAT RTB</span>
    <h1>Sistem Izin Keluar-Masuk Terintegrasi</h1>
    <p class="lede">Satu alur digital untuk penghuni Rumah Talenta BCA (RTB): ajukan izin, validasi di gerbang, dan pantau status secara langsung — tanpa pencatatan manual yang tersebar.</p>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>Fitur utama</h2>
    <p class="section-sub">Dibangun untuk mempercepat proses keluar-masuk sekaligus menjaga jejak audit yang jelas.</p>
    <div class="grid">
      <div class="card">
        <div class="icon">▦</div>
        <h3>Izin berbasis QR</h3>
        <p>Setiap pengajuan izin menghasilkan kode &amp; QR unik yang divalidasi cepat oleh satpam di pos.</p>
      </div>
      <div class="card">
        <div class="icon">✆</div>
        <h3>Notifikasi WhatsApp</h3>
        <p>Penghuni menerima update otomatis saat izin disetujui, ditolak, atau saat konfirmasi masuk.</p>
      </div>
      <div class="card">
        <div class="icon">◔</div>
        <h3>Dashboard real-time</h3>
        <p>Pengelola langsung melihat siapa saja yang sedang berada di luar RTB, tanpa perlu rekap manual.</p>
      </div>
      <div class="card">
        <div class="icon">⌘</div>
        <h3>Akses berbasis peran</h3>
        <p>Mahasiswa, satpam, dan pengelola masing-masing melihat tampilan sesuai kebutuhan dan wewenangnya.</p>
      </div>
      <div class="card">
        <div class="icon">≡</div>
        <h3>Riwayat teraudit</h3>
        <p>Setiap perubahan status izin tercatat dan dapat ditelusuri kembali kapan saja.</p>
      </div>
      <div class="card">
        <div class="icon">⇪</div>
        <h3>Impor data massal</h3>
        <p>Pengelola dapat mengimpor data penghuni dari Excel sekaligus, dengan validasi per baris.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Tiga peran, satu sistem</h2>
    <p class="section-sub">Hak akses ditentukan oleh akun, bukan dipilih sendiri saat login.</p>
    <div class="roles">
      <div class="role-card">
        <span class="tag">Mahasiswa</span>
        <h3>Penghuni</h3>
        <ul>
          <li>Mengajukan izin keluar</li>
          <li>Melihat QR izin aktif</li>
          <li>Melacak riwayat izin pribadi</li>
        </ul>
      </div>
      <div class="role-card">
        <span class="tag">Satpam</span>
        <h3>Petugas gerbang</h3>
        <ul>
          <li>Memindai QR / kode izin</li>
          <li>Konfirmasi keluar &amp; masuk</li>
          <li>Melihat daftar penghuni di luar</li>
        </ul>
      </div>
      <div class="role-card">
        <span class="tag">Pengelola</span>
        <h3>Admin RTB</h3>
        <ul>
          <li>Mengelola data master penghuni</li>
          <li>Memantau kondisi RTB secara langsung</li>
          <li>Meninjau laporan &amp; pengaturan</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Ringkasan data</h2>
    <p class="section-sub">Diambil langsung dari database SIKAT RTB.</p>
    <div class="stats">
      <div class="stat">
        <div class="value"><?= stat_value($stats['residents']) ?></div>
        <div class="label">Penghuni aktif</div>
      </div>
      <div class="stat">
        <div class="value"><?= stat_value($stats['permits']) ?></div>
        <div class="label">Total izin diproses</div>
      </div>
      <div class="stat">
        <div class="value"><?= stat_value($stats['staff']) ?></div>
        <div class="label">Petugas satpam aktif</div>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    &copy; <?= date('Y') ?> SIKAT RTB — Rumah Talenta BCA
  </div>
</footer>

</body>
</html>
