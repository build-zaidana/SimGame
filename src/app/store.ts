import { create } from 'zustand';
import type { ModeContent } from '../content/loader.ts';
import type { CaseSchemas } from '../content/loader.ts';
import { buyTool, type BuyResult } from '../engine/economy.ts';
import { shiftReducer, startShift, summarizeShift, type ShiftAction } from '../engine/shift.ts';
import type { ShiftSession } from '../engine/types.ts';
import type { CareerMode } from '../modes/contract.ts';
import { getMode } from '../modes/registry.ts';
import { createLocalSaveRepository } from '../persistence/LocalSaveRepository.ts';
import type { SaveRepository, StorageKind } from '../persistence/SaveRepository.ts';
import { createNewSave, newModeProgress, type SaveData } from '../persistence/saveSchema.ts';
import { encodeSave } from '../persistence/transfer.ts';
import {
  buildShift,
  commitShift,
  nextShift,
  withGeneratedCases,
  type ReviewResult,
} from './progress.ts';
import { telemetry } from './telemetry.ts';

export type Screen =
  | 'title'
  | 'hub'
  | 'desk'
  | 'report'
  | 'review'
  | 'rulebook'
  | 'settings'
  | 'save-transfer'
  | 'shop'
  | 'assessment';

/** Layar menu yang dibuka "di atas" layar lain dan kembali ke sana. */
type MenuScreen = 'rulebook' | 'save-transfer' | 'shop' | 'assessment';
export type AssessmentKind = 'pre' | 'post';

export type SaveNotice = 'memory-only' | 'restored-backup' | 'reset' | null;

interface AppState {
  status: 'loading' | 'ready' | 'error';
  storageKind: StorageKind | null;
  notice: SaveNotice;
  screen: Screen;
  save: SaveData | null;
  session: ShiftSession | null;
  content: ModeContent | null;
  /** Layar asal untuk tombol Kembali di layar menu. */
  returnTo: Screen;
  rulebookFocus: string | null;
  assessmentKind: AssessmentKind;
  init(): Promise<void>;
  goTo(screen: Screen): void;
  dismissNotice(): void;
  /** Memuat konten mode lebih awal (judul shift di HUB, masuk meja lebih cepat). */
  preloadContent(modeId: string): Promise<void>;
  /** Masuk meja: lanjutkan shift yang tersimpan, atau mulai shift berikutnya. */
  enterMode(modeId: string): Promise<void>;
  dispatch(action: ShiftAction): void;
  openMenu(screen: MenuScreen): void;
  openRulebook(focusChapterId: string | null): void;
  openAssessment(kind: AssessmentKind): void;
  back(): void;
  buyTool(modeId: string, toolId: string): BuyResult | null;
  exportCode(): Promise<string>;
  /** Mengganti save di perangkat ini (save lama menjadi cadangan). */
  importSave(data: SaveData): void;
  setFlag(key: string, value: boolean): void;
  saveAssessment(kind: AssessmentKind, correct: number, total: number): void;
  /** Laporan → Review Cepat selesai → simpan hasil (termasuk jawaban review) → kembali ke HUB. */
  finishShift(reviewResults: readonly ReviewResult[]): void;
}

let repo: SaveRepository | null = null;
const contentCache = new Map<string, Promise<ModeContent>>();
const AUTOSAVE_TICK_MS = 5000;
let msSinceSave = 0;
let writeChain: Promise<void> = Promise.resolve();

function loadContent(modeId: string): Promise<ModeContent> {
  const mode = getMode(modeId);
  if (!mode) return Promise.reject(new Error(`unknown mode ${modeId}`));
  let p = contentCache.get(modeId);
  if (!p) {
    p = mode.loadContent();
    contentCache.set(modeId, p);
  }
  return p;
}

const nowIso = () => new Date().toISOString();

const schemasOf = (mode: CareerMode): CaseSchemas =>
  Object.fromEntries(mode.caseTypes.map((t) => [t.type, t.schema]));

/** Tulis berurutan agar save lama tidak menimpa save baru. */
function write(save: SaveData) {
  const r = repo;
  if (!r) return;
  writeChain = writeChain
    .then(() => r.save(save))
    .catch((e: unknown) => console.error('save failed', e));
}

function withSession(save: SaveData, session: ShiftSession | null, modeId: string): SaveData {
  const progress = save.modes[modeId] ?? newModeProgress();
  const { activeSession: _old, ...rest } = progress;
  return {
    ...save,
    updatedAt: nowIso(),
    modes: { ...save.modes, [modeId]: session ? { ...rest, activeSession: session } : rest },
  };
}

export const useAppStore = create<AppState>()((set, get) => ({
  status: 'loading',
  storageKind: null,
  notice: null,
  screen: 'title',
  save: null,
  session: null,
  content: null,
  returnTo: 'hub',
  rulebookFocus: null,
  assessmentKind: 'pre',

  async init() {
    if (repo) return;
    try {
      const { repo: r, kind } = await createLocalSaveRepository();
      repo = r;
      let notice: SaveNotice = kind === 'memory' ? 'memory-only' : null;
      let save: SaveData | null;
      try {
        save = await r.load();
      } catch {
        save = await r.loadBackup();
        notice = save ? 'restored-backup' : 'reset';
      }
      if (!save) {
        save = createNewSave({ installId: crypto.randomUUID(), now: nowIso() });
        write(save);
      }
      set({ status: 'ready', storageKind: kind, notice, save });
    } catch (e) {
      console.error(e);
      set({ status: 'error' });
    }
  },

  goTo(screen) {
    set({ screen });
  },

  dismissNotice() {
    set({ notice: null });
  },

  async preloadContent(modeId) {
    const content = await loadContent(modeId);
    if (!get().session) set({ content });
  },

  async enterMode(modeId) {
    const { save } = get();
    const mode = getMode(modeId);
    if (!save || !mode) return;
    const content = await loadContent(modeId);
    const progress = save.modes[modeId] ?? newModeProgress();
    let session = progress.activeSession ?? null;
    if (!session) {
      const shift = nextShift(content, progress);
      if (!shift) return;
      const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
      const { plan, generatedCases } = buildShift(modeId, shift, mode.generators ?? {}, seed);
      session = startShift({
        plan,
        seed,
        playMode: save.profile.settings.playMode,
        trust: progress.trust,
        generatedCases,
      });
      telemetry.track({
        name: 'shift_started',
        modeId,
        shiftId: shift.id,
        playMode: session.playMode,
      });
    }
    const next = withSession(save, session, modeId);
    write(next);
    set({
      content: withGeneratedCases(content, session, schemasOf(mode)),
      session,
      save: next,
      screen: session.phase === 'ended' ? 'report' : 'desk',
    });
  },

  dispatch(action) {
    const { session, save } = get();
    if (!session || !save) return;
    const next = shiftReducer(session, action);
    if (next === session) return;

    if (action.type === 'DECIDE') {
      const c = next.cases.find((x) => x.caseId === action.outcome.caseId);
      telemetry.track({
        name: 'case_decided',
        modeId: next.modeId,
        caseId: action.outcome.caseId,
        correct: action.outcome.correct,
        evidenceScore: action.outcome.evidenceScore,
        ms: next.elapsedMs - (c?.openedAtMs ?? next.elapsedMs),
        hintsUsed: c?.hintsUsed ?? 0,
      });
    }

    // Simpan setiap aksi pemain; saat jam berjalan cukup tiap beberapa detik.
    let nextSave = save;
    if (action.type === 'TICK') msSinceSave += action.dtMs;
    if (action.type !== 'TICK' || msSinceSave >= AUTOSAVE_TICK_MS || next.phase === 'ended') {
      msSinceSave = 0;
      nextSave = withSession(save, next, next.modeId);
      write(nextSave);
    }
    set({
      session: next,
      save: nextSave,
      screen: next.phase === 'ended' ? 'report' : get().screen,
    });
  },

  openMenu(screen) {
    const from = get().screen;
    const menus: Screen[] = ['rulebook', 'save-transfer', 'shop', 'assessment'];
    set({ returnTo: menus.includes(from) ? get().returnTo : from, screen });
  },

  openRulebook(focusChapterId) {
    set({ rulebookFocus: focusChapterId });
    get().openMenu('rulebook');
  },

  openAssessment(kind) {
    set({ assessmentKind: kind });
    get().openMenu('assessment');
  },

  back() {
    set({ screen: get().returnTo });
  },

  buyTool(modeId, toolId) {
    const { save, content } = get();
    const tool = content?.tools.find((t) => t.id === toolId);
    if (!save || !tool) return null;
    const progress = save.modes[modeId] ?? newModeProgress();
    const result = buyTool(progress, tool);
    if (result.ok) {
      const next: SaveData = {
        ...save,
        updatedAt: nowIso(),
        modes: {
          ...save.modes,
          [modeId]: { ...progress, wallet: result.wallet, toolsOwned: result.toolsOwned },
        },
      };
      write(next);
      set({ save: next });
    }
    return result;
  },

  async exportCode() {
    const { save } = get();
    if (!save) throw new Error('no save');
    telemetry.track({ name: 'save_exported' });
    return encodeSave(save);
  },

  importSave(data) {
    write(data);
    telemetry.track({ name: 'save_imported' });
    set({ save: data, session: null, screen: 'hub', returnTo: 'hub' });
  },

  setFlag(key, value) {
    const { save } = get();
    if (!save) return;
    const next = { ...save, updatedAt: nowIso(), flags: { ...save.flags, [key]: value } };
    write(next);
    set({ save: next });
  },

  saveAssessment(kind, correct, total) {
    const { save } = get();
    if (!save) return;
    const result = { correct, total, takenAt: nowIso() };
    const next = {
      ...save,
      updatedAt: nowIso(),
      assessments: { ...save.assessments, [kind]: result },
    };
    write(next);
    set({ save: next });
  },

  finishShift(reviewResults) {
    const { session, save, content } = get();
    if (!session || !save || !content || session.phase !== 'ended') return;
    const shift = content.shifts.find((s) => s.id === session.shiftId);
    const summary = summarizeShift(session, shift?.pay ?? { base: 0, perCorrect: 0 });
    telemetry.track({
      name: 'shift_completed',
      modeId: session.modeId,
      shiftId: session.shiftId,
      averageScore: summary.averageScore,
      stars: summary.stars,
    });
    const next = commitShift(save, session, content, nowIso(), reviewResults);
    write(next);
    set({ save: next, session: null, screen: 'hub' });
  },
}));

/** Simpan posisi jam saat tab disembunyikan / halaman ditutup. */
export function persistNow() {
  const { session, save } = useAppStore.getState();
  if (!session || !save) return;
  msSinceSave = 0;
  const next = withSession(save, session, session.modeId);
  write(next);
  useAppStore.setState({ save: next });
}
