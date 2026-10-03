---
id: url-anatomy
title: Membaca Alamat Web (URL)
mode: soc
order: 1
sources:
  - 'BSSN — Panduan Keamanan Informasi untuk Masyarakat'
  - 'APWG — Phishing Activity Trends Report'
  - 'OWASP — Glossary'
---

**URL** adalah alamat sebuah halaman web. Contoh:

`https://login.banknusantara.co.id/masuk`

- `https://` = cara browser terhubung. Huruf **S** artinya koneksinya terenkripsi (diacak), jadi orang lain di jaringan tidak bisa mengintip isinya.
- `login.banknusantara.co.id` = **domain**, yaitu nama situsnya.
- `/masuk` = **path**, halaman di dalam situs itu.

Cari pemilik situs dengan membaca domain **dari kanan ke kiri**: lewati akhiran seperti `.co.id` atau `.com`, lalu ambil satu nama sebelumnya. Di contoh tadi pemiliknya `banknusantara`. Kata `login.` di depannya hanya **subdomain** yang dibuat pemilik itu sendiri.

Penipu suka menaruh nama bank di depan: `banknusantara.co.id.akun-aman.test`. Baca dari kanan: pemiliknya `akun-aman`, bukan bank!

Ingat juga: gembok **HTTPS** hanya berarti koneksinya terenkripsi. Situs penipu pun bisa punya gembok.
