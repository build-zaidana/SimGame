# ADR 025 — Mode kedua: Teknisi IT Support (Bengkel IT)

- Status: diterima · 4 Oktober 2026

## Konteks

PRD §1 dan roadmap v1.2+ menyebut IT Support Technician sebagai mode karier kedua. Pemilik memilih:
5 shift, dua bahasa (id + en), mentor baru (Pak Joko), dan Kelabu muncul sedikit (satu "laptop aneh"
di shift 5 yang harus dieskalasi ke SOC). Mode kedua juga menguji apakah kontrak `CareerMode`
benar-benar cukup untuk paket mode baru tanpa mengubah engine.

## Keputusan

- **Infrastruktur multi-mode.** Store menyimpan `contents` per mode, plus `menuMode` untuk layar menu
  (Toko, Lencana, Buku Panduan) yang sekarang punya tab meja (`ModeTabs`). Save tetap per mode
  (`save.modes[modeId]`): dompet, kepercayaan, alat, lencana, dan mastery tidak tercampur.
- **Kontrak `CareerMode` bertambah** (tidak ada yang dihapus): `mentor` (ID pembicara di judul
  petunjuk), `citations?` (catatan slip per dampak, getter agar ikut bahasa), dan `visitor?` per tipe
  kasus. Tanpa `citations`, teks SOC dipakai.
- **Verdict lebih luas**: `'no-fault' | 'fault' | 'specialist'` ditambahkan. Engine tidak tahu arti
  tiap verdict; `NO_ACTION_VERDICTS = ['safe', 'no-fault']` dipakai untuk rasio 30–40% kasus "aman".
  Save naik ke **v8** (migrasi tanpa perubahan data, hanya menandai bentuk verdict baru).
- **Keputusan Bengkel**: Arahkan Pengguna (`guide`), Perbaiki (`fix`), Eskalasi (`escalate`) sejak
  shift 1; Ganti Komponen (`replace`) terbuka di shift 2 bersama bab Perangkat Keras.
  `evaluateSupportCase` memetakan dampak ke kategori yang sudah ada di engine:
  kerusakan dibiarkan (`guide` pada fault) = `threat-allowed`; membongkar perangkat sehat = `legit-blocked`;
  eskalasi tanpa perlu = `needless-escalation`. Lencana & koran pagi berfungsi tanpa perubahan.
- **Tipe kasus**: `ticket` (keluhan pengguna), `diagnostic` (angka sistem + keluaran perintah),
  `hardware` (inspeksi fisik). Alat: Pemindai Perangkat Keras (`intel.scan`) dan Alat Ping
  (`intel.ping`); hasil alat hanya bukti pendukung, kasus tetap bisa diselesaikan tanpa alat.
- **Tanpa generator** di v1 mode ini: semua 51 kasus ditulis tangan (draf untuk direview pemilik).
- **Bundel**: konten per bahasa di chunk `support-data-<lang>`; anggaran size-limit sendiri (150 KB).

## Akibat

- Mode ketiga cukup menambah folder `src/modes/<mode>/`, mendaftar di `registry.ts` dan
  `scripts/content-check.ts`, serta konten `content/<lang>/modes/<mode>/`.
- Badges dan aturan rasio memakai kategori dampak yang sama; nama kategori (`threat-allowed`) berasal
  dari SOC dan kini bermakna lebih umum ("masalah dibiarkan").
