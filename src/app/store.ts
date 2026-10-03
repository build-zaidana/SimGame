import { create } from 'zustand';
import type { ModeContent } from '../content/loader.ts';
import { shiftReducer, startShift, summarizeShift, type ShiftAction } from '../engine/shift.ts';
import type { ShiftSession } from '../engine/types.ts';
import { getMode } from '../modes/registry.ts';
import { createLocalSaveRepository } from '../persistence/LocalSaveRepository.ts';
import type { SaveRepository, StorageKind } from '../persistence/SaveRepository.ts';
import { createNewSave, newModeProgress, type SaveData } from '../persistence/saveSchema.ts';
import { noopTelemetry } from '../telemetry/NoopTelemetry.ts';
import type { Telemetry } from '../telemetry/Telemetry.ts';
import { commitShift, nextShift, planFromShift } from './progress.ts';

export type Screen =
  'title' | 'hub' | 'desk' | 'report' | 'review' | 'rulebook' | 'settings' | 'save-transfer';

export type SaveNotice = 'memory-only' | 'restored-backup' | 'reset' | null;

interface AppState {
  status: 'loading' | 'ready' | 'error';
  storageKind: StorageKind | null;
  notice: SaveNotice;
  screen: Screen;
  save: SaveData | null;
  session: ShiftSession | null;
  content: ModeContent | null;
  init(): Promise<void>;
  goTo(screen: Screen): void;
  dismissNotice(): void;
  /** Memuat konten mode lebih awal (judul shift di HUB, masuk meja lebih cepat). */
  preloadContent(modeId: string): Promise<void>;
  /** Masuk meja: lanjutkan shift yang tersimpan, atau mulai shift berikutnya. */
  enterMode(modeId: string): Promise<void>;
  dispatch(action: ShiftAction): void;
  /** Laporan dibaca → simpan hasil → kembali ke HUB. */
  finishShift(): void;
}

let repo: SaveRepository | null = null;
const telemetry: Telemetry = noopTelemetry;
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
    if (!save) return;
    const content = await loadContent(modeId);
    const progress = save.modes[modeId] ?? newModeProgress();
    let session = progress.activeSession ?? null;
    if (!session) {
      const shift = nextShift(content, progress);
      if (!shift) return;
      session = startShift({
        plan: planFromShift(modeId, shift),
        seed: crypto.getRandomValues(new Uint32Array(1))[0] ?? 1,
        playMode: save.profile.settings.playMode,
        trust: progress.trust,
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
    set({ content, session, save: next, screen: session.phase === 'ended' ? 'report' : 'desk' });
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

  finishShift() {
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
    const next = commitShift(save, session, content, nowIso());
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
