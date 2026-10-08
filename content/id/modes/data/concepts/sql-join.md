---
id: sql-join
title: 'Menggabungkan Tabel dengan JOIN'
mode: data
order: 6
sources:
  - 'SQLite Documentation — SELECT (join-clause)'
---

Data yang rapi sering dipecah ke beberapa tabel. Contoh: tabel `pelanggan` berisi nama dan kota, tabel `pesanan` hanya menyimpan `pelanggan_id`. Untuk menampilkan nama pemesan, gabungkan keduanya dengan **JOIN**:

```sql
SELECT pelanggan.nama, pesanan.total
FROM pesanan
JOIN pelanggan ON pesanan.pelanggan_id = pelanggan.id;
```

- `ON` menjelaskan kolom mana yang **berpasangan**. Di sini `pelanggan_id` di tabel pesanan menunjuk ke `id` di tabel pelanggan.
- Tulis nama tabel di depan kolom (`pesanan.id`) bila nama kolomnya ada di dua tabel.
- Salah pasangan (mis. `pesanan.id = pelanggan.id`) tetap menghasilkan data, tapi **orangnya tertukar**. Inilah kenapa hasil query harus dicek.

JOIN bisa digabung dengan `GROUP BY`, mis. total belanja per kota.
