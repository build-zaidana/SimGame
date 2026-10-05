# ADR 026 — Meja Developer: coding sungguhan dengan MicroPython di browser

- Status: diterima · 5 Oktober 2026 (5 shift: 50 kasus campuran review, coding, CTF)

## Konteks

Pemilik meminta mode Software Engineer di mana pemain **benar-benar menulis kode**, bukan sekadar
memilih keputusan, dengan campuran tugas (perbaikan bug, lomba coding ala CP, CTF) dan lebih fun.
Aturan v1.0: tanpa backend, PWA bisa offline, anggaran ukuran (ARCHITECTURE §11), CSP ketat.

Pilihan yang dibandingkan (ukuran gzip diukur dari paket npm terbaru, Oktober 2026):

| Pilihan                            | Unduhan | Catatan                                                                       |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------- |
| MicroPython WebAssembly 1.29 (MIT) | ±225 KB | Python 3 asli, aktif dirawat; perlu `'wasm-unsafe-eval'`                      |
| Skulpt 1.2 (MIT)                   | ±227 KB | Tanpa WASM, tapi rilis terakhir 2022 dan Python 3-nya tidak lengkap           |
| Pyodide (MPL-2.0)                  | ±5,9 MB | CPython penuh; terlalu berat untuk HP murah & kuota pelajar                   |
| Eksekusi di server                 | —       | Butuh backend (dilarang di v1.0), tidak offline, kode pemain keluar perangkat |

## Keputusan

- **Dependensi baru: `@micropython/micropython-webassembly-pyscript@1.29.0-6`** (MIT). Dimuat
  hanya di Meja Developer, di **Web Worker** (`src/modes/dev/runner/py.worker.ts`), format worker ES
  (`vite.config.ts: worker.format = 'es'`, karena paketnya memakai top-level await).
- **Keamanan & ketahanan**: tiap "Jalankan" memakai interpreter baru; lewat 4 detik worker
  dimatikan (loop tak berujung tidak membekukan game). CSP `script-src` ditambah
  `'wasm-unsafe-eval'` (hanya mengizinkan WebAssembly, bukan `eval` JavaScript). `.wasm` ikut
  di-precache PWA agar bisa offline.
- **Harness murni** (`runner/harness.ts`): menjalankan kode pemain lalu tiap tes `assert`; untuk
  `assert A == B` yang gagal ditampilkan "hasil kodemu vs seharusnya". Dipakai sama persis di worker,
  unit test (Node), dan `content:check`.
- **Tipe kasus**: `coding` (`fix` perbaiki bug / `build` tulis fungsi, dengan tes tersembunyi untuk
  kasus tepi), `ctf` (cari `FLAG{...}` dengan konsol Python; teka-teki defensif seperti sandi
  Caesar/Base64, bukan cara membobol), dan `pull-request` (review: Setujui/Revisi/Eskalasi, Rollback
  terbuka di shift 3).
- **Engine**: `SessionCase.answer` (teks jawaban, jumlah percobaan, hasil tes terakhir) dengan aksi
  `SET_ANSWER`/`RECORD_RUN`; `PlayerInput.answer`. Save naik ke **v9** (migrasi tanpa perubahan
  data). Verdict baru `task` untuk tugas ketik: tidak ikut rasio 30–40% kasus aman dan tidak wajib
  punya bukti. Nilai tugas = bagian tes yang lulus; "bukti" diganti efisiensi (sedikit percobaan).
- **Kontrak mode**: `CaseTypeDef.decisions` (keputusan per tipe kasus) dan `ready()` (tombol kirim
  aktif bila tes sudah dijalankan untuk kode yang ada di editor); `DocumentProps.answer/onAnswer/onRun`.
- **content:check menjalankan Python**: solusi acuan wajib lulus semua tes, kode awal wajib gagal
  minimal satu tes, dan solusi CTF wajib mencetak benderanya (untuk setiap bahasa).
- **Batas MicroPython** yang perlu diingat penulis konten: slice berlangkah (`s[::-1]`),
  `str.zfill`, dan `str.title` belum didukung; error-nya diberi petunjuk ramah di UI.

## Akibat

- JS awal naik ±6 KB (editor & panel tes); runtime Python 227 KB gzip hanya saat Meja Developer
  dipakai (anggaran size-limit 300 KB).
- Mode lain bisa memakai mekanik jawaban ketik yang sama (mis. analisis data di Meja Data nanti).
