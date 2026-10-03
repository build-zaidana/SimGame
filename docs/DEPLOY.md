# Deploy ShiftIT

Game ini situs statis (tanpa backend). Hasil `pnpm build` ada di `dist/`. Header keamanan (CSP, dll.)
dan cache sudah disiapkan untuk dua pilihan hosting di PRD §14: **Cloudflare Pages** (`public/_headers`)
dan **Vercel** (`vercel.json`). Isi header keduanya sama.

## Cloudflare Pages

1. Dashboard Cloudflare → Workers & Pages → Create → Pages → hubungkan repo GitHub ini.
2. Pengaturan build:
   - Framework preset: _None_
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
3. Branch produksi: `main`. Branch lain otomatis mendapat URL preview.

## Vercel

1. Dashboard Vercel → Add New → Project → impor repo ini.
2. Pengaturan dibaca dari `vercel.json` (build `pnpm build`, output `dist`). Tidak perlu diubah.

## Setelah deploy (cek manual)

- [ ] Buka di Chrome Android: tombol "Instal aplikasi" muncul, dan game bisa dibuka offline setelah dimuat sekali.
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 (ARCHITECTURE §11).
- [ ] DevTools → Network: aset `/assets/*` memakai `Cache-Control: immutable`, `sw.js` memakai `no-cache`.
- [ ] Ubah sesuatu kecil lalu deploy ulang: toast "Versi baru tersedia" muncul di HUB (tidak di meja kerja).

## Variabel build

| Variabel         | Nilai              | Arti                                                                     |
| ---------------- | ------------------ | ------------------------------------------------------------------------ |
| `VITE_TELEMETRY` | `session` (bawaan) | Log belajar lokal untuk layar Laporan Belajar; tidak dikirim ke mana pun |
|                  | `none`             | Tidak mencatat apa pun                                                   |

## Uji main

Laporan Belajar dibuka dengan mengetuk logo **ShiftIT** di layar judul 5× dalam 3 detik. Tombol
**Ekspor JSON** mengunduh ringkasan dan log event tanpa data pribadi (hanya ID instalasi acak).
