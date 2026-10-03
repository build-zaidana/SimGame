# ADR 010 — Keputusan teknis M1

- Status: diterima · 3 Oktober 2026 · M1

## 1. Import memakai ekstensi `.ts` / `.tsx`

`scripts/content-check.ts` dijalankan langsung oleh Node (`--experimental-strip-types`) tanpa bundler,
dan memakai ulang skema & validator dari `src/content/` serta skema tipe kasus dari
`src/modes/*/caseTypes/`. Node mewajibkan ekstensi file pada import relatif, jadi kode baru memakai
`./x.ts` (diizinkan oleh `allowImportingTsExtensions`). Alternatif ditolak: dependensi `tsx`/`vite-node`
hanya untuk satu skrip.

## 2. Tambahan pada kontrak `CareerMode` (§4)

- `loadContent(): Promise<ModeContent>`: app perlu konten untuk membuat `ShiftPlan`, menampilkan HUB
  dan Laporan, tanpa tahu struktur folder mode. Konten dimuat dengan `import.meta.glob` di dalam chunk
  mode.
- `DocumentProps.locked`: bukti tidak bisa diubah setelah keputusan.
- `defineCaseType()`: menyimpan beberapa tipe kasus di satu array tanpa `any`.

## 3. Perilaku engine yang tidak dirinci di §6

- Aksi `DISMISS_BRIEFING` memindahkan `briefing → working` (jam belum berjalan selama briefing).
- **Lompat jam saat antrian kosong**: setelah umpan balik, jika tidak ada kasus yang menunggu, jam maju
  ke kasus berikutnya. Pemain tidak menunggu tanpa kegiatan.
- **Mode Santai saat jam habis**: semua kasus tersisa langsung masuk antrian; shift selesai setelah
  semuanya diputuskan. Mode Normal: jam habis = shift selesai, sisa kasus "terlewat" (skor 0).
- **Bonus waktu**: 10 → 0 secara linear dalam 60 detik nyata sejak kasus dibuka; hanya mode Normal dan
  hanya untuk keputusan yang benar.
- **Dampak (`CaseImpact`)** dihitung `evaluate()` milik mode, karena hanya mode yang tahu arti
  "izinkan/blokir"; engine hanya memetakan dampak → Kepercayaan.
- **Mastery konsep**: satu pembaruan Leitner per konsep per shift (benar jika akurasi kasus ≥ 75%),
  supaya 8 kasus dengan konsep yang sama tidak langsung melompat ke kotak 3. Indeks jatuh tempo = nomor
  shift.

## 4. Autosave

Disimpan setelah setiap aksi pemain (bukan hanya `DECIDE`), setiap 5 detik saat jam berjalan, dan saat
`visibilitychange → hidden` / `pagehide`. Penulisan diantrekan agar save lama tidak menimpa yang baru.
Ini memastikan reload di tengah shift kembali ke kasus yang sedang dibuka beserta tandanya.
