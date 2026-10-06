---
id: testing
title: Menulis Tes yang Berguna
mode: dev
order: 6
sources:
  - 'Python Software Foundation — unittest (concepts)'
  - 'Martin Fowler — Test Pyramid'
---

Tes yang baik membuktikan kode benar, **termasuk di situasi aneh**. Pikirkan **kasus tepi** (edge case):

- Daftar **kosong** `[]` atau teks kosong `""`.
- Angka **nol** dan **negatif**.
- **Huruf kapital** dan spasi di awal/akhir teks.
- Batas aturan, misalnya tepat 17 tahun.

Tes yang **pasti lulus**, seperti `assert True` atau membandingkan sesuatu dengan dirinya sendiri, tidak menguji apa pun. Itu hanya memberi rasa aman palsu.

Saat memperbaiki bug, tambahkan **tes regresi**: tes yang akan gagal kalau bug yang sama muncul lagi.

Di review, logika baru tanpa tes yang relevan sebaiknya diberi keputusan **Revisi**. Minta penulis menambahkan tes, terutama untuk kasus tepi.
