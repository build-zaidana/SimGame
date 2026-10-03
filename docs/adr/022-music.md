# ADR 022 — Musik latar chiptune (PRD C2) dan font label keputusan

- Status: diterima · 3 Oktober 2026

## Konteks

PRD C2 (efek suara/musik chiptune) dan masukan pemilik agar game lebih menarik. Anggaran ukuran
(ARCHITECTURE §11) membuat file musik kurang cocok; efek suara sudah disintesis lewat WebAudio.

## Keputusan

- **Dikarang dari kode.** `app/music/compose.ts` (murni, teruji) menghasilkan not per bar:
  lagu **kantor** (C mayor, 84 bpm) dan **meja** (A minor, 100 bpm): bas, akor lembut, melodi
  pentatonik yang tetap per bar. Saat jam shift tersisa ≤ 20%, melodi lebih rapat dan hi-hat masuk
  (ketegangan ala Papers, Please).
- `app/music/player.ts` menjadwalkan bar sedikit ke depan (lookahead) dengan volume pelan dan fade
  saat berganti lagu. `useMusic` memilih lagu dari layar; diam di layar judul, saat jeda/briefing,
  dan saat tab disembunyikan.
- **Pengaturan "Musik latar"** terpisah dari "Efek suara". Save v5 menambah `settings.music`;
  migrasi v4→v5 mengikuti pilihan efek suara yang sudah ada.
- **Font label keputusan & stempel** memakai Atkinson Hyperlegible tebal (`font-stamp`), karena
  huruf Z di Pixelify Sans terbaca seperti angka 2 ("I2INKAN").

## Konsekuensi

- Tanpa file audio atau dependensi baru; bundel naik ±1,5 kB gzip.
- Lagu bisa ditambah dengan entri baru di `TRACKS` (mis. lagu khusus serangan Kelabu di Shift 5).
