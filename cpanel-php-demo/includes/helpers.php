<?php
/**
 * includes/helpers.php
 * ------------------------------------------------------------------
 * Kumpulan fungsi kecil yang dipakai berulang kali di banyak halaman:
 * membuat kode izin acak, menerjemahkan status ke Bahasa Indonesia,
 * dan memformat tanggal/jam.
 * ------------------------------------------------------------------
 */

// Membuat kode acak seperti "SKT-A1B2C" atau "SKM-9XZ7Q".
// Meniru format kode di aplikasi asli (lib/db.ts): prefix + 5 karakter acak.
function generateCode(string $prefix): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    for ($i = 0; $i < 5; $i++) {
        $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $prefix . '-' . $code;
}

// Token unik untuk kolom qr_token (di aplikasi asli dipakai untuk isi QR code).
// Di demo ini tidak benar-benar dipindai sebagai QR, tapi kolomnya tetap wajib
// diisi dan harus unik, jadi kita buat semacam UUID sederhana.
function generateQrToken(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function permitStatusLabel(string $status): string
{
    $labels = [
        'MENUNGGU_KELUAR' => 'Menunggu Keluar',
        'SEDANG_DI_LUAR'  => 'Sedang di Luar',
        'MENUNGGU_MASUK'  => 'Menunggu Masuk',
        'SELESAI'         => 'Selesai',
        'DIBATALKAN'      => 'Dibatalkan',
    ];
    return $labels[$status] ?? $status;
}

function permitStatusBadgeClass(string $status): string
{
    $classes = [
        'MENUNGGU_KELUAR' => 'badge badge-waiting',
        'SEDANG_DI_LUAR'  => 'badge badge-outside',
        'MENUNGGU_MASUK'  => 'badge badge-waiting',
        'SELESAI'         => 'badge badge-done',
        'DIBATALKAN'      => 'badge badge-cancelled',
    ];
    return $classes[$status] ?? 'badge';
}

function permitTypeLabel(string $type): string
{
    $labels = [
        'IZIN_PRIBADI'        => 'Izin Pribadi',
        'IZIN_AKADEMIK'       => 'Izin Akademik',
        'IZIN_KESEHATAN'      => 'Izin Kesehatan',
        'KEPERLUAN_KELUARGA'  => 'Keperluan Keluarga',
        'LAINNYA'             => 'Lainnya',
    ];
    return $labels[$type] ?? $type;
}

function eventTypeLabel(string $event): string
{
    $labels = [
        'EXIT_REQUESTED'  => 'Pengajuan Keluar',
        'EXIT'            => 'Keluar Disetujui',
        'EXIT_REJECTED'   => 'Keluar Ditolak',
        'ENTRY_REQUESTED' => 'Pengajuan Masuk',
        'ENTRY'           => 'Masuk Dikonfirmasi',
    ];
    return $labels[$event] ?? $event;
}

function formatDateTime(?string $value): string
{
    if (!$value) {
        return '-';
    }
    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return $value;
    }
    return date('d M Y H:i', $timestamp);
}

// Membersihkan input teks dari spasi berlebih sebelum ditampilkan sebagai HTML.
function h(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

// Menyimpan pesan flash (sukses/error) ke session lalu dibaca satu kali
// di halaman berikutnya. Dipakai supaya setelah form submit + redirect,
// pesan hasilnya masih bisa ditampilkan.
function setFlash(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash(): ?array
{
    if (empty($_SESSION['flash'])) {
        return null;
    }
    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}

function redirectTo(string $path): void
{
    header('Location: ' . $path);
    exit;
}
