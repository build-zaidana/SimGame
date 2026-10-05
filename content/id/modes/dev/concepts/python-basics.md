---
id: python-basics
title: Dasar Python untuk Developer Pemula
mode: dev
order: 1
sources:
  - 'Python Software Foundation — The Python Tutorial'
  - 'MicroPython Documentation — Differences from CPython'
---

**Python** adalah bahasa pemrograman yang mudah dibaca. Beberapa hal penting:

- **Variabel** menyimpan nilai: `total = 0`.
- **Fungsi** adalah resep yang bisa dipanggil ulang. Fungsi ditulis dengan `def` dan mengembalikan hasil dengan `return`.
- **Indentasi** (4 spasi) menandai isi blok setelah `if`, `for`, atau `def`. Salah indentasi = kode salah.
- **Tipe data**: angka (`5000`) dan teks (`"Rp"`) berbeda. Untuk menggabungkan, ubah dulu angka jadi teks: `"Rp " + str(5000)`.
- **Perulangan** `for x in daftar:` mengerjakan sesuatu untuk setiap isi daftar. `len(daftar)` memberi tahu banyaknya isi.

Contoh:

```python
def rata_rata(nilai):
    return sum(nilai) / len(nilai)
```

Hati-hati dengan **batas**: `umur > 17` tidak memasukkan umur 17, sedangkan `umur >= 17` memasukkannya.

Python di game ini adalah **MicroPython**, versi ringkas yang berjalan di browser. Hampir semua dasar Python bisa dipakai.
