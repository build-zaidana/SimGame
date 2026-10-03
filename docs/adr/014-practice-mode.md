# ADR 014 — Mode Latihan (PRD S5)

- Status: diterima · 3 Oktober 2026

## Konteks

Sebelumnya, setelah shift terakhir yang tersedia selesai, tombol utama menjadi "Ulangi Shift N" dan
hasilnya disimpan seperti shift biasa, termasuk gaji, sehingga pemain bisa mengumpulkan gaji berulang.
PRD S5 meminta Mode Latihan: mengulang shift mana pun tanpa memengaruhi progres utama.

## Keputusan

- **Slot terpisah di save** (`ModeProgress.practiceSession`, save **v3**; migrasi v2→v3 tanpa perubahan
  data). Latihan tidak menimpa shift utama yang sedang berjalan; keduanya bisa dilanjutkan setelah reload.
- **Jalur utama hanya maju**: `nextShift` mengembalikan shift dengan `order === unlockedShift` saja.
  Setelah semua shift selesai, mengulang hanya lewat Latihan.
- **Latihan tidak menulis apa pun ke progres**: gaji, kepercayaan, skor terbaik, shift terbuka, dan
  Leitner (konsep maupun soal review) tidak berubah. Laporan dan Review Cepat tetap ditampilkan untuk
  belajar. Hanya shift yang sudah pernah selesai yang bisa dilatih.
- Event telemetri `shift_started`/`shift_completed` membawa `practice`, sehingga Laporan Belajar
  membedakan shift latihan.

## Alternatif ditolak

- Mencatat jawaban latihan ke Leitner: membuat latihan memengaruhi jadwal review utama, bertentangan
  dengan "tanpa memengaruhi progres utama". Bisa ditinjau lagi setelah uji main.
