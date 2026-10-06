---
id: code-review
title: Review Kode & Pull Request
mode: dev
order: 3
sources:
  - 'Google Engineering Practices — How to do a code review'
  - 'OWASP — Secrets Management Cheat Sheet'
---

Di tim developer, kode baru dikirim sebagai **pull request (PR)**: usulan perubahan yang dibaca rekan sebelum digabung ke aplikasi utama. Baris berawalan **+** ditambahkan, baris **−** dihapus.

Saat **review**, tanyakan:

1. **Benarkah?** Apakah logikanya sesuai tujuan, termasuk batas (`>` vs `>=`) dan kasus tepi?
2. **Terbaca?** Apakah nama variabel jelas?
3. **Aman?** Apakah ada **rahasia** (kata sandi, kunci API) yang ditulis langsung di kode? Rahasia di kode bisa dibaca siapa pun yang punya akses ke repositori, jadi harus disimpan di pengaturan rahasia.

Keputusanmu:

- **Setujui** bila kodenya baik. Menahan kode yang benar memperlambat tim.
- **Revisi** bila ada masalah. Tandai baris yang bermasalah supaya penulis tahu apa yang diperbaiki.
- **Eskalasi** bila butuh izin atau keahlian khusus.
