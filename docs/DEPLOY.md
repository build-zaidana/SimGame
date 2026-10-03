# Deploy ShiftIT

Game ini situs statis (tanpa backend). Hasil `pnpm build` ada di `dist/`. Hosting yang dipakai:
**Netlify** (`netlify.toml`). Header keamanan (CSP, dll.) dan cache ada di `public/_headers`, yang dibaca
Netlify dan Cloudflare Pages dengan format yang sama. Vercel memakai `vercel.json` dengan isi yang sama.

## Netlify (dipakai)

1. Netlify → Add new site → Import from Git → pilih repo ini.
2. Pengaturan build dibaca dari `netlify.toml` (build `pnpm build`, publish `dist`, Node 22, pnpm 10).
3. Branch produksi: `main`. Pull request otomatis mendapat _Deploy Preview_.

## Cloudflare Pages (alternatif)

1. Dashboard Cloudflare → Workers & Pages → Create → Pages → hubungkan repo GitHub ini.
2. Pengaturan build:
   - Framework preset: _None_
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
3. Branch produksi: `main`. Branch lain otomatis mendapat URL preview.

## Vercel (alternatif)

1. Dashboard Vercel → Add New → Project → impor repo ini.
2. Pengaturan dibaca dari `vercel.json` (build `pnpm build`, output `dist`). Tidak perlu diubah.

## Setelah deploy (cek manual)

- [ ] Buka di Chrome Android: tombol "Instal aplikasi" muncul, dan game bisa dibuka offline setelah dimuat sekali.
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 (ARCHITECTURE §11).
- [ ] DevTools → Network: aset `/assets/*` memakai `Cache-Control: immutable`, `sw.js` memakai `no-cache`.
- [ ] Ubah sesuatu kecil lalu deploy ulang: toast "Versi baru tersedia" muncul di HUB (tidak di meja kerja).

## Variabel build

| Variabel                  | Nilai              | Arti                                                                                        |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `VITE_TELEMETRY`          | `session` (bawaan) | Log belajar lokal untuk layar Laporan Belajar; tidak dikirim ke mana pun                    |
|                           | `none`             | Tidak mencatat apa pun                                                                      |
| `VITE_TELEMETRY_ENDPOINT` | kosong (bawaan)    | URL `https://` (atau path `/…`) endpoint analitik anonim (PRD S6). Kosong = fitur tidak ada |

## Menyalakan analitik anonim (PRD S6, ADR 018)

Bawaan: **mati**. Sebelum menyalakan untuk publik, tinjau kewajiban **UU PDP (UU 27/2022)** soal data
anak (banyak pemain di bawah 18 tahun). Untuk uji main terpandu, pastikan ada izin sekolah/orang tua.

1. Siapkan endpoint _insert-only_ yang menerima `POST` JSON (CORS mengizinkan origin game, header
   `content-type`) dan membalas 2xx. Bentuk body:
   `{ "v": 1, "installId": "<uuid acak>", "events": [{ "name": "case_decided", …, "at": "2026-10-03T11:42Z" }] }`.
   Jangan simpan alamat IP lebih lama dari yang diperlukan.
2. Netlify → Site configuration → Environment variables: `VITE_TELEMETRY_ENDPOINT=https://…`.
3. Tambahkan origin endpoint ke `connect-src` di `public/_headers` (dan `vercel.json` bila dipakai),
   misalnya `connect-src 'self' https://telemetry.example`. Tanpa ini CSP memblokir pengiriman.
4. Deploy ulang. Pemain tetap harus mencentang **Pengaturan → Analitik anonim**; tanpa centang
   tidak ada yang dikirim.

## Uji main

Laporan Belajar dibuka dengan mengetuk logo **ShiftIT** di layar judul 5× dalam 3 detik. Tombol
**Ekspor JSON** mengunduh ringkasan dan log event tanpa data pribadi (hanya ID instalasi acak).
