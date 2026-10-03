# ADR 023 — Bahasa Inggris (PRD C4)

- Status: diterima · 3 Oktober 2026

## Konteks

Pemilik memilih C4. Game harus bisa dimainkan penuh dalam bahasa Inggris tanpa mengubah jawaban
kasus, dan Bahasa Indonesia tetap bahasa utama.

## Keputusan

- **Kamus UI**: `src/i18n/id.ts` (sumber) dan `src/i18n/en.ts` (bertipe `Strings` yang sama, jadi
  kunci yang hilang = error typecheck). `src/i18n/index.ts` mengekspor `t` sebagai _live binding_;
  komponen mengimpor `t as id`. Kamus Inggris dimuat lazy (±5 kB gzip).
- **Ganti bahasa tanpa reload**: `setLanguage` memuat kamus + konten bahasa baru, lalu App memasang
  ulang layar (`key={locale}`). Teks yang dulu dibekukan saat modul dimuat (label keputusan, judul
  mode, format tanggal) dijadikan getter/fungsi.
- **Save v6**: `settings.language` (`'id' | 'en'`); migrasi v5→v6 = `'id'`. Pemilih bahasa ada di
  layar judul dan Pengaturan.
- **Konten**: `content/en/modes/soc/` berstruktur identik dengan `content/id/`. Setiap bahasa
  dibundel sebagai chunk terpisah (pemain hanya mengunduh satu). Generator kasus prosedural menerima
  `ctx.locale`; pilihan RNG tidak bergantung pada bahasa.
- **Paritas** (`src/content/parity.ts`, dijalankan `content:check`): terjemahan wajib punya file
  yang sama, kunci & panjang array yang sama, angka sama, dan nilai sama di kunci terkunci (ID,
  verdict, keputusan, bukti, alamat/domain/URL/IP, waktu, pembicara…). Jadi terjemahan tidak bisa
  mengubah jawaban. Domain, URL, dan nama file sengaja tidak diterjemahkan.
- **Anggaran ukuran** diukur per bahasa (`.size-limit.json`).

- **Nama perusahaan fiktif dilokalkan** (permintaan pemilik): di bahasa Inggris PT Nusa Digital →
  Nusa Digital, Bank Nusantara → Nusantara Bank, KirimCepat → SendFast, PT Sinar Jaya → Bright Harbor,
  dan koran "Kabar Nusa" → "Nusa News". Domain yang memuat nama merek ikut berubah
  (`banknusantara…` → `nusantarabank…`, `kirimcepat…` → `sendfast…`) agar pelajaran
  "nama merek vs domain" tetap konsisten. Padanannya ada di `content/en/renames.json`; paritas
  menerapkan tabel ini sebelum membandingkan nilai terkunci, jadi perubahan lain tetap ditolak.

## Konsekuensi

- Semua teks bahasa Inggris (UI + 76 file konten) adalah **draf untuk direview pemilik**.
- Kasus prosedural yang dibuat sebelum ganti bahasa di tengah shift tetap dalam bahasa awalnya.
- Bahasa baru = kamus `src/i18n/<lang>.ts` + `content/<lang>/` + entri di `LOCALES`.
