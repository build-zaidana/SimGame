# ADR 024 — Kantor top-down dengan Phaser 4 (PRD C1)

- Status: diterima · 3 Oktober 2026

## Konteks

PRD C1 / ARCHITECTURE §10: HUB v1.1 menjadi scene top-down tempat pemain berjalan ke meja dan
bicara dengan NPC. CLAUDE.md mewajibkan Phaser v4, di `src/hub/phaser/`, dimuat dinamis, dan
mengikuti dokumentasi + template resmi terbaru (bukan API Phaser 3 dari ingatan).

## Keputusan

- **Dependensi baru: `phaser@4.2.1`** (versi `latest` di npm, MIT). Alasan: PRD C1 dan
  ARCHITECTURE §10 sudah memilih Phaser untuk HUB. Rujukan yang dipakai: dokumentasi & skill resmi
  di paket (`docs/Phaser 4 Pixel Art Guide`, `skills/v3-to-v4-migration`,
  `skills/game-setup-and-config`, tipe `types/phaser.d.ts`) dan template resmi
  `phaserjs/template-react-ts` (pola `new Game({ parent })` + `game.destroy(true)` saat unmount).
  API v3 yang dihapus di v4 (mis. `TextureManager.generate`) tidak dipakai; tekstur dibuat dari
  `<canvas>` lewat `textures.addCanvas`.
- **Logika di luar Phaser.** `src/hub/officeMap.ts` (murni, teruji): dinding & perabot padat, zona
  interaksi, gerak keyboard dengan tabrakan per sumbu (meluncur di dinding, tidak bisa menembus),
  dan ketuk-untuk-berjalan. Phaser (`src/hub/phaser/createGame.ts`) hanya menggambar dan meneruskan
  input. Tidak memakai mesin fisika.
- **Seni** 320×192 dan karakter 16×16 digambar dari kode (`src/hub/officeArt.ts`, kanvas pixel yang
  sama dengan potret). Config `pixelArt: true` + `Scale.FIT` sesuai panduan pixel art Phaser 4.
- **Interaksi**: meja (masuk shift), Mbak Rani (tips acak dari aturan bab yang sudah terbuka),
  toko alat, rak buku panduan, papan lencana. Kontrak React↔Phaser di `src/hub/hubTypes.ts`
  (callback `onNear` / `onInteract`), tanpa EventBus global.
- **Aksesibilitas**: kanvas berperan `application` dengan label & petunjuk; keyboard Phaser hanya
  mendengar saat kanvas difokus (`input.keyboard.target`), jadi panah/spasi tidak dicuri dari halaman.
  Bar di bawah kanvas (`role="status"`) mengumumkan tempat terdekat dan punya tombol aksi. Semua
  tujuan tetap ada sebagai tombol biasa di HUB.
- **Pengaturan** "Kantor yang bisa dijelajahi" (save v7, `settings.exploreOffice`, bawaan menyala;
  migrasi v6→v7). Mati, atau Phaser gagal dimuat → ilustrasi statis lama.
- **Ukuran**: Phaser ada di chunk lazy sendiri (±358 kB gzip, batas 380 kB di `.size-limit.json`),
  tidak di bundle awal (±132 kB). Chunk ini ikut di-precache PWA agar kantor bisa dibuka offline.

## Konsekuensi

- Unduhan total naik ±358 kB gzip saat service worker pertama kali dipasang.
- Phaser tanpa audio (`noAudio`) karena musik & efek suara sudah lewat WebAudio sendiri.
- Mode karier baru cukup menambah meja di `DESKS` (officeMap) dan registry mode.
