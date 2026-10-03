# ADR 012 — Keputusan teknis M3 (ekonomi, alat, cerita, pindah save)

- Status: diterima · 3 Oktober 2026 · M3

## Save v2: kasus prosedural disimpan di sesi

Generator dijalankan sekali saat shift dimulai (`buildShift`) dan hasilnya disimpan di
`ShiftSession.generatedCases`, supaya shift yang dilanjutkan memakai kasus yang sama persis.
Engine tidak membaca isinya. App memvalidasi ulang dengan skema tipe kasus (`withGeneratedCases`).
`SAVE_SCHEMA_VERSION` naik ke 2; migrasi v1→v2 menambahkan `generatedCases: {}` pada sesi aktif.

## Generator divalidasi di CI

`content:check` menjalankan setiap entri generator di antrian shift dengan 20 seed, lalu memeriksa
hasilnya seperti kasus biasa (skema, merek nyata, domain `.test`, batas kata). Generator
`typosquat-domain` hanya memodifikasi domain `.test` dari params, jadi hasilnya selalu domain
yang dicadangkan.

## Alat tidak boleh menjadi syarat menyelesaikan kasus

Data alat (WHOIS, Sandbox) ada di `intel` kasus. Bukti di sana boleh `supporting`, tidak boleh
`required` (ditegakkan `content:check`), jadi pemain tanpa alat tetap bisa mendapat nilai penuh.
Alat menambah info dan kecepatan; tanpa alat, panel menampilkan ajakan halus ke Toko Alat.
Pemeriksa Tautan dan Filter Log tidak butuh data tambahan; keduanya dihitung dari dokumen
(`ownerOf`, `summarizeByIp`).

## Blokir vs Karantina

Konten memakai definisi tetap: file/pesan berbahaya yang **belum** dibuka → Blokir; perangkat
kantor yang **sudah** menjalankan file berbahaya → Karantina (Bab 4, `r-mal-4`). Aksi Karantina
terbuka di Shift 4 bersama konsep `malware-files`.

## Format kode save

`SHIFTIT1.<jenis><base64url>.<sha256[0..8]>`, dengan jenis `z` (gzip) atau `j` (JSON tanpa kompresi,
fallback bila `CompressionStream` tidak ada). Penanda jenis di dalam payload membuat dekoder tahu
cara membaca tanpa menebak, dan tetap tercakup checksum. Impor: batas 512 KB → format → checksum →
dekompresi → JSON → migrasi → zod → ringkasan → konfirmasi; save lama menjadi cadangan lewat
`SaveRepository.save`.

## Tes awal/akhir memakai soal review

`assessment.json` berisi dua daftar ID soal review yang tidak saling tumpang tindih: 6 soal, satu per
konsep inti (diputuskan pemilik; PRD §5.3 diperbarui dari 5 soal). Hasilnya disimpan di
`save.assessments` dan tidak masuk Leitner.
