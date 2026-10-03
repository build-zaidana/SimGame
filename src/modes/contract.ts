import type { ComponentType, LazyExoticComponent } from 'react';
import type { z } from 'zod';
import type { ModeContent } from '../content/loader.ts';
import type { BaseCase } from '../content/schemas.ts';
import type { ShiftAction } from '../engine/shift.ts';
import type {
  CaseOutcome,
  DecisionId,
  EvidenceId,
  PlayerInput,
  ShiftSession,
} from '../engine/types.ts';
import type { RngState } from '../engine/rng.ts';

export interface DocumentProps<TCase extends BaseCase = BaseCase> {
  data: TCase;
  marks: ReadonlySet<EvidenceId>;
  onToggleMark(id: EvidenceId): void;
  /** true setelah keputusan dibuat: bukti tidak bisa diubah lagi. */
  locked: boolean;
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
}

/** Membuang parameter tipe agar beberapa tipe kasus bisa disimpan dalam satu array. */
export function defineCaseType<TCase extends BaseCase>(def: CaseTypeDef<TCase>): CaseTypeDef {
  return def as unknown as CaseTypeDef;
}

/** Variasi kasus prosedural (M3). */
export type CaseGenerator = (
  params: Record<string, unknown>,
  rng: RngState,
) => [BaseCase, RngState];

export interface DeskProps {
  mode: CareerMode;
  content: ModeContent;
  session: ShiftSession;
  wallet: number;
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
  /** Komponen meja; menerima session dari engine & dispatch. Di-lazy-load. */
  Desk: LazyExoticComponent<ComponentType<DeskProps>>;
  contentRoot: string;
  /**
   * Memuat & memvalidasi konten mode (code-split). Tambahan dari sketsa §4: app butuh konten
   * untuk membuat ShiftPlan dan menampilkan Laporan tanpa tahu struktur folder mode.
   */
  loadContent(): Promise<ModeContent>;
}

/** Mode yang tampil di HUB tapi belum bisa dimainkan. */
export interface UpcomingMode {
  id: string;
  title: string;
  deskTitle: string;
  status: 'coming-soon';
}
