# ADR 031 — Meja Data: Analis Data + sentuhan AI, dengan SQL sungguhan (sql.js)

- Status: diterima · 8 Oktober 2026

## Konteks

PRD §1 menyebut Data/AI sebagai mode karier berikutnya, tanpa kurikulum. Pemilik memilih:

- **Peran**: Analis Data + sentuhan AI. Fokus utama data (query, grafik jujur, kualitas & privasi data);
  shift 4–5 mengenalkan AI (data latih yang bias, jawaban chatbot yang mengarang, data rahasia di AI publik).
- **Mekanik campuran**: kasus keputusan ala Papers Please (Setujui/Revisi/Eskalasi + tandai bukti)
  ditambah tugas menulis query yang hasilnya dicek otomatis.
- **Bahasa query: SQLite asli (sql.js)**, bukan SQL mini buatan sendiri, meski lebih besar.

| Pilihan                   | Unduhan (gzip) | Catatan                                                       |
| ------------------------- | -------------- | ------------------------------------------------------------- |
| sql.js 1.14.2 (MIT), wasm | ±338 KB        | SQLite asli: semua SQL yang dipelajari berlaku di dunia nyata |
| SQL mini buatan sendiri   | ±10 KB         | Ringan, tapi subset & pesan error tidak sama dengan SQL asli  |
| Python (MicroPython)      | sudah ada      | Bukan bahasa yang lazim dipakai analis untuk query            |

## Keputusan

- **Dependensi baru: `sql.js@1.14.2`** (MIT; `@types/sql.js` untuk tipe). Dimuat **hanya di Meja Data**,
  di **Web Worker** (`src/modes/data/runner/sql.worker.ts`). Anggaran ukuran sendiri: worker + wasm
  ≤ 360 KB gzip (`.size-limit.json`). JS awal tidak bertambah. `.wasm` ikut di-precache PWA (offline).
  CSP tidak berubah: `'wasm-unsafe-eval'` sudah ada sejak ADR 026.
- **Ketahanan**: lewat 4 detik worker dimatikan (mis. `WITH RECURSIVE` tanpa batas). Setiap set data
  memakai database SQLite baru di memori, jadi `DELETE`/`DROP` dari pemain tidak bisa mengubah data
  berikutnya, dan tidak ada akses jaringan/berkas.
- **Penilaian query** (`runner/sqlHarness.ts`, murni, dipakai sama persis di worker, unit test, dan
  content:check): hasil query pemain dibandingkan dengan **query acuan** di set data contoh dan di
  **1–2 set data tersembunyi** (isi berbeda, tabel sama). Nama kolom diabaikan (alias bebas), angka
  dibulatkan 2 desimal, urutan baris hanya dinilai bila tugas memintanya (`ordered`). Nilai = bagian set
  data yang cocok; "bukti" diganti efisiensi (sedikit percobaan), sama seperti tugas coding (ADR 026).
  Hasil yang diharapkan untuk set data tersembunyi tidak pernah dikirim ke UI.
- **content:check** (`verify.ts`): query acuan berjalan dan tidak kosong; set data tersembunyi punya
  tabel yang sama tapi hasil berbeda (menghafal hasil tidak lulus); query awal tugas "perbaiki" memang
  salah; tugas berurutan memakai `ORDER BY`.
- **Tipe kasus**: `query` (tulis/perbaiki query), `chart` (grafik dari rekan: sumbu terpotong, sampel
  kecil, korelasi ≠ sebab-akibat, memilih data), dan `request` (berbagi data pribadi, kualitas data,
  data latih AI, jawaban asisten AI). Keputusan: Kirim Solusi (`submit`), Setujui (`approve`), Revisi
  (`revise`), Eskalasi (`escalate`). Pemetaan dampak sama dengan Meja Developer.
- **Alat**: Profiler Data (`intel.profile`) dan Cek Sumber (`intel.source`); bukti dari alat hanya
  pendukung.
- **Mentor baru**: Bu Laras (`laras`), analis data senior. Kelabu muncul sedikit di shift AI.
- Kartu "Segera hadir" di kantor hilang: keempat meja di PRD sekarang bisa dimainkan.

## Konsekuensi

- Total unduhan untuk pemain yang membuka Meja Data bertambah ±338 KB (sekali, lalu di-cache).
- SQL yang dipelajari adalah dialek SQLite. Perbedaan kecil dengan MySQL/PostgreSQL disebut di Buku
  Panduan bila relevan.
- Konten Meja Data adalah **draf untuk direview pemilik** (fakta privasi mengacu UU No. 27 Tahun 2022
  tentang Pelindungan Data Pribadi; AI mengacu NIST AI RMF 1.0 dan OWASP Top 10 for LLM Applications).
