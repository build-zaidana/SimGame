# PRD — ShiftIT (working title)

> Game web edukasi karier IT untuk pelajar/mahasiswa pemula Indonesia.
> Mode pertama: **Cybersecurity Analyst (Meja SOC)**.
> Versi dokumen: 1.0 · 2 Oktober 2026 · Pemilik: Zaidana

---

## 1. Ringkasan

ShiftIT adalah game simulasi kerja di browser. Pemain bekerja satu "shift" di sebuah perusahaan jasa IT fiktif, **PT Nusa Digital**. Mode pertama menempatkan pemain di **meja SOC (Security Operations Center)**. Di sana, email, alert login, file, dan permintaan akses masuk satu per satu, dan pemain harus memutuskan: **Izinkan, Blokir, atau Eskalasi**. Keputusan harus disertai **bukti** yang ditandai langsung di dokumen.

Gameplay-nya terinspirasi *Papers, Please* (memeriksa dokumen terhadap buku aturan yang makin tebal), dengan dialog pendek ala *Undertale* dan visual pixel 2D ringan ala *Growtopia/Among Us*. Materi tidak ditaruh di depan seperti kelas. Materi adalah **Buku Panduan SOC** yang terbuka bab demi bab, dan soal adalah **kasus itu sendiri** ditambah review singkat di akhir shift.

Game ini dirancang sebagai **platform multi-mode**. Mode karier berikutnya (IT Support, Software Engineer, Data/AI) ditambahkan sebagai *paket mode* tanpa mengubah inti engine.

## 2. Masalah dan peluang

- Pelajar Indonesia jarang punya gambaran nyata seperti apa pekerjaan IT bergaji tinggi, padahal 5 pekerjaan tumbuh tercepat versi WEF 2025 semuanya pekerjaan digital, termasuk *security management specialist*.
- Materi keamanan siber untuk pemula biasanya berupa teks/video pasif. Penipuan digital yang sangat dekat dengan keseharian (APK "undangan" atau "resi paket" via WhatsApp, minta kode OTP, link bank palsu) jarang dilatih sebagai *keterampilan mengambil keputusan*.
- Peluang: game pendek (6–8 menit per shift), bisa dimainkan di HP Android, yang melatih **mengenali tanda bahaya** dan sekaligus mengenalkan **profesi analis keamanan**.

## 3. Tujuan & non-tujuan

### Tujuan (v1.0)
1. Pemain pemula bisa menyelesaikan 5 shift Mode SOC dan **menguasai 6 konsep inti** (lihat §7).
2. Belajar terasa seperti bermain: tidak ada "halaman materi wajib" sebelum boleh main.
3. Jalan lancar di **laptop dan HP Android kelas menengah ke bawah** (Chrome, layar 360×640 ke atas).
4. Tanpa login dan tanpa server untuk bermain: progres **tersimpan di device pemain**, dan bisa dipindah ke perangkat lain lewat **kode/file ekspor save**.
5. Arsitektur yang membuat **mode karier baru = menambah folder**, bukan merombak engine.

### Non-tujuan (v1.0)
- Akun, login, dan sinkronisasi cloud (v1.1+, lewat Supabase; arsitektur sudah disiapkan).
- Dashboard guru / kelas / kode join (dipertimbangkan untuk v2).
- Multiplayer, chat antar pemain, leaderboard publik.
- Konten yang dibuat AI saat runtime.
- 3D, atau aplikasi native (Play Store). PWA dulu.
- Mengajarkan teknik menyerang (hacking ofensif). Fokusnya **defensif**.

## 4. Target pengguna

| Persona | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Raka, 16, siswa SMK TJKT** | Main di HP Android 3–4 GB RAM, kuota terbatas, suka game kasual. | Sesi pendek, ukuran unduhan kecil, bahasa santai, langsung main. |
| **Nadia, 19, mahasiswa semester 1** | Penasaran karier cyber, belum tahu harus mulai dari mana. | Gambaran kerja nyata, istilah teknis dijelaskan, rasa progres. |
| **Pemain umum** | Ingin lebih aman dari penipuan online. | Contoh yang dekat dengan kehidupan sehari-hari. |

Bahasa: **Indonesia** (istilah teknis Inggris tetap dipakai, lalu dijelaskan, misalnya *phishing*, *MFA*, *log*). Struktur kode sudah siap i18n untuk bahasa Inggris nanti.

## 5. Konsep game

### 5.1 Struktur layar
```
Judul → (langsung main, tanpa daftar) → HUB → Meja Kerja (mode) → Laporan Shift → HUB
```
- **HUB**: kantor PT Nusa Digital. Di v1.0 berupa **menu bergaya kantor** (ilustrasi pixel, pintu/meja yang bisa diklik). Di v1.1 menjadi **scene top-down Phaser** tempat pemain berjalan ke meja dan bicara dengan NPC. Meja mode lain tampil tapi **terkunci** ("Segera hadir").
- **Meja Kerja SOC**: layar utama gameplay (§5.2).
- **Laporan Shift**: skor, kesalahan dan penjelasannya, review cepat, berita dampak.

### 5.2 Core loop Meja SOC
```
Shift dimulai (jam in-game 09:00, briefing 1–2 baris dari mentor)
  └─ Kasus masuk ke Antrian ──┐
       1. Buka kasus (email / alert login / file / permintaan akses / URL)
       2. Periksa: bandingkan dengan aturan di Buku Panduan SOC
       3. Tandai bukti: ketuk bagian yang mencurigakan (domain, lampiran, jam login…)
       4. Putuskan: IZINKAN · BLOKIR · ESKALASI (+ aksi terbuka bertahap: RESET PASSWORD, KARANTINA)
       5. Umpan balik singkat langsung (benar/salah + 1 kalimat alasan)
  └─ Ulangi sampai jam shift habis atau antrian kosong
Laporan Shift → Review Cepat (3–5 soal) → Gaji & Kepercayaan → Shift berikutnya terbuka
```

**Mekanik kunci**
- **Penandaan bukti (evidence tagging)**: keputusan yang benar *tanpa* bukti yang benar hanya dapat nilai sebagian. Ini mencegah tebak-tebakan dan melatih alasan yang tepat.
- **Buku Panduan SOC** (rulebook): panel yang bisa dibuka kapan saja. Tiap bab = satu konsep dengan aturan praktis + kartu materi singkat (≤150 kata + contoh). Bab baru terbuka di awal shift tertentu.
- **Jam shift**: tekanan waktu ringan. Di mode **Santai** (default untuk pemula) jam tidak mengurangi skor; di mode **Normal**, kasus yang tidak selesai dihitung terlewat.
- **Meter Kepercayaan Klien** (0–100): turun saat salah izinkan ancaman (dampak besar) atau salah blokir email sah (dampak kecil, karena mengganggu kerja). Mengajarkan bahwa keamanan juga soal keseimbangan.
- **Gaji (koin)**: dipakai membeli **alat** yang membuka mekanik baru, sekaligus materi baru:
  - *Pemeriksa Tautan* (melihat URL asli di balik teks link) → konsep URL
  - *Cek WHOIS* (umur domain) → konsep domain palsu
  - *Sandbox* (melihat perilaku file) → konsep malware
  - *Filter Log* (menyaring login gagal per IP) → konsep log
- **Mentor**: NPC **Mbak Rani** (analis senior). Tombol *Tanya Mentor* memberi petunjuk bertingkat (petunjuk ke-1 gratis, ke-2 memotong sedikit bonus). Pemula tidak boleh terjebak.
- **Antagonis**: kelompok peretas fiktif **"Kelabu"**. Mereka muncul lewat pesan singkat antar-shift dan serangannya makin canggih tiap shift. Shift 5 = kampanye serangan berlapis (mini "boss").

### 5.3 Materi & soal (menyatu dengan gameplay)
| Lapisan | Bentuk | Kapan |
|---|---|---|
| Materi | Bab Buku Panduan + kartu konsep | Terbuka di awal shift; bisa dibaca ulang kapan saja |
| Latihan | Kasus di meja (keputusan + bukti) | Selama shift |
| Umpan balik | Penjelasan per kasus yang salah | Langsung + di Laporan Shift |
| Evaluasi | Review Cepat 3–5 soal (pilihan ganda / tandai bagian / urutkan langkah) | Akhir shift |
| Retensi | Soal ulang berjarak (*spaced repetition*, Leitner 3 kotak) dari konsep yang pernah salah | Diselipkan ke Review Cepat shift berikutnya |
| Pengukuran | Pre-test 5 soal (opsional, sebelum Shift 1) & post-test 5 soal (setelah Shift 5) | Untuk mengukur dampak belajar |

### 5.4 Nada & gaya
- Visual: pixel art 2D, palet terbatas, UI seperti "OS kantor" retro. Pakai aset **CC0** (mis. Kenney) sebagai awal.
- Tulisan: santai, hangat, sedikit humor (gaya dialog Undertale), **tidak menakut-nakuti**. Kalimat pendek.
- Semua merek, bank, kurir, dan orang dalam game **fiktif** (mis. *Bank Nusantara*, *KirimCepat*, *PT Nusa Digital*). Domain contoh memakai domain fiktif atau yang memang dicadangkan untuk contoh (`example.com`, `.test`).

## 6. Fitur & prioritas (MoSCoW) — v1.0

### Must
- M1. Meja SOC responsif (desktop 3 panel; HP: tab Antrian / Dokumen / Panduan + bar aksi bawah).
- M2. 4 tipe kasus: **Email**, **Alert Login**, **File/Lampiran**, **URL/Permintaan Akses**.
- M3. Penandaan bukti + keputusan + umpan balik langsung.
- M4. Buku Panduan SOC dengan 6 bab (§7) yang terbuka bertahap.
- M5. 5 shift, masing-masing 8–12 kasus, ±6–8 menit.
- M6. Laporan Shift + Review Cepat + spaced repetition sederhana.
- M7. Gaji, Kepercayaan, dan 4 alat yang bisa dibeli.
- M8. Progres tersimpan otomatis di device (IndexedDB), termasuk posisi di tengah shift. Game meminta penyimpanan persisten (`navigator.storage.persist()`) dan memperingatkan pemain bahwa menghapus data browser = menghapus progres.
- M9. **Ekspor/Impor save**: unduh file `.shiftit` atau salin kode teks untuk pindah perangkat atau cadangan. Save punya nomor versi skema + migrasi, dan diverifikasi saat impor (checksum, bukan anti-cheat).
- M10. HUB versi menu (pilih mode; mode lain terkunci).
- M11. Pengaturan: ukuran teks, mode Santai/Normal, kurangi animasi, suara on/off.
- M12. Validasi konten otomatis (skema + referensi konsep) di CI.

### Should
- S1. Dialog mentor & antagonis antar-shift (cerita "Kelabu").
- S2. Pre-test / post-test.
- S3. PWA (bisa di-*install*, aset tercache, offline).
- S4. Variasi kasus prosedural (mis. generator domain *typosquatting*) agar shift bisa diulang dengan isi berbeda.
- S5. Mode **Latihan**: ulangi shift mana pun tanpa memengaruhi progres utama.

- S6. Analitik anonim opsional (dimatikan default lewat feature flag): event belajar dikirim tanpa akun dan tanpa data pribadi, hanya ID instalasi acak. Bisa dinyalakan saat uji main atau setelah rilis.

### Could (v1.1+)
- C0. Akun & sinkronisasi cloud (Supabase): tamu → akun anonim → simpan permanen via Google/email; save device menjadi sumber yang disinkronkan.
- C1. HUB top-down Phaser (berjalan, NPC, meja terkunci terlihat).
- C2. Efek suara/musik chiptune.
- C3. Lencana/pencapaian.
- C4. Bahasa Inggris.

### Won't (v1.0)
- Dashboard guru, multiplayer, leaderboard publik, konten AI runtime, 3D.

## 7. Kurikulum Mode SOC (v1.0)

| # | Konsep (`conceptId`) | Isi inti | Shift buka | Alat terkait |
|---|---|---|---|---|
| 1 | `url-anatomy` | Bagian URL; domain asli vs subdomain palsu (`banknusantara.co.id.verifikasi-akun.test`); HTTPS ≠ aman | 1 | Pemeriksa Tautan |
| 2 | `phishing-signs` | Tanda phishing: urgensi, pengirim mirip, salam generik, minta data/OTP, lampiran tak terduga | 1–2 | — |
| 3 | `passwords-mfa` | Password kuat, password manager, MFA, **jangan pernah bagikan OTP**, reset password | 3 | — |
| 4 | `malware-files` | Ekstensi berbahaya (`.apk`, `.exe`, `.scr`), ekstensi ganda (`resi.pdf.apk`), makro dokumen | 4 | Sandbox |
| 5 | `log-reading` | Membaca log login: brute force (banyak gagal dari 1 IP), *impossible travel*, jam tidak wajar | 4–5 | Filter Log |
| 6 | `incident-response` | Alur dasar: deteksi → batasi (*contain*) → bersihkan → pulihkan → laporkan; kapan eskalasi | 5 | — |

Setiap konsep minimal punya: 1 kartu materi, 2–3 aturan Buku Panduan, ≥6 kasus, ≥4 soal review. Rujukan isi: BSSN, panduan anti-phishing APWG, NIST Cybersecurity Framework / SP 800-61 (insiden), OWASP (untuk istilah). Akurasi harus dicek manusia (lihat §11).

### Rencana shift
| Shift | Judul | Konsep baru | Kasus | Kejutan |
|---|---|---|---|---|
| 1 | Hari Pertama | 1, 2 (dasar) | 8 | Tutorial terpandu oleh Mbak Rani |
| 2 | Kotak Masuk Penuh | 2 (lanjut) | 10 | Email sah yang *terlihat* mencurigakan (melatih tidak asal blokir) |
| 3 | Kode Rahasia | 3 | 10 | Klien menelepon minta OTP "dari IT" |
| 4 | Paket Tak Dikenal | 4, 5 (dasar) | 11 | APK "resi paket" menyebar via chat |
| 5 | Kelabu Datang | 5, 6 | 12 | Serangan berlapis: phishing → login aneh → file berbahaya |

## 8. User stories utama

1. Sebagai **pemain baru**, saya bisa menekan "Main" dan sudah memeriksa email pertama **dalam 60 detik** tanpa membuat akun.
2. Sebagai pemain, saat saya **salah**, saya langsung tahu **kenapa** dan bab Panduan mana yang perlu dibaca.
3. Sebagai pemain di **HP**, semua tombol mudah diketuk (≥44 px) dan teks dokumen tetap terbaca tanpa zoom.
4. Sebagai pemain, saya bisa **berhenti di tengah shift** dan melanjutkannya nanti dari kasus yang sama.
5. Sebagai pemain, saya bisa **mengekspor save** di HP lalu mengimpornya di laptop untuk melanjutkan.
6. Sebagai **pengembang**, saya bisa menambah kasus baru hanya dengan menambah file JSON, lalu `pnpm content:check` memberi tahu kalau ada yang salah.
7. Sebagai **pengembang**, saya bisa menambah mode karier baru dengan membuat folder `src/modes/<mode>` yang mengikuti kontrak `CareerMode`.

## 9. Kebutuhan non-fungsional

| Area | Target |
|---|---|
| Perangkat | Chrome Android 10+ (RAM 3 GB), Chrome/Edge/Firefox/Safari desktop versi terbaru-2 |
| Viewport | 360×640 sampai 1920×1080; orientasi potret & lanskap di HP |
| Ukuran awal | JS awal ≤ **250 KB gzip** (tanpa Phaser); total unduhan sampai Shift 1 bisa dimainkan ≤ **2 MB** |
| Performa | LCP ≤ 2,5 detik di 4G lambat (Lighthouse mobile); interaksi < 100 ms; Phaser hanya dimuat saat HUB top-down dibuka (v1.1) |
| Offline | Shift yang sudah dimulai bisa diselesaikan tanpa internet; sinkron otomatis saat online |
| Aksesibilitas | WCAG 2.1 AA untuk UI DOM: kontras, fokus keyboard, label aria, tidak bergantung warna saja, ukuran teks bisa diperbesar, "kurangi animasi" |
| Privasi | v1.0 tidak mengumpulkan data pribadi: progres hanya ada di device. Nama tampilan = nickname lokal. Tidak ada iklan atau pelacak pihak ketiga. Analitik anonim mati secara default (S6). Banyak pengguna mungkin di bawah 18 tahun: periksa kewajiban **UU PDP (UU 27/2022)** soal data anak sebelum menyalakan analitik publik atau login (v1.1). |
| Keamanan | Save yang diimpor divalidasi skema (zod) dan tidak pernah dieksekusi; batas ukuran file impor. Saat cloud ditambahkan (v1.1): RLS di semua tabel, Turnstile untuk sign-in anonim, hanya anon key di frontend. |

## 10. Metrik keberhasilan (8 minggu setelah rilis)

| Metrik | Target |
|---|---|
| Pemain baru yang menyelesaikan Shift 1 | ≥ 70% |
| Pemain yang menyelesaikan Shift 5 | ≥ 30% |
| Kenaikan skor pre → post test | ≥ +30 poin persentase |
| Akurasi bukti rata-rata Shift 5 vs Shift 1 | naik ≥ 25% |
| Retensi D7 | ≥ 15% |
| Durasi sesi median | 8–15 menit |

Cara mengukur di v1.0 (tanpa backend):
- **Uji main terpandu**: layar tersembunyi "Laporan Belajar" bisa mengekspor ringkasan sesi (JSON) dari device peserta uji.
- **Analitik anonim (S6)** jika dinyalakan: event dikirim ke tabel insert-only, tanpa akun.

Event yang didefinisikan sejak awal (lewat antarmuka `Telemetry`, default no-op): `shift_started`, `case_decided` (benar/salah, skor bukti, waktu, petunjuk dipakai), `shift_completed`, `review_answered`, `lesson_opened`, `save_exported`, `save_imported`.

## 11. Konten & proses kualitas

- Konten ditulis sebagai file data (`JSON` untuk kasus/soal, `Markdown` untuk materi) di `content/`. Draf ditulis Claude Code, **direview Zaidana** sebelum masuk `main`.
- Setiap kasus wajib punya: tipe, konsep, tingkat kesulitan (1–3), jawaban benar, bukti yang benar, dan penjelasan ≤ 2 kalimat.
- Checklist review: fakta benar dan mutakhir? merek fiktif? tidak mengajarkan serangan? bahasa sesuai pemula? ada kasus "sah" yang seimbang (± 30–40% kasus adalah aman/sah)?
- `pnpm content:check` memvalidasi skema, ID unik, referensi konsep/alat, dan rasio kasus aman.

## 12. Rencana rilis (solo, ±4 minggu)

| Minggu | Hasil |
|---|---|
| **1** | Scaffold, engine inti, tipe kasus Email + URL, Shift 1 bisa dimainkan dengan placeholder, simpan lokal, validasi konten |
| **2** | Tipe kasus Login + File, Buku Panduan, Laporan Shift, Review Cepat, spaced repetition, konten Shift 1–3 |
| **3** | Konten Shift 4–5 + cerita Kelabu, alat & toko, layout HP dirapikan, ekspor/impor save + migrasi versi save |
| **4** | HUB menu, aset pixel CC0, aksesibilitas & performa, PWA, uji main dengan 5 pelajar, deploy publik |
| v1.1 | HUB top-down Phaser, suara, pencapaian, perbaikan dari uji main, (opsional) akun + sinkron Supabase |
| v1.2+ | Mode 2: **IT Support Technician** (bengkel), lalu Software Engineer, lalu Data/AI |

Aturan potong jika mepet (sudah disepakati): **HUB tetap menu sederhana**, jangan potong inti meja SOC atau konten.

## 13. Risiko

| Risiko | Mitigasi |
|---|---|
| Scope 1 bulan terlalu besar | Potong HUB Phaser lebih dulu; konten Shift 5 boleh 8 kasus |
| Konten salah secara teknis | Review manusia + sumber rujukan per konsep di metadata |
| Terasa seperti kuis, bukan game | Uji main minggu 3–4; prioritaskan juiciness (animasi stempel, suara, reaksi NPC) |
| Teks terlalu banyak di HP | Batas panjang di validator; dokumen maksimal ±120 kata |
| Progres hilang (data browser dihapus, storage di-*evict*) | `storage.persist()`, pengingat ekspor save setelah tiap 2 shift, ekspor 1 ketukan |
| Save rusak atau versi lama | Versi skema + fungsi migrasi berurutan + validasi zod; simpan 1 cadangan terakhir di device |
| Tidak ada data dampak belajar | Uji main terpandu + analitik anonim opsional (S6) |
| Data anak | Tanpa data pribadi di v1.0; tinjau UU PDP sebelum menyalakan analitik publik atau login |

## 14. Pertanyaan terbuka

1. Nama final game (sementara: **ShiftIT**).
2. Apakah perlu kerja sama dengan sekolah/komunitas untuk uji main?
3. Domain & hosting final (Vercel / Cloudflare Pages).
4. Gratis selamanya, atau ada model donasi/sponsor nanti?
