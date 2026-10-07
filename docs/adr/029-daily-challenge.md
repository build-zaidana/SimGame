# ADR 029 — Tantangan harian

- Status: diterima · 7 Oktober 2026

## Konteks

Pemilik memilih "tantangan harian": alasan untuk kembali setiap hari, dengan bonus koin dan streak.
Tidak ada backend di v1.0, jadi semuanya harus jalan di perangkat.

## Keputusan

- **Kasus harian dipilih deterministik dari tanggal lokal + mode** (`engine/daily.ts`, `dailyCases`):
  3 kasus dari kasus tetap di shift yang sudah diselesaikan pemain di mode itu (materinya sudah
  dikenal). Pemain dengan progres yang sama mendapat kasus yang sama di hari yang sama, tanpa server.
  Engine tidak membaca jam: tanggal ('YYYY-MM-DD') datang dari app (`localDate`). Kalender
  (`previousDate`) dihitung manual, tanpa `Date`.
- **Satu tantangan per meja per hari.** Terbuka setelah Shift 1 mode itu selesai. Semua kasus datang
  sekaligus; batas waktu 90 menit game, dan hanya berlaku di mode Normal seperti shift biasa.
- **Memakai slot latihan** (`practiceSession` + penanda `session.daily`). Progres utama (skor terbaik,
  kepercayaan, Leitner, pangkat) tidak berubah, sama seperti Mode Latihan. Latihan dan tantangan
  harian tidak bisa berjalan bersamaan di satu meja; hub menjelaskannya.
- **Hadiah** (`dailyReward`): Rp 10 per kasus benar ke dompet mode itu, plus bonus beruntun bila semua
  benar (Rp 5 × hari beruntun, maks. 5 hari). Hadiah hanya sekali per meja per hari.
- **Beruntun global** (`save.daily`): bertambah bila tantangan (di meja mana pun) diselesaikan pada hari
  berikutnya; hilang bila satu hari terlewat. Tantangan kemarin yang baru diselesaikan hari ini tidak
  memundurkan beruntun.
- Tanpa Review Cepat: laporan harian langsung menampilkan hadiah, beruntun, dan penjelasan tiap kasus.
- **Save v13**: `daily?` di root dan `daily?` di sesi (migrasi identitas).

## Akibat

- Jam perangkat bisa dimajukan untuk "memanen" hadiah. Diterima: tidak ada papan peringkat (PRD), jadi
  hanya merugikan pengalaman pemain itu sendiri.
