# ADR 015 — Jurnal save sinkron

- Status: diterima · 3 Oktober 2026

## Konteks

CI di PR #2 gagal di `e2e/shift-01.spec.ts` ("reloading mid-shift resumes the same case with its
marks"): setelah reload, kasus yang dibuka benar tetapi tanda bukti terakhir hilang. Penyebabnya:
autosave ke IndexedDB asinkron (3 transaksi berurutan) dan dulu diantrekan di store, sehingga reload
atau tab ditutup tepat setelah aksi bisa memotong tulisan terakhir. Di perangkat pemain, tanda bukti
atau keputusan terakhir bisa hilang dengan cara yang sama.

## Keputusan

- `LocalSaveRepository.save()` menulis **jurnal sinkron** (localStorage, `shiftit:save:journal`)
  seketika, sebelum operasi IndexedDB apa pun.
- `load()` memilih jurnal bila `updatedAt`-nya lebih baru daripada save di IndexedDB; jurnal yang
  rusak diabaikan. Jika save IndexedDB rusak tetapi jurnal valid, jurnal dipakai.
- Urutan tulisan IndexedDB dijaga **di dalam repository** (antrean internal), bukan di store, sehingga
  jurnal tidak ikut tertunda oleh antrean.
- Jurnal hanya dipakai bila store utama adalah IndexedDB (localStorage & memori sudah sinkron).

## Konsekuensi

Satu `JSON.stringify` sinkron per aksi pemain (save ±puluhan KB; jam hanya menyimpan tiap 5 detik).
Tetap semua akses penyimpanan lewat `SaveRepository`.
