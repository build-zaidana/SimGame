# ADR 019 — Meja kerja bergaya "Papers, Please"

- Status: diterima · 3 Oktober 2026

## Konteks

Umpan balik pemilik setelah mencoba Shift 1: meja kerja terasa seperti formulir web, kurang
menarik dibanding Papers, Please. Mekanik inti (bukti + keputusan + aturan) sudah ada; yang kurang
adalah rasa fisik, karakter, dan "bobot" setiap keputusan.

## Keputusan

Semua perubahan di lapisan UI (`app/`) dan kontrak mode; engine dan bentuk save tidak berubah.

1. **Kertas di atas meja.** Panel dokumen memakai permukaan kayu gelap (`.desk-surface`); dokumen
   adalah kertas krem (`.paper`) yang meluncur masuk. `.paper` menimpa token warna untuk subtree-nya,
   jadi komponen dokumen tiap tipe kasus tidak berubah. Kontras di kertas tetap ≥ 4.5:1 (axe di e2e).
2. **Orang di loket.** Kontrak `CaseTypeDef` mendapat `visitor?(c)` opsional: nama, peran, dan satu
   kalimat netral yang **tidak boleh membocorkan jawaban**. Potret pixel 12×14 digambar dari kode
   (`ui/Avatar.tsx`, deterministik dari nama lewat `engine/rng.hashString`); tanpa file gambar.
   Mbak Rani dan Kelabu juga mendapat potret di dialog.
3. **Stempel.** Keputusan menghantam kertas dengan stempel besar (+ getar kecil dan bunyi "duk"),
   lalu slip umpan balik bergaya kertas muncul 650 ms kemudian. Kesalahan yang merugikan klien
   mendapat baris PERINGATAN/CATATAN seperti "citation" di Papers, Please. Dengan "kurangi animasi",
   slip langsung muncul dan semua animasi mati.
4. **HUD.** Jam LCD + bar sisa shift, meter kepercayaan dengan angka yang melayang (+1 / −15),
   jumlah kasus menunggu. Kasus baru berdenyut di antrian dan berbunyi.
5. **Suara.** Tetap WebAudio sintetis (stempel, kasus masuk, bel akhir shift) dan mengikuti
   pengaturan "Efek suara".
6. **Layar judul.** Terminal SOC + potret tokoh, bukan hanya teks.

Tidak ada dependensi atau aset baru. Bundel naik ±2 kB gzip.

## Tambahan: resolusi seni lebih tinggi

Masukan pemilik: gaya pixel dipertahankan, tapi jangan terlalu kotak. Seni digambar ulang lewat
`ui/pixel/canvas.ts` (elips dengan bayangan dari kiri atas, outline otomatis, satu `<path>` per warna):
potret 32×32 (sebelumnya 12×14) dan ilustrasi kantor 128×72 (sebelumnya 64×36). Hasil di-cache per
wajah; tetap tanpa file gambar.

## Konsekuensi

- Nama karyawan & kalimat pelapor ada di `src/i18n/id.ts` (`soc.visitors`): perlu direview pemilik.
- Langkah berikutnya yang mungkin: koran pagi per shift (berita dampak, PRD §5.1) dan musik (C2).
