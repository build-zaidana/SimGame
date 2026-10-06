---
id: secure-coding
title: Menulis Kode yang Aman
mode: dev
order: 7
sources:
  - 'OWASP — Top 10 (Injection, Logging)'
  - 'OWASP — Input Validation Cheat Sheet'
---

Kode yang benar belum tentu **aman**. Beberapa kebiasaan penting:

- **Periksa input**. Data dari pengguna bisa salah ketik atau sengaja aneh. Periksa tipe dan rentangnya, misalnya jumlah barang harus angka 1 sampai 100.
- **Jaga rahasia**. Kata sandi, token, dan data pribadi tidak boleh ditulis di kode atau dicetak ke log.
- **Pustaka resmi**. Pakai pustaka dari sumber resmi kantor. Kode tempelan dari forum bisa berisi bug atau titipan berbahaya.
- **Waspada perubahan aneh**. PR dari akun yang tidak dikenal, atau kode yang diam-diam mengirim data ke alamat luar, adalah tanda bahaya. Jangan disetujui atau diperbaiki sendiri: **eskalasi ke tim SOC** supaya diperiksa.

Kode aman bukan soal paranoid, tapi kebiasaan kecil yang dilakukan setiap hari.
