# ADR 028 — Boss akhir shift

- Status: diterima · 7 Oktober 2026

## Konteks

Pemilik ingin game terasa lebih menantang dan punya klimaks di setiap shift. Pemilik memilih
"boss fight akhir shift": insiden besar bertahap dengan timer dan hadiah besar.

## Keputusan

- **Boss = gelombang kasus dari antrian.** `shift.boss` (konten) menunjuk 2–4 kasus yang sudah ada di
  antrian (`caseIds`). Kasus-kasus itu datang **bersamaan** di `arriveAt`. Tidak perlu tipe kasus baru,
  dan kasus boss tetap dinilai seperti kasus biasa (skor, kepercayaan, bukti). Konten v1 memakai
  3 kasus terakhir setiap shift.
- **HP boss = banyak kasus boss.** Setiap keputusan benar memukul boss. Boss **kalah** hanya bila
  semua kasus boss benar. Satu kesalahan, kasus terlewat, atau waktu habis membuat boss **lolos**.
  Ini bonus, bukan hukuman: boss yang lolos tidak mengurangi apa pun selain bonusnya.
- **Batas waktu hanya di mode Normal** (`boss.durationGameMinutes`). Saat waktu habis, kasus boss yang
  belum diputuskan menjadi terlewat dan kasus yang sedang dibaca ditutup. Mode Santai tetap tanpa
  penalti waktu (PRD).
- **Hadiah**: `boss.reward` masuk gaji shift (`ShiftSummary.bossBonus`) plus lencana `boss-defeated`
  ("Pemburu Boss") di setiap mode.
- **Engine murni** (`engine/boss.ts`): `bossState(session)` → status `pending | active | defeated |
escaped`, HP, dan sisa waktu. Jadwal boss dicatat di sesi saat shift dimulai (`ShiftSession.boss`),
  jadi shift yang dilanjutkan tetap sama.
- **Save v12**: `boss?` di sesi (migrasi identitas).
- UI: bar HP + hitung mundur di bawah HUD, kasus bertanda 👾 BOSS di antrian, banner saat boss
  datang/kalah/lolos (bisa ditutup, hilang sendiri), dan hasil boss di laporan shift.

## Akibat

- `content:check` memastikan kasus boss ada di antrian, tidak ganda, dan batas waktunya tidak melewati
  akhir shift.
- Boss dengan kasus coding butuh waktu lebih lama: Meja Developer memakai 45 menit game (±3 menit
  nyata), SOC dan Bengkel IT 30 menit game (±1,5 menit).
