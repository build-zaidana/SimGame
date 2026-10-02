# CLAUDE.md — ShiftIT

Game web edukasi karier IT (2D pixel, ala Papers, Please) untuk pelajar pemula Indonesia.
Mode pertama: **Cybersecurity Analyst (Meja SOC)**. Progres disimpan **di device** (tanpa backend di v1.0).

**Baca dulu sebelum mengerjakan apa pun:**
- `docs/PRD.md` — apa yang dibangun dan kenapa (fitur Must/Should, kurikulum, shift)
- `docs/ARCHITECTURE.md` — bagaimana dibangun (lapisan, kontrak mode, skema konten, save, milestone §14)

## Cara kerja

1. Kerjakan **satu milestone dari ARCHITECTURE §14 per sesi**, berurutan (M0 → M4). Jangan lompat.
2. Di awal milestone: tulis rencana singkat (file yang dibuat/diubah, test yang ditambah), lalu kerjakan.
3. Logika baru di `engine/` atau `evaluate()` → **tulis test dulu** (Vitest), lalu implementasi.
4. Sebelum menyatakan selesai: `pnpm check` harus hijau, dan e2e milestone itu harus hijau. Sebutkan hasilnya apa adanya; jangan klaim hijau tanpa menjalankan.
5. Commit kecil per langkah yang bermakna, pesan dalam bahasa Inggris (`feat(engine): …`, `content(soc): …`).
6. Ragu soal keputusan produk → lihat PRD. Tidak ada di PRD → tanya pemilik, jangan menebak. Keputusan teknis baru yang penting → tambah ADR di `docs/adr/`.

## Perintah

```
pnpm dev             # server dev
pnpm check           # typecheck + lint + test + content:check + build + size
pnpm test            # unit test (Vitest)
pnpm e2e             # Playwright (mobile Pixel 5 + desktop)
pnpm content:check   # validasi konten
```

## Aturan arsitektur (jangan dilanggar)

- `src/engine/` adalah **TypeScript murni**: tanpa React, DOM, Phaser, IndexedDB, atau import dari `modes/`/`app/`. Fungsi murni, deterministik (pakai `engine/rng.ts`, jangan `Math.random()` / `Date.now()` di engine).
- Mode lain **tidak boleh** saling import. Mode baru mengikuti kontrak `CareerMode` (ARCHITECTURE §4, checklist §13).
- Semua akses penyimpanan lewat `SaveRepository`. Perubahan bentuk save = naikkan `SAVE_SCHEMA_VERSION` + tambah migrasi + test.
- Semua string UI ada di `src/i18n/id.ts`, bukan di dalam komponen.
- Phaser hanya di `src/hub/phaser/`, di-import dinamis, dan **baru di v1.1**. Phaser yang dipakai adalah **v4**: cek dokumentasi & template resmi `phaserjs/template-react-ts` terbaru, jangan pakai API Phaser 3 dari ingatan.
- Jangan menambah dependensi baru tanpa alasan tertulis di commit/PR. Perhatikan anggaran ukuran (ARCHITECTURE §11).
- Jangan menambah backend, akun, atau Supabase di v1.0.

## Aturan konten (penting: ini produk edukasi)

- Konten = data di `content/id/modes/<mode>/` (JSON + Markdown). Ikuti skema di ARCHITECTURE §5.
- Bahasa Indonesia santai dan jelas untuk pemula; istilah teknis Inggris boleh, tapi jelaskan saat pertama muncul.
- **Semua merek, bank, kurir, orang, dan perusahaan fiktif** (Bank Nusantara, KirimCepat, PT Nusa Digital…). Domain contoh pakai TLD `.test`/`.example` atau domain fiktif yang terdaftar.
- Hanya keamanan **defensif**. Jangan menulis langkah menyerang, kode exploit, atau cara membobol.
- Setiap kasus: jawaban benar, bukti wajib, penjelasan ≤ 2 kalimat, rujukan aturan. 30–40% kasus per shift harus **aman/sah**.
- Fakta keamanan harus sesuai sumber kredibel (BSSN, NIST CSF / SP 800-61, APWG, OWASP); cantumkan di frontmatter `sources`.
- Konten yang kamu tulis adalah **draf untuk direview pemilik**. Di ringkasan akhir sesi, daftar file konten baru/berubah agar mudah direview.

## UI & aksesibilitas

- Mobile-first: uji di 360×640. Target sentuh ≥ 44 px, bar aksi lengket di bawah pada HP.
- Jangan bergantung warna saja (pakai ikon/teks juga). Fokus keyboard terlihat. `aria-pressed` pada bukti yang ditandai.
- Hormati pengaturan `reduceMotion` dan `--text-scale`.
- Tautan di dokumen kasus **tidak pernah** menjadi `<a href>` yang bisa dibuka.
- Aset pihak ketiga hanya CC0 / lisensi jelas, catat di `public/assets/CREDITS.md`.

## Definisi selesai (per milestone)

- [ ] Kriteria ✅ milestone di ARCHITECTURE §14 terpenuhi
- [ ] `pnpm check` hijau, e2e terkait hijau
- [ ] Tidak ada pelanggaran aturan lapisan / anggaran ukuran
- [ ] String UI di i18n, konten lolos `content:check`
- [ ] Ringkasan: apa yang selesai, apa yang belum, file konten untuk direview, keputusan baru (ADR)
