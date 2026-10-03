# ADR 017 — Penyetelan ulang ekonomi (gaji, harga alat, kepercayaan)

- Status: diterima · 3 Oktober 2026

## Konteks

Angka ekonomi M3 ditulis tanpa diuji. `scripts/economy-sim.ts` memainkan kelima shift konten asli
dengan rumus engine yang sebenarnya untuk tiga profil pemain (pemula, rata-rata, mahir; mode Santai,
belanja serakah). Hasil sebelum penyetelan (2.000 run per profil):

- **Gaji hampir tidak bergantung kemampuan.** `base + 10 × benar` dengan base 100–140 membuat
  pemula dibayar 86% gaji pemain mahir, dan bukti tidak berpengaruh sama sekali pada gaji.
- **Toko bukan pilihan.** Semua profil membeli keempat alat tepat saat terbuka, lalu dompet
  menumpuk (Rp 230–370 di awal Shift 5) tanpa ada yang bisa dibeli.
- **Kepercayaan pemula runtuh.** Kepercayaan terbawa antar-shift tanpa pemulihan; median pemula
  turun 70 → 28 di Shift 5 (persentil-10: 2), sehingga meter tidak lagi bermakna.

## Keputusan

1. **Gaji sebanding skor kasus:** `gaji = pay.base + round(pay.perCase × Σ skor / 100)`. Field
   konten `perCorrect` diganti `perCase` (gaji satu kasus bernilai 100). Bukti yang lengkap kini
   ikut menaikkan gaji, sejalan dengan PRD (keputusan benar tanpa bukti hanya nilai sebagian).
   Laporan Shift menampilkan rinciannya (pokok + dari skor kasus).
2. **Pemulihan kepercayaan antar-shift:** `carryTrust` — bila di bawah 75, separuh selisihnya
   pulih (dibulatkan ke atas) saat shift disimpan. Δ per kasus (ARCHITECTURE §6.2) tidak berubah,
   jadi kesalahan tetap terasa di shift itu dan di bintangnya. Laporan Shift memberi tahu pemain.
3. **Angka baru:** gaji Shift 1–3 `{40, 12}`, Shift 4–5 `{50, 12}`; harga Pemeriksa Tautan 50,
   Cek WHOIS 80, Sandbox 130, Filter Log 130.

Bentuk save tidak berubah (`trust` tetap angka), jadi `SAVE_SCHEMA_VERSION` tidak naik.

## Hasil simulasi (3.000 run per profil)

| Profil    | Gaji S1 → S5 | Kepercayaan S5 (p10/median) | Alat                                                                             |
| --------- | ------------ | --------------------------- | -------------------------------------------------------------------------------- |
| Pemula    | 97 → 125     | 38 / 60                     | WHOIS sebelum S3; Sandbox/Filter Log satu di S4, kedua di S5 (95%)               |
| Rata-rata | 118 → 159    | 66 / 85                     | Pilih satu dari Pemeriksa Tautan/WHOIS di S2, satu dari Sandbox/Filter Log di S4 |
| Mahir     | 133 → 187    | 97 / 100                    | Semua alat tepat saat terbuka                                                    |

Pemain mahir tetap mendapat semua alat lebih awal, rata-rata harus memilih, dan pemula tetap
memperoleh semua alat sebelum shift terakhir (alat juga materi belajar, jadi tidak boleh terkunci
terlalu lama). Distribusi bintang tidak berubah.

## Konsekuensi

- Profil pemain di simulator adalah asumsi; setel ulang dengan data playtest (`pnpm sim:economy`).
- Setelah semua alat terbeli, gaji belum punya kegunaan lain. Perlu barang/alat baru bila mode
  diperluas.
