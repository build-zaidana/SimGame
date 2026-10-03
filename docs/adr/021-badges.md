# ADR 021 — Lencana (PRD C3)

- Status: diterima · 3 Oktober 2026

## Konteks

Pemilik meminta fitur berikutnya; lencana (C3) memberi tujuan tambahan yang mendorong kebiasaan
analis yang baik (teliti, seimbang, mandiri) dan alasan untuk bermain lebih baik.

## Keputusan

- **Konten** `content/<lang>/modes/<mode>/badges.json`: `id`, `title`, `description`, `icon`,
  `tier` (perunggu/perak/emas), dan `rule`. Jenis aturan tetap (skema zod): `shift-complete`,
  `shift-stars`, `no-threat-allowed`, `no-legit-blocked`, `evidence-streak`, `no-hints`,
  `review-perfect`, `tools-owned`, `trust-at-least`. `content:check` memeriksa ID ganda, shift
  yang dirujuk, dan jumlah alat yang mungkin.
- **Engine** `badges.ts`: `badgeEarned` / `newBadges` murni dan teruji. Aturan "tanpa kesalahan"
  memakai `minStars` agar tidak bisa didapat dengan asal klik (mengizinkan semua kasus berarti
  tidak ada yang sah terblokir; test e2e menemukan celah ini).
- **Save v4**: `modes[mode].badges: Record<badgeId, waktu ISO>`; migrasi v3→v4 menambah peta kosong.
- Lencana dinilai saat shift disimpan (jalur utama saja, bukan Mode Latihan) dan setelah membeli alat.
- **UI**: banner "Lencana baru!" di kantor (bukan modal, agar tidak menghalangi), tombol
  "Lencana (n/total)", dan layar koleksi dengan medali pixel 20×24 dari kode. Lencana yang belum
  didapat tetap terlihat beserta caranya.

## Konsekuensi

- Judul & deskripsi lencana adalah draf konten untuk direview pemilik.
- Mode baru cukup menambah `badges.json`; aturan baru butuh perubahan engine + skema.
