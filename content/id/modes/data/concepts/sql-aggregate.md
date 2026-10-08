---
id: sql-aggregate
title: 'Merangkum Data: COUNT, SUM, AVG, GROUP BY'
mode: data
order: 3
sources:
  - 'SQLite Documentation — Aggregate Functions'
  - 'SQLite Documentation — SELECT (GROUP BY, HAVING)'
---

Rapat jarang butuh data per baris. Biasanya yang ditanya **ringkasannya**: berapa pesanan, berapa total, berapa rata-rata.

- `COUNT(*)` menghitung banyaknya baris.
- `SUM(total)` menjumlahkan sebuah kolom.
- `AVG(total)` menghitung rata-rata.

Untuk ringkasan **per kelompok**, pakai `GROUP BY`:

```sql
SELECT cabang, COUNT(*)
FROM pesanan
GROUP BY cabang;
```

Hasilnya satu baris per cabang. Untuk menyaring hasil kelompok, pakai `HAVING` setelah `GROUP BY`, mis. `HAVING COUNT(*) > 2`. `WHERE` menyaring baris _sebelum_ dikelompokkan, jadi tidak bisa memakai `COUNT` atau `SUM`.

Jangan menulis angka tetap seperti `SUM(total) / 5`. Hari ini datanya 5 baris, besok bisa 50. Biarkan SQL yang menghitung, misalnya dengan `AVG()`.
