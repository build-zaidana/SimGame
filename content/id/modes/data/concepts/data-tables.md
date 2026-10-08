---
id: data-tables
title: 'Tabel, Baris, dan SELECT'
mode: data
order: 1
sources:
  - 'SQLite Documentation — SELECT (sqlite.org/lang_select.html)'
---

Data di kantor biasanya disimpan dalam **tabel**: setiap **baris** satu hal (mis. satu pelanggan), setiap **kolom** satu keterangan (nama, kota, umur).

**SQL** (_Structured Query Language_) adalah bahasa untuk bertanya ke database. Bentuk dasarnya:

```sql
SELECT nama, kota
FROM pelanggan
WHERE kota = 'Bandung';
```

- `SELECT` memilih kolom. `*` berarti semua kolom.
- `FROM` menyebut tabelnya.
- `WHERE` menyaring baris. Teks diapit tanda kutip tunggal, angka tidak.
- `AND` / `OR` menggabungkan beberapa syarat.
- `ORDER BY poin DESC` mengurutkan dari yang terbesar, `LIMIT 3` mengambil 3 baris teratas.

Hati-hati dengan **batas**: "minimal 120" berarti `>= 120`. Kalau ditulis `> 120`, pelanggan dengan tepat 120 poin ikut tertinggal.

Di game ini kamu menulis SQL sungguhan untuk **SQLite**, database kecil yang juga dipakai di banyak aplikasi HP.
