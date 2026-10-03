# ADR 011 — Keputusan teknis M2 (lingkar belajar)

- Status: diterima · 3 Oktober 2026 · M2

## Petunjuk mentor sebagai data kasus

Setiap kasus wajib punya `hints` (1–3, dari umum ke spesifik, maks. 2 kalimat masing-masing; dicek
`content:check`). Engine hanya menghitung `hintsUsed`; penalti tetap di `caseScore` (petunjuk ke-2 dst. −10).

## Alur Laporan → Review Cepat → simpan

Hasil shift baru disimpan (`commitShift`) setelah Review Cepat selesai, bersama jawaban review, supaya satu
penulisan save mencakup skor, gaji, dan Leitner. Soal review dipilih deterministik dari `seed` sesi
(`reviewItemsFor`), jadi reload di tengah review memunculkan soal yang sama. Jawaban review yang belum
selesai tidak disimpan; reload memulai review dari soal pertama.

## Leitner untuk soal review

Setiap jawaban review dicatat per ID soal dengan indeks shift = nomor shift. Soal salah → kotak 1 →
jatuh tempo di shift berikutnya, dan `selectReviewItems` memprioritaskan soal jatuh tempo dari konsep mana
pun. Ini memenuhi kriteria M2 (diuji di `e2e/spaced-repetition.spec.ts`).

## Materi Markdown di-render saat konten dimuat

`marked` (ada di stack §2) dipanggil di `parseModeContent`, sehingga UI hanya menerima HTML dan
`content:check` juga mendeteksi Markdown yang gagal di-render. Konten berasal dari repo dan sudah direview,
jadi HTML-nya dianggap tepercaya.

## Aksi `reset-password` terbuka di Shift 3

Sesuai PRD §5.2 (aksi bertahap) dan bersamaan dengan bab Password & MFA. Pada kasus sah, aksi kuat apa pun
selain Izinkan/Eskalasi dihitung `legit-blocked` (−3 kepercayaan). Bar aksi memakai 2 kolom di HP bila
aksinya lebih dari tiga.

## Tipe kasus `file` dipakai sejak Shift 2

PRD menaruh konsep `malware-files` di Shift 4, tetapi "lampiran tak terduga" sudah termasuk tanda phishing
(Shift 1–2). Kasus `file` di Shift 2 dinilai dari pengirim dan konteks, bukan dari pengetahuan ekstensi file.
