# ADR 016 — Hosting di Netlify

- Status: diterima · 3 Oktober 2026

## Konteks

PRD §14 menyisakan pertanyaan hosting (Vercel / Cloudflare Pages). Pemilik men-deploy ke **Netlify**.

## Keputusan

- `netlify.toml` berisi build (`pnpm build`, publish `dist`, Node 22, pnpm 10.28).
- Header keamanan & cache tetap satu sumber di `public/_headers`. Netlify, seperti Cloudflare Pages,
  membaca file ini dari folder publish; `e2e/csp.spec.ts` menguji CSP dari file yang sama.
- Konfigurasi Cloudflare Pages / Vercel tidak dihapus agar pindah hosting tetap mudah.
