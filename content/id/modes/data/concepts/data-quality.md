---
id: data-quality
title: 'Data Kotor dan Cara Membersihkannya'
mode: data
order: 5
sources:
  - 'DAMA International — DAMA-DMBOK: Data Management Body of Knowledge (2nd ed.)'
  - 'SQLite Documentation — NULL Handling'
---

Data dari formulir, kasir, atau impor file sering **kotor**. Analisis dari data kotor menghasilkan kesimpulan yang salah, jadi bersihkan dulu.

Tiga masalah yang paling sering:

1. **Baris ganda**: pendaftar yang menekan tombol kirim dua kali tercatat dua kali. Total donasi jadi membengkak. Cari dengan `GROUP BY email HAVING COUNT(*) > 1`.
2. **Nilai kosong (NULL)**: NULL berarti "tidak diketahui", bukan nol. Cari dengan `WHERE email IS NULL`. Menulis `= NULL` tidak pernah menemukan apa pun.
3. **Nilai mustahil**: umur 230 tahun atau tanggal 31 Februari pasti salah ketik. Saring atau perbaiki dulu, misalnya `WHERE umur > 0 AND umur < 120`.

`SELECT DISTINCT kota` menampilkan setiap nilai sekali saja, berguna untuk melihat ejaan yang berbeda ("Bdg" dan "Bandung").

Data yang sudah bersih dan konsisten boleh langsung dipakai.
