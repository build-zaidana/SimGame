---
id: release-rollback
title: Rilis, Commit, dan Rollback
mode: dev
order: 5
sources:
  - 'Git Documentation — git-revert'
  - 'Site Reliability Engineering (O’Reilly) — Release Engineering'
---

Kode yang sudah disetujui digabung ke repositori utama sebagai **commit**: catatan perubahan beserta pesannya, misalnya _"Perbaiki pembulatan diskon"_. Riwayat commit membuat tim tahu siapa mengubah apa dan kenapa.

**Rilis** (deploy) adalah saat kode baru dipasang ke **produksi**, yaitu aplikasi yang dipakai pengguna sungguhan.

Kalau setelah rilis angka error melonjak atau fitur penting rusak, langkah pertama adalah **rollback**: kembali ke versi sehat terakhir. Perbaikan dikerjakan sesudahnya dengan tenang, tidak terburu-buru di depan pengguna yang kesal.

Tapi bandingkan dulu angkanya. Kalau error sudah ada **sebelum** rilis, atau angkanya normal, rilis itu bukan penyebabnya. Rollback rilis yang sehat hanya membatalkan pekerjaan baik.

Perubahan besar sebaiknya dirilis **bertahap**, misalnya ke 10% pengguna dulu, sambil diawasi.
