---
id: log-reading
title: Membaca Log Login
mode: soc
order: 5
sources:
  - 'NIST SP 800-92 — Guide to Computer Security Log Management'
  - 'OWASP — Logging Cheat Sheet'
  - 'BSSN — Panduan Keamanan Informasi untuk Masyarakat'
---

**Log** adalah catatan otomatis kejadian di sistem: siapa login, kapan, dari mana (alamat **IP**, yaitu alamat jaringan perangkat), pakai perangkat apa, dan berhasil atau gagal.

Pola yang patut dicurigai:

1. **Brute force**: banyak login gagal dari satu IP dalam waktu singkat, tanda seseorang menebak-nebak password. Jika akhirnya ada yang **berhasil**, akun kemungkinan sudah dibobol.
2. **_Impossible travel_** (perjalanan mustahil): login dari Jakarta, lalu 10 menit kemudian dari negara lain. Tidak ada orang yang bisa berpindah secepat itu.
3. **Jam tidak wajar**: login pukul 3 pagi dari perangkat baru, padahal pemilik akun bekerja pagi sampai sore.

Satu baris log jarang cukup. Bandingkan beberapa baris, lalu cocokkan dengan info lain seperti absensi, dinas luar, atau laporan karyawan. Alat **Filter Log** membantu merangkum login per IP.
