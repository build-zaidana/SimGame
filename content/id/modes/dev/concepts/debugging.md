---
id: debugging
title: 'Debugging: Memburu Bug'
mode: dev
order: 4
sources:
  - 'Python Software Foundation — Errors and Exceptions'
  - 'Python Software Foundation — The Python Tutorial'
---

**Debugging** adalah mencari tahu kenapa kode tidak berjalan seperti yang diharapkan.

Langkahnya:

1. **Ulangi bug** dengan contoh kecil. Misalnya, panggil fungsinya dengan daftar berisi dua angka saja.
2. **Lihat isinya**. Tambahkan `print()` untuk menampilkan nilai variabel di tengah perulangan, lalu bandingkan dengan perkiraanmu.
3. **Baca error dari bawah**. `IndexError` berarti mengambil urutan yang tidak ada di daftar. `KeyError` berarti kunci itu tidak ada di kamus (dict).
4. **Perbaiki satu hal**, lalu jalankan tes lagi.

Bug paling sering muncul di **batas**. `range(5)` menghasilkan 0 sampai 4, bukan 5. Indeks daftar dimulai dari 0, jadi isi terakhir ada di `daftar[len(daftar) - 1]`.

Jangan lupa menghapus `print()` percobaan sebelum mengirim kode.
