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

## Tambahan: "game feel" tahap 1 (6 Oktober 2026)

Masukan pemilik: Meja Developer masih terasa seperti latihan coding biasa. Tahap 1:

- **Tes sebagai pelanggan** (`ui/CustomerScene.tsx`): setiap tes tugas coding adalah pelanggan pixel
  di loket aplikasi. Lulus = senang & membayar; gagal = kecewa dengan protes "hasil kodemu vs
  seharusnya"; crash = aplikasi meledak dan pelanggan kabur. Hanya hiasan: daftar tes tetap ada untuk
  pembaca layar.
- **Robot kurir** (tipe kasus `robot`): program Python memakai `maju()`, `belok_kiri()`,
  `belok_kanan()`, `ambil()`, `antar()` dan sensor `depan_kosong()`, `ada_paket()`, `di_tujuan()`
  (alias Inggris tersedia). Dunia disimulasikan di Python (`runner/robot.ts`), jadi sensor bisa dipakai
  di `if`/`while`; jejak langkah dianimasikan di peta pixel (`replay()`). Program yang sama diuji di
  1–3 peta, sehingga menghafal langkah tidak cukup. Batas 300 langkah per peta. `content:check`
  memvalidasi peta dan menjalankan solusi acuan di semua peta.
- Tahap 2 (direncanakan): insiden "server terbakar" dengan tekanan waktu.

## Addendum — tahap 2: server terbakar (insiden produksi)

- Kasus `coding` boleh punya `incident: { service, drainPerSecond }`. Kesehatan server berkurang
  seiring jam shift (pause-aware, tersimpan), dihitung murni di `modes/dev/incident.ts`.
- Rollback darurat = tombol di dokumen (mulai shift 3), bukan keputusan: membekukan kesehatan,
  pemain tetap harus memperbaiki bug ("rollback dulu, perbaiki kemudian"). Dicatat lewat aksi
  engine `ROLLBACK_INCIDENT` → `answer.rolledBackAtMs` (save v10 + migrasi identitas).
- Skor: tes lulus semua dan server tidak down = tepat; server down (0%) = `threat-allowed`.
  Kesehatan tersisa menjadi skor bukti (min 0,3).

## Addendum — poles tahap 1–2

- Kecepatan kerusakan insiden diturunkan untuk pemula yang mengetik di HP: shift 1 0,5 %/detik
  (down ±200 detik), shift 2 0,6, shift 3 0,8, shift 4 1,0, shift 5 1,2. Rollback tersedia sejak shift 3.
- Di HP, ruang server dan peta robot tergulir keluar layar saat mengetik: ditambah indikator
  ringkas `ServerHealthChip` di atas editor, dan peta robot digulir ke layar saat program dijalankan.
- Kasus robot ada di setiap shift dengan materi yang naik: urutan cek (debug), if/else + sensor depan,
  `def` + uji semua peta (kasus tepi), lalu aturan tangan kanan di labirin.
