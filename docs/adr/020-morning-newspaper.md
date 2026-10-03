# ADR 020 — Koran pagi "Kabar Nusa"

- Status: diterima · 3 Oktober 2026

## Konteks

PRD §5.1 menyebut "berita dampak" dan pemilik meminta koran pagi khas Papers, Please. Koran
memberi konteks cerita, menunjukkan akibat keputusan pemain, dan menyelipkan satu tips belajar.

## Keputusan

- Konten: field opsional `newspaper` di `shifts/*.json`: `headline`, `lead`, `impact`
  (`good`/`mixed`/`bad`, wajib mulai shift 2, dilarang di shift 1), `tip`, `classified`
  (iklan baris, sering dari Kelabu), dan `sources` untuk fakta di tips. `content:check` memeriksa
  panjang (≤ 60 kata per tulisan), merek nyata, dan domain.
- Engine: `newsTier(prevShift, trust)` menentukan nada berita dampak dari bintang terbaik shift
  sebelumnya dan kepercayaan saat ini (★★★ & ≥ 70 = baik; ≤ ★ atau < 50 = buruk; selain itu campuran).
  Tidak ada data baru di save.
- UI: koran adalah halaman pertama dialog briefing (sebelum Mbak Rani), bergaya kertas. Di Mode
  Latihan berita dampak tidak ditampilkan.

## Konsekuensi

- Teks koran adalah draf konten untuk direview pemilik.
- Berita dampak memakai bintang _terbaik_ shift sebelumnya; karena jalur utama memainkan tiap shift
  sekali sebelum shift berikutnya, ini sama dengan hasil kemarin.
