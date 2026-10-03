# ADR 013 — Keputusan teknis M4 (poles & rilis)

- Status: diterima · 3 Oktober 2026 · M4

## Aset visual dibuat sendiri, bukan pack pihak ketiga

Ilustrasi kantor (SVG pixel 64×36), ikon aplikasi, dan efek suara (WebAudio) dibuat untuk proyek ini,
sehingga tidak ada risiko lisensi dan ukuran tetap kecil. Font memakai Pixelify Sans dan Atkinson
Hyperlegible (OFL, self-host, subset latin). Semuanya dicatat di `public/assets/CREDITS.md`. Pack CC0
(mis. Kenney) tetap boleh ditambahkan nanti dengan mencatatnya di sana.

## Telemetri lokal aktif secara default

`SessionReportTelemetry` mencatat event belajar (maks. 500) **hanya di perangkat** untuk layar tersembunyi
Laporan Belajar (ketuk logo 5×). Tidak ada data yang dikirim; analitik anonim yang mengirim data (PRD S6)
belum dibangun dan tetap mati. `VITE_TELEMETRY=none` mematikan pencatatan lokal. Penyimpanan log memakai
`persistence/EventLogStore.ts` (aturan lapisan: IndexedDB hanya di `persistence/`).

## CSP ketat + zod tanpa JIT

`public/_headers` (Cloudflare) dan `vercel.json` memakai `script-src 'self'` tanpa `unsafe-eval`.
Zod v4 mencoba `new Function` untuk JIT dan memicu laporan pelanggaran CSP, jadi `z.config({ jitless: true })`
dipasang di modul pertama (`src/zodConfig.ts`). `e2e/csp.spec.ts` memainkan game dengan CSP yang dibaca
langsung dari `public/_headers` dan gagal bila ada pelanggaran.

## PWA

`vite-plugin-pwa` dengan `registerType: 'prompt'`: versi baru hanya dipasang saat pemain menekan "Muat
ulang". Toast tidak tampil di meja kerja dan diletakkan di atas layar supaya tidak menutupi tombol aksi.
Toast "siap offline" sengaja tidak dipakai karena menutupi tombol bawah. Precache: shell, font woff2, ikon,
dan chunk mode SOC (konten ada di dalamnya), ±700 KiB.

## Layout tablet

768–1023 px: Dokumen + Panduan dua kolom, Antrian menjadi laci (tombol dengan `aria-expanded`, tutup lewat
latar, Escape, atau setelah memilih kasus), sesuai §9.2.

## Ditunda

- ~~PRD S5 (Mode Latihan)~~: selesai, lihat ADR 014.
- PRD S6 (analitik anonim yang mengirim data): butuh endpoint & tinjauan UU PDP.
- Deploy publik: konfigurasi siap (`docs/DEPLOY.md`), butuh akun Cloudflare/Vercel milik pemilik.
