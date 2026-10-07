# ADR 030 — Tips onboarding di kantor

- Status: diterima · 7 Oktober 2026

## Konteks

Fitur bertambah banyak (pangkat, toko & upgrade, boss, tantangan harian, Mode Latihan), dan pemula
bisa tidak sadar fitur-fitur itu ada. Pemilik memilih "onboarding pemain baru".

## Keputusan

- **Kartu tips, satu per satu, saat relevan**, bukan tur panjang di awal. Pemula langsung bisa main
  (PRD: sesi pendek, langsung main). Urutan: selamat datang → pangkat → tantangan harian → toko (saat
  gaji ≥ harga upgrade termurah) → Mode Latihan. Tips setelah shift pertama baru muncul setelah ada
  shift jalur utama yang selesai.
- Logika murni di `src/app/onboarding.ts` (`nextTip`, `dismissTip`, `skipAllTips`, `resetTips`) dengan
  unit test. Status disimpan di `save.flags` (`tip:<id>`), jadi **bentuk save tidak berubah** (tanpa
  migrasi).
- Kartu bisa ditutup ("Mengerti") atau semuanya dilewati; Pengaturan punya "Tampilkan tips lagi".
- Kartu tidak menutupi apa pun (bagian dari alur halaman, bukan overlay) dan tombolnya ≥ 44 px.
- Tips tidak memakai tombol pintasan ke layar lain, supaya nama tombolnya tidak bentrok dengan tombol
  menu yang sudah ada (mis. "Pengaturan", "Toko & Upgrade").
