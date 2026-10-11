# ADR 032 — Proyek klien: PRD, papan kerja, sprint, dan retro

- Status: diterima · 11 Oktober 2026 (tahap A: mesin + UI + proyek Meja Developer)

## Konteks

Pemilik ingin pemain "menjadi developer seutuhnya", bukan hanya mengerjakan tiket: mulai dari PRD,
papan Kanban, dan alur kerja seperti di kantor sungguhan. Pemilik memilih **papan kerja untuk semua
meja**, masing-masing mengikuti alur profesinya (Scrum di Developer; penanganan insiden NIST SP 800-61
di SOC; antrean tiket ITIL di Bengkel IT; CRISP-DM di Data). Dikerjakan bertahap: tahap A membangun
mesin, UI, dan satu proyek Meja Developer; tahap B menambah proyek tiga meja lainnya.

## Keputusan

- **Proyek = aktivitas baru per meja**, terpisah dari jalur shift utama, sehingga kurikulum dan e2e
  yang ada tidak berubah. Proyek terbuka setelah shift tertentu (`unlockAfterShift`).
- **Alur**: Brief → Rencana sprint → Sprint di meja → Retro, diulang untuk setiap sprint, lalu selesai.
  - **Brief**: pemain memilah setiap kebutuhan PRD menjadi _jelas_, _ambigu_ (tanya klien), atau _di
    luar lingkup_. Ada penjelasan per kebutuhan, dan skornya disimpan.
  - **Rencana**: kartu (_user story_) dengan poin dan prioritas MoSCoW dipilih sesuai **kapasitas**
    sprint. Skor perencanaan = poin kartu MUST yang dipilih ÷ poin MUST yang bisa muat.
  - **Sprint** = satu sesi shift biasa yang dibuat dari kartu terpilih (`sprintPlan`). Semua kartu ada
    di papan sejak awal, dan **kejutan** datang di tengah jalan. Meja yang sama dipakai, tetapi antrian
    tampil sebagai **papan kerja** (To Do / Dikerjakan / Selesai) dengan istilah dari konten
    (`terms.columns`, `terms.sprint`).
  - **Retro**: poin selesai vs direncanakan, kartu yang kembali ke backlog, skor perencanaan, gaji
    (`pay.perPoint` per poin selesai, `pay.completion` di sprint terakhir), dan grafik _velocity_.
- **Mesin murni** `src/engine/project.ts` (`scoreBrief`, `canAdd`, `scorePlan`, `sprintPlan`,
  `sprintOutcome`, `commitSprint`) dan lapisan aplikasi `src/app/projects.ts`, keduanya dengan unit
  test. Kartu dianggap selesai bila kasusnya diputuskan **benar** (tugas coding: semua tes lulus).
- **Save v15**: `modes[m].projects[projectId]` (skor brief, sprint selesai, kartu selesai, velocity,
  skor rencana, waktu selesai) dan `session.project` (penanda sprint). Sprint memakai **slot latihan**,
  seperti tantangan harian (ADR 029): selama sprint berjalan, latihan dan tantangan harian menunggu.
  Sprint tidak memberi Review Cepat, tidak mengubah kepercayaan, dan tidak membuka shift.
- **Konten** `projects/<id>.json` per mode, divalidasi `content:check`:
  - kasusnya khusus proyek (tidak dipakai di shift dan tidak dipakai dua kali);
  - brief punya ketiga jenis kebutuhan;
  - kapasitas semua sprint cukup untuk semua kartu MUST;
  - setiap sprint muat minimal satu kartu.
- Bab Buku Panduan baru di Meja Developer: **Kerja Proyek** (PRD, backlog, MoSCoW, sprint, retro).

## Konsekuensi

- Pemain bisa menjalankan satu aktivitas sampingan per meja pada satu waktu (latihan, harian, atau
  sprint). HUB menampilkan pesan "sedang berjalan" untuk yang lain.
- Proyek meja lain (tahap B) cukup menambah konten `projects/` dan kasusnya. Mesin dan UI tidak berubah.
- Konten proyek adalah **draf untuk direview pemilik**.
