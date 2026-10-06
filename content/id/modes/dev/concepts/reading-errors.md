---
id: reading-errors
title: Tes & Pesan Error
mode: dev
order: 2
sources:
  - 'Python Software Foundation — Errors and Exceptions'
  - 'Python Software Foundation — The assert statement'
---

**Tes** memeriksa apakah kode berperilaku sesuai janji. Di game ini, tes ditulis dengan `assert`:

```python
assert rata_rata([80, 90, 100]) == 90
```

Kalau hasilnya tidak sama, tes **gagal**. Developer bekerja dengan siklus: jalankan tes → baca yang gagal → perbaiki satu hal → jalankan lagi.

Ada juga **tes tersembunyi** untuk **kasus tepi** (edge case): daftar kosong, huruf kapital, angka nol. Pikirkan kemungkinan itu sebelum mengirim.

Saat kode error, Python menampilkan **traceback**. Baca dari **baris terakhir**:

- `NameError`: nama variabel/fungsi salah ketik atau belum dibuat.
- `TypeError`: tipe data tidak cocok, misalnya teks + angka.
- `IndentationError`/`SyntaxError`: penulisan kode tidak sesuai aturan, misalnya lupa `:` atau indentasi berantakan.

Nomor baris di traceback menunjukkan di mana masalahnya terjadi.
