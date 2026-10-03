# ADR 018 — Analitik anonim opsional (PRD S6)

- Status: diterima · 3 Oktober 2026

## Konteks

PRD S6 meminta analitik anonim yang mati secara default dan bisa dinyalakan saat uji main.
Banyak pemain di bawah 18 tahun, jadi PRD §9 meminta peninjauan UU PDP sebelum analitik publik.
v1.0 tidak boleh punya backend, jadi endpoint disediakan pemilik di luar repo ini.

## Keputusan

- `AnonHttpTelemetry` (di `src/telemetry/`, murni, transport disuntikkan dari `app/telemetry.ts`):
  antrean ≤ 200 event, kirim per 20 event atau saat tab disembunyikan, gagal = coba lagi nanti.
- **Dua kunci:** sink hanya dibuat bila build diberi `VITE_TELEMETRY_ENDPOINT` (https:// atau path
  origin yang sama), dan hanya mengirim bila pemain mencentang _Pengaturan → Analitik anonim_
  (flag save `analyticsOptIn`, bawaan mati). Tanpa endpoint, pilihan itu tidak tampil.
  Mematikan centang langsung membuang antrean yang belum terkirim.
- Payload hanya `installId` acak (UUID dari save), nama + properti event (tipe `TelemetryEvent`
  yang memang tanpa data pribadi), dan waktu yang dipotong per menit. `credentials: 'omit'`,
  tanpa referrer.
- Persetujuan disimpan di `save.flags`, jadi bentuk save tidak berubah (versi skema tetap 3).
- Build e2e memakai endpoint `/__telemetry` (origin sama) agar alur persetujuan teruji;
  build produksi tetap tanpa endpoint.

## Konsekuensi

- Menyalakan untuk publik tetap keputusan pemilik setelah tinjauan UU PDP; langkahnya di
  `docs/DEPLOY.md` (endpoint, variabel Netlify, `connect-src` di CSP).
- Teks persetujuan meminta pemain di bawah 18 tahun meminta izin orang tua/guru; ini bukan
  pengganti persetujuan orang tua bila hukum mewajibkannya.
