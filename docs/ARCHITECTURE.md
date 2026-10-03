# ARCHITECTURE — ShiftIT

> Pasangan dari `PRD.md`. Dokumen ini menjelaskan **bagaimana** game dibangun.
> Prinsip utama: **engine murni + mode sebagai plugin + konten sebagai data + penyimpanan di device yang bisa diganti.**

---

## 1. Gambaran besar

```
┌──────────────────────────────── Browser (PWA) ────────────────────────────────┐
│                                                                                │
│  app/  (React)  ── layar: Title · Hub · Desk · Report · Review · Settings      │
│     │                                                                          │
│     ├── modes/soc/   ← paket mode: CaseType (schema + evaluator + renderer)     │
│     ├── modes/…      ← mode berikutnya (support, dev, data) dengan kontrak sama │
│     │                                                                          │
│     ├── engine/      ← TS murni: shift reducer, scoring, mastery, RNG, clock   │
│     │                  (tanpa React, tanpa DOM, tanpa Phaser → mudah dites)     │
│     │                                                                          │
│     ├── content/     ← JSON + Markdown, divalidasi zod saat build & di CI       │
│     │                                                                          │
│     ├── persistence/ ← SaveRepository: LocalSaveRepository (IndexedDB)          │
│     │                  + ekspor/impor + migrasi versi                          │
│     │                  (v1.1: SyncedSaveRepository → Supabase)                  │
│     │                                                                          │
│     ├── telemetry/   ← Telemetry: NoopTelemetry (default) | anon sink (flag)    │
│     │                                                                          │
│     └── hub/phaser/  ← v1.1: scene top-down Phaser 4, di-*lazy load*            │
└────────────────────────────────────────────────────────────────────────────────┘
          Tidak ada backend di v1.0. Hosting statis (Netlify; konfigurasi Cloudflare Pages / Vercel tetap tersedia).
```

### Aturan dependensi (wajib)
```
app  →  modes  →  engine
 │        │         ↑
 │        └──→ content (tipe & data)
 └──→ persistence, telemetry  →  engine (tipe saja)

engine   TIDAK BOLEH import: react, phaser, idb-keyval, DOM API, modes/*, app/*
modes/X  TIDAK BOLEH import: modes/Y
```
Aturan ini ditegakkan dengan ESLint `no-restricted-imports` (lihat §12).

## 2. Stack

| Bagian | Pilihan | Alasan |
|---|---|---|
| Bundler | **Vite** | Cepat, code-splitting mudah, template resmi Phaser+React memakai Vite |
| UI | **React 19 + TypeScript** (`strict: true`) | Meja kerja = UI penuh teks/dokumen; DOM lebih aksesibel dan mudah responsif |
| State | **Zustand** | Ringan; store tipis yang membungkus reducer engine |
| Validasi | **zod** | Satu sumber kebenaran untuk tipe konten, save, dan impor |
| Styling | **Tailwind CSS v4** + CSS variables untuk token tema | Cepat untuk layout responsif; token pixel-art di satu tempat |
| Font | `@fontsource/pixelify-sans` (judul), `@fontsource/atkinson-hyperlegible` (isi) | Self-host agar offline; Atkinson dirancang untuk keterbacaan |
| Markdown | `marked` (konten tepercaya dari repo) + frontmatter via `yaml` | Kecil; materi ditulis sebagai `.md` |
| Penyimpanan | `idb-keyval` (IndexedDB) | API sederhana, kapasitas besar, async |
| Kompresi save | `CompressionStream('gzip')` bawaan browser, fallback tanpa kompresi | Tanpa dependensi |
| Game engine hub | **Phaser 4** (stabil sejak v4.0.0, April 2026), hanya v1.1 | Di-*import* dinamis; tidak masuk bundle awal |
| PWA | `vite-plugin-pwa` (Workbox) | Install + offline |
| Test | **Vitest** (unit), **Playwright** (e2e, viewport HP & desktop) | |
| Kualitas | ESLint (flat config) + Prettier + `size-limit` | |
| Package manager | **pnpm** | |
| Hosting | **Netlify** (statis; dipilih pemilik). Cloudflare Pages / Vercel tetap didukung | Gratis, CDN global, deploy otomatis dari `main` |

> Catatan untuk Claude Code: API Phaser 4 berbeda dari Phaser 3 di beberapa bagian (renderer, beberapa nama API). **Selalu cek dokumentasi & template resmi `phaserjs/template-react-ts` versi terkini** sebelum menulis kode Phaser, jangan mengandalkan ingatan Phaser 3.

## 3. Struktur folder

```
shiftit/
├─ CLAUDE.md
├─ docs/
│  ├─ PRD.md
│  ├─ ARCHITECTURE.md
│  └─ adr/                         # catatan keputusan (ADR) singkat
├─ content/
│  └─ id/                          # locale; nanti: en/
│     └─ modes/
│        └─ soc/
│           ├─ mode.json           # metadata mode
│           ├─ concepts/           # 1 file .md per konsep (materi)
│           │  └─ url-anatomy.md
│           ├─ rulebook.json       # bab & aturan Buku Panduan
│           ├─ tools.json          # alat yang bisa dibeli
│           ├─ shifts/
│           │  └─ shift-01.json
│           ├─ cases/              # 1 file per kasus
│           │  └─ s01-email-001.json
│           ├─ review/             # soal review
│           │  └─ url-anatomy.json
│           └─ dialogue/           # dialog mentor & antagonis
│              └─ shift-01.json
├─ public/
│  └─ assets/                      # sprite atlas, ikon, CC0 (lihat assets/CREDITS.md)
├─ scripts/
│  └─ content-check.ts             # validator konten (dijalankan di CI)
├─ src/
│  ├─ main.tsx
│  ├─ app/
│  │  ├─ App.tsx                   # screen router berbasis state
│  │  ├─ store.ts                  # Zustand: screen, save, session aktif
│  │  ├─ screens/                  # Title, Hub, Report, Review, Settings, SaveTransfer
│  │  └─ ui/                       # komponen dasar: PixelPanel, Button, Tabs, Dialog, Toast
│  ├─ engine/
│  │  ├─ types.ts                  # tipe inti (ShiftSession, Decision, Outcome…)
│  │  ├─ shift.ts                  # shiftReducer + action
│  │  ├─ scoring.ts
│  │  ├─ mastery.ts                # Leitner
│  │  ├─ review.ts                 # pemilihan soal review
│  │  ├─ economy.ts                # gaji, kepercayaan, alat
│  │  ├─ rng.ts                    # RNG ber-seed (mulberry32)
│  │  └─ __tests__/
│  ├─ modes/
│  │  ├─ registry.ts               # daftar mode yang tersedia
│  │  ├─ contract.ts               # interface CareerMode & CaseTypeDef
│  │  └─ soc/
│  │     ├─ index.ts               # export socMode: CareerMode
│  │     ├─ caseTypes/
│  │     │  ├─ email/              # schema.ts · evaluate.ts · EmailDocument.tsx
│  │     │  ├─ login-alert/
│  │     │  ├─ file/
│  │     │  └─ url-request/
│  │     ├─ generators/            # typosquat-domain.ts, dll.
│  │     └─ desk/                  # SocDesk.tsx, Queue, DocumentPane, RulebookPane, ActionBar
│  ├─ content/
│  │  ├─ schemas.ts                # zod schema bersama (konsep, aturan, shift, soal)
│  │  └─ loader.ts                 # import.meta.glob + validasi
│  ├─ persistence/
│  │  ├─ saveSchema.ts             # zod SaveData + versi
│  │  ├─ migrations.ts
│  │  ├─ SaveRepository.ts         # interface
│  │  ├─ LocalSaveRepository.ts
│  │  └─ transfer.ts               # ekspor/impor kode & file
│  ├─ telemetry/
│  │  ├─ Telemetry.ts              # interface + event types
│  │  └─ NoopTelemetry.ts
│  ├─ i18n/
│  │  └─ id.ts                     # semua string UI
│  └─ hub/phaser/                  # v1.1
└─ e2e/
   └─ shift-01.spec.ts
```

## 4. Kontrak mode (kunci ekstensibilitas)

```ts
// src/modes/contract.ts
import type { z } from 'zod';
import type { ComponentType } from 'react';
import type { CaseOutcome, EvidenceId, DecisionId } from '../engine/types';

export interface CaseTypeDef<TCase extends BaseCase = BaseCase> {
  type: string;                                   // 'email' | 'login-alert' | …
  schema: z.ZodType<TCase>;                       // validasi file kasus
  /** Fungsi murni: dari kasus + aksi pemain → hasil. Tanpa React. */
  evaluate(c: TCase, input: PlayerInput): CaseOutcome;
  /** Render dokumen; setiap bagian yang bisa ditandai membungkus <Evidence id>. */
  Document: ComponentType<{ data: TCase; marks: Set<EvidenceId>; onToggleMark(id: EvidenceId): void }>;
  /** Ikon & label di antrian. */
  queueLabel(c: TCase): { icon: string; title: string };
  visitor?(c: TCase): { name: string; role: string; kind: 'person' | 'system'; line: string }; // pelapor di loket (ADR 019)
}

export interface CareerMode {
  id: 'soc' | 'support' | 'dev' | 'data' | (string & {});
  title: string;                                  // "Analis Keamanan (SOC)"
  deskTitle: string;                              // "Meja SOC"
  status: 'available' | 'locked' | 'coming-soon';
  decisions: { id: DecisionId; label: string; unlockedAtShift: number }[];
  caseTypes: CaseTypeDef<any>[];
  generators?: Record<string, CaseGenerator>;     // variasi prosedural
  /** Komponen meja; menerima session dari engine & dispatch. */
  Desk: React.LazyExoticComponent<ComponentType<DeskProps>>;
  contentRoot: string;                            // 'modes/soc'
}
```

Engine tidak tahu apa itu "email" atau "phishing". Engine hanya tahu: **ada antrian kasus → pemain memberi keputusan + bukti → `evaluate()` mengembalikan `CaseOutcome` → engine menghitung skor, kepercayaan, mastery.**

Mode berikutnya (mis. IT Support) mendefinisikan tipe kasus sendiri (`hardware-ticket`, `network-diag`) dan `Desk` sendiri (bengkel), tetapi memakai shift runner, scoring, review, mastery, save, dan Laporan Shift yang sama.

## 5. Model konten

Semua konten adalah data di `content/<locale>/modes/<mode>/`. Dimuat dengan `import.meta.glob(..., { eager: false })` per mode (code-split), lalu divalidasi zod. Di CI, `scripts/content-check.ts` melakukan validasi yang sama plus pemeriksaan silang.

### 5.1 Konsep (materi) — `concepts/url-anatomy.md`
```md
---
id: url-anatomy
title: Membaca Alamat Web (URL)
mode: soc
order: 1
sources:
  - "BSSN — Panduan Keamanan Informasi untuk Masyarakat"
  - "APWG — Phishing Activity Trends"
---
Alamat web dibaca **dari kanan ke kiri** untuk mencari pemiliknya…
(maks ±150 kata + 1 contoh)
```

### 5.2 Buku Panduan — `rulebook.json`
```json
{
  "chapters": [
    {
      "id": "ch-url",
      "title": "Bab 1 · Tautan",
      "conceptId": "url-anatomy",
      "unlockAtShift": 1,
      "rules": [
        { "id": "r-url-1", "text": "Pemilik situs = nama tepat sebelum .co.id / .com di ujung domain.", "evidenceTags": ["domain"] },
        { "id": "r-url-2", "text": "Gembok HTTPS hanya berarti koneksi terenkripsi, bukan situsnya jujur.", "evidenceTags": ["https"] }
      ]
    }
  ]
}
```

### 5.3 Kasus — `cases/s01-email-001.json`
```json
{
  "id": "s01-email-001",
  "type": "email",
  "conceptIds": ["phishing-signs", "url-anatomy"],
  "difficulty": 1,
  "verdict": "malicious",
  "correctDecision": "block",
  "acceptableDecisions": { "escalate": 0.6 },
  "severity": 2,
  "data": {
    "from": { "name": "Bank Nusantara", "address": "keamanan@banknusantara-verifikasi.test", "evidenceId": "sender" },
    "subject": { "text": "SEGERA: Akun Anda akan diblokir dalam 1 jam", "evidenceId": "urgency" },
    "body": [
      { "text": "Yth. Nasabah," , "evidenceId": "generic-greeting" },
      { "text": "Klik tautan berikut untuk verifikasi:" },
      { "link": { "label": "banknusantara.co.id/verifikasi", "href": "http://banknusantara.co.id.akun-aman.test/login" }, "evidenceId": "link" }
    ],
    "attachments": []
  },
  "evidence": {
    "required": ["sender", "link"],
    "supporting": ["urgency", "generic-greeting"]
  },
  "explanation": "Domain pengirim bukan banknusantara.co.id, dan tautan aslinya mengarah ke akun-aman.test. Bank tidak pernah meminta verifikasi lewat tautan email.",
  "ruleRefs": ["r-url-1", "r-phish-2"]
}
```
- `verdict`: `"safe" | "malicious" | "suspicious"`. Rasio kasus `safe` per shift 30–40% (diperiksa validator).
- Penanda bukti adalah **ID pada bagian terstruktur**, bukan rentang karakter. Ini membuat penandaan andal di layar sentuh dan mudah dinilai.
- `href` asli hanya terlihat jika pemain punya alat **Pemeriksa Tautan** (atau dengan long-press di level dasar). Renderer tidak pernah membuat `<a href>` yang benar-benar bisa dibuka.

### 5.4 Shift — `shifts/shift-01.json`
```json
{
  "id": "soc-01",
  "order": 1,
  "title": "Hari Pertama",
  "durationGameMinutes": 120,
  "realSecondsPerGameMinute": 3,
  "unlocksChapters": ["ch-url", "ch-phish"],
  "introDialogue": "soc-01-intro",
  "outroDialogue": "soc-01-outro",
  "tutorial": true,
  "queue": [
    { "caseId": "s01-email-001", "arriveAt": 0 },
    { "caseId": "s01-email-002", "arriveAt": 5 },
    { "generator": "typosquat-domain", "params": { "brand": "KirimCepat", "verdict": "malicious" }, "arriveAt": 20 }
  ],
  "review": { "count": 3, "conceptIds": ["url-anatomy", "phishing-signs"] },
  "pay": { "base": 40, "perCase": 12 },
  "newspaper": { "headline": "…", "lead": "…", "tip": { "title": "…", "text": "…" }, "sources": ["BSSN"] }
}
// newspaper (opsional, ADR 020): koran pagi; mulai shift 2 wajib punya "impact": { "good", "mixed", "bad" }.
```

### 5.5 Soal review — `review/url-anatomy.json`
Tipe soal: `mcq` (pilihan ganda), `tap-evidence` (ketuk bagian mencurigakan pada potongan dokumen), `order-steps` (urutkan langkah). Setiap soal punya `conceptId`, `explanation`, dan `difficulty`.

### 5.6 Validator konten (`pnpm content:check`)
Gagal jika:
- skema zod tidak cocok;
- ID duplikat; `caseId`/`conceptId`/`ruleRefs`/`evidence` merujuk sesuatu yang tidak ada;
- `evidence.required` berisi ID yang tidak ada di `data`;
- rasio kasus `safe` per shift di luar 30–40%;
- teks dokumen > 120 kata, materi > 180 kata, penjelasan > 2 kalimat;
- **nama merek nyata** muncul di `cases/` (denylist di `scripts/brand-denylist.json`: nama bank, e-commerce, kurir, e-wallet Indonesia, dll.). Materi boleh menyebut nama platform umum (mis. "WhatsApp") hanya bila ada di allowlist;
- domain di kasus tidak memakai TLD `.test`, `.example`, atau domain fiktif yang terdaftar di `scripts/fictional-domains.json`.

## 6. Engine

### 6.1 Session sebagai state machine
```
          START_SHIFT                OPEN_CASE              DECIDE
idle ───────────────▶ briefing ──▶ working ◀────────▶ inspecting ─────▶ feedback
                                    │  ▲                                     │
                                    │  └──────────── CLOSE_FEEDBACK ─────────┘
                                    │ (jam habis / antrian kosong)
                                    ▼
                                  ended ──▶ (app: Report → Review) ──▶ committed
```

```ts
// src/engine/shift.ts (sketsa)
export type ShiftAction =
  | { type: 'START_SHIFT'; shift: ShiftDef; cases: ResolvedCase[]; seed: number; mode: PlayMode }
  | { type: 'TICK'; dtMs: number }                 // dikirim UI via rAF; diabaikan saat paused
  | { type: 'PAUSE' } | { type: 'RESUME' }
  | { type: 'OPEN_CASE'; caseId: string }
  | { type: 'TOGGLE_MARK'; evidenceId: string }
  | { type: 'USE_HINT' }
  | { type: 'DECIDE'; decision: DecisionId; outcome: CaseOutcome }   // outcome dari CaseTypeDef.evaluate
  | { type: 'CLOSE_FEEDBACK' }
  | { type: 'END_SHIFT' };

export function shiftReducer(s: ShiftSession, a: ShiftAction): ShiftSession { /* murni */ }
```
- **Deterministik**: RNG ber-seed (`mulberry32`) disimpan di session, sehingga kasus prosedural sama saat dilanjutkan.
- **Bisa dilanjutkan**: seluruh `ShiftSession` bisa diserialisasi; disimpan setiap `DECIDE` dan saat `visibilitychange` → hidden.
- Waktu: TICK hanya maju saat tab aktif dan tidak paused. Di mode **Santai**, jam berjalan tetapi tidak ada penalti waktu.

### 6.2 Penilaian (`scoring.ts`)
```
decisionScore = 1.0 jika keputusan == correctDecision
              = acceptableDecisions[keputusan] jika ada (mis. eskalasi 0.6)
              = 0 selain itu

evidenceScore = (|marked ∩ required| / |required|)            // recall bukti wajib
              − 0.25 × |marked − required − supporting|        // tebak-tebakan dikurangi
              + 0.05 × |marked ∩ supporting|                   // bonus kecil
              → di-clamp ke [0, 1]
              (kasus safe: required biasanya kosong → evidenceScore = 1 jika tidak menandai apa pun yang salah)

caseScore (0–100) = 60 × decisionScore + 40 × evidenceScore × (decisionScore > 0 ? 1 : 0.5)
                  − 10 per petunjuk ke-2+ 
                  + bonus waktu ≤ 10 (hanya mode Normal)
```
Kepercayaan klien (`economy.ts`):
| Hasil | Δ Kepercayaan |
|---|---|
| Ancaman diizinkan | −5 × severity (severity 1–3) |
| Email/permintaan sah diblokir | −3 |
| Eskalasi yang tidak perlu | −1 |
| Keputusan benar | +1 (maks 100) |

Antar-shift, kepercayaan di bawah 75 pulih separuh selisihnya (`carryTrust`, dibulatkan ke atas), supaya satu shift buruk tidak menyeret pemula sampai akhir (ADR 017).

Gaji shift (`shiftPay`) = `pay.base + round(pay.perCase × Σ caseScore / 100)`: tiap kasus dibayar sebanding skornya, jadi bukti yang lengkap ikut menaikkan gaji. Angka gaji & harga alat disetel dengan `pnpm sim:economy` (ADR 017).

Bintang shift: ★ ≥ 50 rata-rata, ★★ ≥ 70, ★★★ ≥ 85 dengan kepercayaan ≥ 70.

### 6.3 Mastery & review (`mastery.ts`, `review.ts`)
- Leitner 3 kotak per `conceptId` **dan** per `reviewItemId`.
- Kasus/soal salah → item terkait masuk kotak 1. Benar → naik satu kotak.
- Review Cepat akhir shift (3–5 soal): ≥ 1 soal konsep baru shift ini, sisanya dari kotak terendah yang sudah jatuh tempo (jatuh tempo diukur **per shift**, bukan per hari: kotak 1 = shift berikutnya, kotak 2 = 2 shift lagi, kotak 3 = 4 shift lagi).
- `masteryOf(conceptId)` = gabungan akurasi kasus + kotak Leitner → ditampilkan sebagai bar di Buku Panduan.

## 7. Penyimpanan (v1.0: device saja)

### 7.1 Antarmuka
```ts
// src/persistence/SaveRepository.ts
export interface SaveRepository {
  load(): Promise<SaveData | null>;
  save(data: SaveData): Promise<void>;          // menulis 'save' lalu menggeser lama ke 'save:backup'
  loadBackup(): Promise<SaveData | null>;
  clear(): Promise<void>;
}
```
Implementasi v1.0: `LocalSaveRepository` (IndexedDB via `idb-keyval`, key `shiftit:save` dan `shiftit:save:backup`).
Jika IndexedDB tidak tersedia (mis. mode privat tertentu), fallback ke `localStorage`, dan kalau itu pun gagal, ke memori dengan banner "progres tidak akan tersimpan".
Saat pertama kali menyimpan: panggil `navigator.storage.persist()` (abaikan jika tidak didukung).

### 7.2 Bentuk save
```ts
// src/persistence/saveSchema.ts
export const SAVE_SCHEMA_VERSION = 1;
SaveData = {
  schemaVersion: 1,
  createdAt: string, updatedAt: string,
  installId: string,                  // UUID acak; tidak terkait identitas
  profile: { nickname: string, settings: { textScale: 1|1.15|1.3, playMode: 'relaxed'|'normal', reduceMotion: boolean, sound: boolean } },
  modes: {
    [modeId: string]: {
      unlockedShift: number,
      shifts: Record<shiftId, { bestScore: number, stars: 0|1|2|3, completedAt?: string }>,
      wallet: number, trust: number,
      toolsOwned: string[], chaptersUnlocked: string[],
      activeSession?: ShiftSession,   // untuk lanjut di tengah shift
    }
  },
  mastery: Record<itemId, { box: 1|2|3, dueAtShiftIndex: number, seen: number, correct: number }>,
  assessments?: { pre?: AssessmentResult, post?: AssessmentResult },
  flags: Record<string, boolean>,     // dialog yang sudah dilihat, tutorial, pengingat ekspor
}
```
`migrations.ts` berisi fungsi `v1→v2`, `v2→v3`, … yang dijalankan berurutan saat `load()` dan saat impor. Setiap perubahan skema **wajib** menambah migrasi + test.

### 7.3 Ekspor / impor (`transfer.ts`)
```
ekspor:  SaveData → JSON → gzip (CompressionStream) → base64url
         → "SHIFTIT1." + payload + "." + sha256(payload)[0..8]
         → bisa disalin sebagai teks, atau diunduh sebagai file .shiftit
impor:   batas 512 KB → cek prefix & checksum → ungzip → JSON.parse
         → migrate() → zod.parse → tampilkan ringkasan (shift, bintang, tanggal)
         → konfirmasi "Timpa progres di perangkat ini?" → simpan (lama jadi backup)
```
Checksum hanya mendeteksi kode yang terpotong/salah salin, **bukan** anti-cheat (tidak ada leaderboard, jadi cheat tidak merugikan siapa pun).
Pengingat ekspor muncul di Laporan Shift setelah shift 2 dan 4 (bisa dimatikan).

### 7.4 Jalur ke cloud (v1.1, belum dibangun)
`SyncedSaveRepository` membungkus `LocalSaveRepository` + Supabase:
- Device tetap sumber utama (offline-first); sinkron saat online, *last-write-wins* berdasarkan `updatedAt` + `schemaVersion`.
- Auth: `signInAnonymously()` + Turnstile → upgrade ke permanen via `linkIdentity()` (Google) atau `updateUser({ email })`.
- Tabel rancangan: `saves(user_id pk, data jsonb, schema_version, updated_at)`, `events(id, install_id, user_id null, name, props jsonb, created_at)`; RLS `user_id = auth.uid()`; bersihkan user anonim tidak aktif > 30 hari.
Tidak ada bagian game lain yang perlu berubah, karena semua akses lewat `SaveRepository`.

## 8. Telemetri
```ts
export interface Telemetry { track<E extends TelemetryEvent>(e: E): void; flush(): Promise<void>; }
```
- v1.0 default: `NoopTelemetry`. Event tetap dipanggil di titik yang benar supaya siap dinyalakan.
- `SessionReportTelemetry`: menyimpan event ke memori + IndexedDB terbatas (≤ 500 event) untuk **layar tersembunyi "Laporan Belajar"** (buka dengan menekan logo 5×) yang bisa mengekspor JSON saat uji main.
- `AnonHttpTelemetry` (PRD S6, ADR 018): hanya ada bila build diberi `VITE_TELEMETRY_ENDPOINT`, dan hanya mengirim setelah pemain menyalakannya di Pengaturan (bawaan mati). Batch POST JSON `{ v: 1, installId, events: [{ name, …props, at }] }` ke endpoint insert-only; `at` dipotong per menit.

## 9. UI & layout

### 9.1 Layar
`App.tsx` memakai **screen state** di Zustand (`'title' | 'hub' | 'desk' | 'report' | 'review' | 'rulebook' | 'settings' | 'save-transfer'`). Tidak memakai router di v1.0. `Desk` setiap mode di-*lazy load*.

### 9.2 Meja SOC responsif
```
Desktop ≥ 1024px                         HP < 768px (potret)
┌ Antrian ┬── Dokumen ──────┬ Panduan ┐  ┌ 09:42 · ♥ 82 · Rp 140 ┐
│ ✉ 3     │                 │ Bab 1   │  │ [Antrian][Dokumen][Panduan] │
│ 🔑 1    │  (ketuk bagian  │ Bab 2   │  │                         │
│ 📄 1    │   mencurigakan) │ …       │  │     panel aktif          │
│         │                 │         │  │                         │
├─────────┴─────────────────┴─────────┤  ├─────────────────────────┤
│ [IZINKAN]  [BLOKIR]  [ESKALASI]  ? │  │ [IZINKAN][BLOKIR][ESKAL]│  ← bar aksi lengket
└──────────────────────────────────────┘  └─────────────────────────┘
768–1023px: Antrian jadi laci (drawer) kiri; Dokumen + Panduan berdampingan.
```
- Target sentuh ≥ 44 px; area tombol aksi di jangkauan jempol.
- Bagian yang bisa ditandai: `<button aria-pressed>` dengan garis bawah putus-putus; saat ditandai muncul stempel/sorotan **dan** ikon (tidak bergantung warna).
- Keputusan memicu stempel yang menghantam kertas dokumen, lalu slip umpan balik bergaya kertas (ADR 019; dimatikan oleh "kurangi animasi").
- Dokumen tampil sebagai kertas (`.paper`) di atas meja (`.desk-surface`); di atasnya kartu pelapor dari `CaseTypeDef.visitor` (potret pixel + satu kalimat yang tidak membocorkan jawaban).
- `textScale` diterapkan sebagai CSS variable `--text-scale` di `:root`.

### 9.3 Gaya visual
- Token di `src/app/theme.css`: palet terbatas (± 12 warna), ukuran 4/8 px grid, border panel 9-slice dari pack UI CC0 (`border-image`), `image-rendering: pixelated` untuk sprite.
- Sprite & UI dari pack **CC0** (mis. Kenney). Setiap aset dicatat di `public/assets/CREDITS.md` (nama pack, URL, lisensi).
- Font: Pixelify Sans untuk judul/label pendek; **Atkinson Hyperlegible untuk semua teks dokumen & materi** (keterbacaan di HP).

## 10. HUB

- **v1.0 — `HubMenu`** (React): ilustrasi kantor pixel statis dengan 4 hotspot meja (SOC aktif; Support/Dev/Data bertanda "Segera hadir"), tombol Panduan, Pengaturan, Pindah Save.
- **v1.1 — `PhaserHub`**: komponen React yang memanggil `import('./phaser/createGame')` secara dinamis, me-*mount* `Phaser.Game` ke `<div>`, dan berkomunikasi lewat `EventBus` (pola dari template resmi Phaser + React). Scene: tilemap kantor, pemain bergerak (keyboard/joystick sentuh), NPC Mbak Rani, zona interaksi meja → emit `desk:enter { modeId }` → React mengganti layar. Saat keluar hub, `game.destroy(true)` untuk membebaskan memori di HP.
- Kedua versi memakai data yang sama: `modes/registry.ts`.

## 11. Performa & PWA

| Anggaran | Batas | Cara cek |
|---|---|---|
| JS awal (gzip) | ≤ 250 KB | `size-limit` di CI |
| Chunk per mode | ≤ 150 KB + konten | `size-limit` |
| Phaser | tidak ada di bundle awal | `size-limit` + cek manual `vite build --mode analyze` |
| Aset sampai Shift 1 | ≤ 2 MB | Lighthouse / DevTools |
| Lighthouse mobile | Performance ≥ 85, Accessibility ≥ 95 | manual tiap milestone |

PWA: precache shell, font, sprite atlas, dan konten mode SOC; strategi *stale-while-revalidate* untuk konten. Tampilkan toast "Versi baru tersedia → Muat ulang" (tidak memaksa reload di tengah shift).

## 12. Kualitas & CI

- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- ESLint: `no-restricted-imports` untuk aturan lapisan (§1), `react-hooks`, `jsx-a11y`.
- **Unit test (Vitest)**: `shiftReducer` (semua transisi), `scoring`, `mastery`, `review`, `economy`, `migrations`, `transfer` (roundtrip ekspor→impor, kode rusak, versi lama), `evaluate()` setiap tipe kasus.
- **Content test**: `pnpm content:check`.
- **E2E (Playwright)**: proyek `mobile` (Pixel 5) dan `desktop`: main Shift 1 sampai Laporan + Review; tandai bukti; reload di tengah shift lalu lanjut; ekspor lalu impor save.
- **GitHub Actions**: `pnpm i --frozen-lockfile` → `typecheck` → `lint` → `test` → `content:check` → `build` → `size` → `e2e` (Chromium saja).

Skrip `package.json`:
```
dev, build, preview, typecheck, lint, test, test:watch, e2e, content:check, size, check (= semua di atas kecuali e2e)
```

## 13. Menambah mode karier baru (checklist)

1. `content/id/modes/<mode>/` : `mode.json`, `concepts/`, `rulebook.json`, `tools.json`, `shifts/`, `cases/`, `review/`, `dialogue/`.
2. `src/modes/<mode>/caseTypes/<type>/` : `schema.ts` (zod), `evaluate.ts` (murni + test), `<Type>Document.tsx`.
3. `src/modes/<mode>/desk/<Mode>Desk.tsx` (boleh memakai ulang komponen `Queue`, `RulebookPane`, `ActionBar` dari `src/app/ui/desk/`).
4. Export `CareerMode` di `src/modes/<mode>/index.ts`, daftarkan di `src/modes/registry.ts`, set `status: 'available'`.
5. `pnpm check` hijau + 1 spec e2e untuk shift pertama mode itu.
Tidak perlu menyentuh `engine/`, `persistence/`, atau layar Report/Review. Jika ternyata perlu, itu tanda kontrak perlu diperluas; catat sebagai ADR.

Rencana mode berikutnya:
| Mode | Tipe kasus contoh | Meja |
|---|---|---|
| IT Support | `hardware-ticket`, `network-diag`, `os-issue` | Bengkel: rak komponen, multimeter, ping |
| Software Engineer | `bug-ticket` (baca kode & log), `code-review`, `git-conflict` | Editor kode mini (CodeMirror, lazy) |
| Data / AI | `data-cleaning`, `chart-misleading`, `model-eval` | Tabel & grafik |

## 14. Urutan implementasi (milestone untuk Claude Code)

Setiap milestone selesai = `pnpm check` hijau + e2e terkait hijau + commit.

**M0 — Fondasi (hari 1–2)**
- Scaffold Vite React TS + pnpm, Tailwind v4, ESLint/Prettier, Vitest, Playwright, `size-limit`, GitHub Actions.
- Aturan lapisan di ESLint. Folder sesuai §3. `i18n/id.ts`.
- ✅ Diterima jika: `pnpm check` hijau pada repo kosong berisi 1 test contoh.

**M1 — Engine + 1 shift vertikal (hari 3–7)**
- `engine/` lengkap dengan test (§6). `content/schemas.ts`, `loader.ts`, `content-check.ts`.
- Kontrak mode (§4), tipe kasus `email` dan `url-request`, `SocDesk` responsif dengan placeholder.
- Konten Shift 1 (8 kasus) + bab 1–2 + 3 soal review.
- `LocalSaveRepository` + autosave + lanjut di tengah shift.
- ✅ Diterima jika: Shift 1 bisa dimainkan sampai Laporan di HP & desktop; reload di tengah shift melanjutkan kasus yang sama.

**M2 — Lingkar belajar (hari 8–14)**
- Tipe kasus `login-alert` dan `file`. Buku Panduan + kartu konsep + bar mastery.
- Laporan Shift (kesalahan + penjelasan + tautan ke bab), Review Cepat (mcq, tap-evidence, order-steps), Leitner.
- Mentor & petunjuk bertingkat. Konten Shift 2–3.
- ✅ Diterima jika: soal yang salah di Shift 1 muncul lagi di review Shift 2.

**M3 — Ekonomi, cerita, transfer save (hari 15–21)**
- Gaji, Kepercayaan, toko alat (4 alat) yang membuka mekanik baru.
- Dialog antar-shift (mentor & Kelabu). Konten Shift 4–5 (Shift 5 = serangan berlapis). Generator `typosquat-domain`.
- Ekspor/impor save (teks & file), migrasi, backup, pengingat ekspor, `storage.persist()`.
- Pre/post test (opsional di menu).
- ✅ Diterima jika: e2e ekspor di "HP" → impor di "desktop" mempertahankan semua progres.

**M4 — Poles & rilis (hari 22–30)**
- `HubMenu` dengan aset pixel CC0 + `CREDITS.md`. Tema visual final, animasi stempel, "kurangi animasi".
- Pengaturan (ukuran teks, mode bermain, suara). PWA + toast update.
- Audit aksesibilitas & Lighthouse; perbaiki sampai anggaran §11 tercapai.
- Layar tersembunyi "Laporan Belajar" untuk uji main. Deploy ke Cloudflare Pages/Vercel.
- ✅ Diterima jika: semua "Must" di PRD §6 terpenuhi, anggaran performa terpenuhi, 5 pelajar menyelesaikan uji main.

**v1.1+** — `PhaserHub`, suara, pencapaian, opsional `SyncedSaveRepository` (Supabase), lalu Mode IT Support.

## 15. Keputusan (ADR ringkas)

| # | Keputusan | Alasan | Alternatif ditolak |
|---|---|---|---|
| 001 | Game 2D pixel, bukan 3D | Target HP Android kelas bawah; scope 1 bulan | Three.js 3D (3–5× scope) |
| 002 | React untuk meja, Phaser hanya untuk hub | Teks/dokumen lebih aksesibel & responsif di DOM | Phaser untuk semua |
| 003 | Engine TS murni berbasis reducer | Mudah dites, deterministik, bisa disimpan & dilanjutkan | Logika di komponen/scene |
| 004 | Mode sebagai plugin (`CareerMode`) | Mode baru tanpa mengubah inti | Satu game SOC hard-coded |
| 005 | Konten JSON/MD + validator | Bisa ditinjau manusia, aman diubah, terdeteksi salah di CI | Konten di dalam kode / AI runtime |
| 006 | Progres di device (v1.0) + ekspor/impor | Tanpa login & server, privasi pemain di bawah umur, biaya nol | Supabase dari awal (tetap jalur v1.1) |
| 007 | Merek & domain fiktif saja | Hindari peniruan merek nyata; tetap realistis | Memakai merek nyata |
| 008 | Bukti berbasis ID bagian, bukan seleksi teks bebas | Andal di layar sentuh, mudah dinilai | Highlight rentang karakter |
