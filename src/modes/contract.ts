import type { ComponentType, LazyExoticComponent } from 'react';
import type { z } from 'zod';
import type { ModeContent } from '../content/loader.ts';
import type { BaseCase } from '../content/schemas.ts';
import type { ShiftAction } from '../engine/shift.ts';
import type {
  CaseAnswer,
  CaseImpact,
  CaseOutcome,
  DecisionId,
  EvidenceId,
  PlayerInput,
  ShiftSession,
} from '../engine/types.ts';
import type { RngState } from '../engine/rng.ts';
import type { MasteryMap } from '../engine/mastery.ts';
import type { NewsTier } from '../engine/news.ts';
import type { Locale } from '../i18n/index.ts';

export interface DocumentProps<TCase extends BaseCase = BaseCase> {
  data: TCase;
  marks: ReadonlySet<EvidenceId>;
  onToggleMark(id: EvidenceId): void;
  /** true setelah keputusan dibuat: bukti tidak bisa diubah lagi. */
  locked: boolean;
  /** ID alat yang dimiliki pemain; Document memakai ini untuk mekanik alat. */
  tools: ReadonlySet<string>;
  /** Jawaban ketikan pemain (kode/bendera, ADR 026); hanya tipe kasus yang memakainya. */
  answer?: CaseAnswer | undefined;
  onAnswer?(text: string): void;
  /** Mencatat satu kali menjalankan tes (jumlah lulus / total). */
  onRun?(passed: number, total: number): void;
  /** Jam shift untuk kasus yang memburuk seiring waktu (insiden produksi). */
  clock?: { nowMs: number; openedAtMs: number | null; shiftOrder: number } | undefined;
  /** Rollback darurat insiden produksi. */
  onRollback?(): void;
}

export interface CaseTypeDef<TCase extends BaseCase = BaseCase> {
  type: string;
  schema: z.ZodType<TCase, unknown>;
  /** Fungsi murni: dari kasus + aksi pemain → hasil. Tanpa React. */
  evaluate(c: TCase, input: PlayerInput): CaseOutcome;
  /** Render dokumen; setiap bagian yang bisa ditandai membungkus <Evidence>. */
  Document: ComponentType<DocumentProps<TCase>>;
  /** Ikon & judul di antrian. */
  queueLabel(c: TCase): { icon: string; title: string };
  /** Siapa yang membawa kasus ini ke meja (potret + satu kalimat). Tidak boleh membocorkan jawaban. */
  visitor?(c: TCase): Visitor;
  /** Keputusan yang berlaku untuk tipe ini (subset keputusan mode); tanpa ini semuanya. */
  decisions?: readonly DecisionId[];
  /** Tugas ketik (ADR 026): tombol keputusan aktif hanya bila jawaban siap dikirim. */
  ready?(c: TCase, answer: CaseAnswer | undefined): boolean;
}

export interface Visitor {
  name: string;
  role: string;
  /** 'person' digambar dari namanya; 'system' = alat pemantau otomatis. */
  kind: 'person' | 'system';
  line: string;
}

/** Membuang parameter tipe agar beberapa tipe kasus bisa disimpan dalam satu array. */
export function defineCaseType<TCase extends BaseCase>(def: CaseTypeDef<TCase>): CaseTypeDef {
  return def as unknown as CaseTypeDef;
}

/**
 * Variasi kasus prosedural. Murni & deterministik: kasus yang sama untuk rng yang sama.
 * Melempar error jika `params` tidak valid (ditangkap content:check).
 */
export type CaseGenerator = (
  params: Record<string, unknown>,
  rng: RngState,
  /** `locale`: bahasa teks kasus (bawaan 'id'). Struktur & jawaban tidak boleh bergantung padanya. */
  ctx: { id: string; locale?: 'id' | 'en' },
) => [BaseCase, RngState];

export interface DeskProps {
  mode: CareerMode;
  content: ModeContent;
  session: ShiftSession;
  wallet: number;
  mastery: MasteryMap;
  toolsOwned: readonly string[];
  /** Upgrade meja yang dimiliki (ADR 027): dipajang di meja. */
  upgrades?: readonly { id: string; icon: string; name: string }[];
  /** Mode Latihan (PRD S5): meja menampilkan penanda bahwa hasil tidak disimpan. */
  practice: boolean;
  /** Nada berita dampak di koran pagi (dari shift sebelumnya); null = tanpa berita dampak. */
  newsTier?: NewsTier | null;
  dispatch(action: ShiftAction): void;
}

export interface CareerMode {
  id: 'soc' | 'support' | 'dev' | 'data' | (string & {});
  title: string;
  deskTitle: string;
  status: 'available' | 'locked' | 'coming-soon';
  decisions: { id: DecisionId; label: string; unlockedAtShift: number }[];
  caseTypes: CaseTypeDef[];
  generators?: Record<string, CaseGenerator>;
  /** ID pembicara mentor meja ini (untuk judul petunjuk), mis. 'rani' atau 'joko'. */
  mentor: string;
  /**
   * Catatan pada slip umpan balik per dampak keputusan (ADR 025). Tanpa ini dipakai teks SOC.
   * Getter, agar ikut bahasa aktif.
   */
  citations?: Partial<Record<CaseImpact, string>>;
  /** Komponen meja; menerima session dari engine & dispatch. Di-lazy-load. */
  Desk: LazyExoticComponent<ComponentType<DeskProps>>;
  contentRoot: string;
  /**
   * Memuat & memvalidasi konten mode (code-split). Tambahan dari sketsa §4: app butuh konten
   * untuk membuat ShiftPlan dan menampilkan Laporan tanpa tahu struktur folder mode.
   */
  /** Konten mode dalam bahasa tertentu (PRD C4); semua bahasa punya struktur identik. */
  loadContent(locale: Locale): Promise<ModeContent>;
}

/** Mode yang tampil di HUB tapi belum bisa dimainkan. */
export interface UpcomingMode {
  id: string;
  title: string;
  deskTitle: string;
  status: 'coming-soon';
}
