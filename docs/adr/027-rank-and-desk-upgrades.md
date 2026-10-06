# ADR 027 — Pangkat karier dan upgrade meja

- Status: diterima · 6 Oktober 2026

## Konteks

Pemilik menilai game "kurang progres/hadiah". Gaji sudah ada (PRD M7), tapi setelah alat terbeli
dompet menumpuk tanpa bisa dipakai (sudah dicatat di ADR 017). Pemilik memilih: gaji/koin per shift,
upgrade meja, dan pangkat dari Junior sampai Senior.

## Keputusan

- **Pangkat per mode** (`engine/rank.ts`): Magang → Junior → Menengah → Senior → Lead. Pangkat
  **dihitung** dari shift jalur utama yang selesai, tidak disimpan. Untuk 5 shift: 0, 1, 3, 4, 5 shift.
  Syarat bintang sempat dipertimbangkan, tapi Mode Latihan tidak mengubah progres (PRD S5), jadi
  syarat bintang di shift yang sudah lewat tidak akan pernah bisa dikejar lagi. Judul pangkat ada di
  `mode.json` (`ranks`, 5 judul per bahasa).
- **Tunjangan pangkat**: +Rp 10 per tingkat per shift (Rp 0–40), ditambahkan ke gaji shift.
- **Upgrade meja** (`upgrades.json` per mode, dibeli dengan dompet mode itu). Efeknya hanya tiga jenis:
  `cosmetic` (dipajang di meja), `free-hints` (petunjuk gratis per kasus, maks. 3), dan `shift-time`
  (tambahan durasi shift 5–25%). Keuntungannya kecil dan tidak mengganti belajar: petunjuk tetap
  berisi materi, dan waktu tambahan membantu pemula yang mengetik di HP. Sebagian upgrade baru bisa
  dibeli di pangkat tertentu (`requiresRank`).
- **Keuntungan dicatat di sesi saat shift dimulai** (`ShiftSession.perks`: `freeHints`, `payBonus`,
  `shiftTimePercent`). Engine tetap murni dan shift yang dilanjutkan memakai nilai yang sama, walau
  pemain membeli upgrade di tengah jalan. Sesi lama tanpa `perks` memakai nilai bawaan (1, 0, 0).
- **Save v11**: `modes[id].upgradesOwned: string[]` (migrasi mengisi `[]`) dan `perks?` di sesi.
- Laporan shift merayakan kenaikan pangkat. Animasinya hanya fade + geser, tanpa scale, supaya
  elemen selebar layar tidak memperlebar halaman di HP.

## Akibat

- Harga upgrade (total Rp 600 per mode) sengaja lebih besar dari sisa gaji rata-rata satu jalur
  utama, jadi pemain harus memilih. Simulasi `pnpm sim:economy` belum memodelkan pembelian upgrade.
- Mode baru wajib menyediakan `ranks` di `mode.json`. `upgrades.json` opsional.
