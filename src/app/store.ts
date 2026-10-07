import { create } from 'zustand';
import type { ModeContent } from '../content/loader.ts';
import type { CaseSchemas } from '../content/loader.ts';
import { locale, setLocale, type Locale } from '../i18n/index.ts';
import { buyTool, buyUpgrade, type BuyResult, type BuyUpgradeResult } from '../engine/economy.ts';
import { shiftReducer, startShift, summarizeShift, type ShiftAction } from '../engine/shift.ts';
import type { ShiftSession } from '../engine/types.ts';
import type { CareerMode } from '../modes/contract.ts';
import { getMode, modes } from '../modes/registry.ts';
import { createLocalSaveRepository } from '../persistence/LocalSaveRepository.ts';
import type { SaveRepository, StorageKind } from '../persistence/SaveRepository.ts';
import {
  createNewSave,
  newModeProgress,
  type SaveData,
  type Settings,
} from '../persistence/saveSchema.ts';
import { encodeSave } from '../persistence/transfer.ts';
import {
  awardBadges,
  buildDaily,
  buildShift,
  commitDaily,
  perksFor,
  rankOf,
  commitShift,
  nextShift,
  practiceShifts,
  withGeneratedCases,
  type ReviewResult,
} from './progress.ts';
import { playSfx } from './sfx.ts';
import { currentStreak } from '../engine/badges.ts';
import { ANALYTICS_OPT_IN, bindAnalyticsIdentity, telemetry } from './telemetry.ts';

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
  | 'assessment'
  | 'learning-report'
  | 'badges';

/** Layar menu yang dibuka "di atas" layar lain dan kembali ke sana. */
type MenuScreen =
  'rulebook' | 'save-transfer' | 'shop' | 'assessment' | 'settings' | 'learning-report' | 'badges';
export type AssessmentKind = 'pre' | 'post';

export type SaveNotice = 'memory-only' | 'restored-backup' | 'reset' | null;

interface AppState {
  status: 'loading' | 'ready' | 'error';
  storageKind: StorageKind | null;
  notice: SaveNotice;
  screen: Screen;
  save: SaveData | null;
  session: ShiftSession | null;
  /** true = sesi Mode Latihan: hasilnya tidak disimpan ke progres utama. */
  practice: boolean;
  content: ModeContent | null;
  /** Konten setiap mode yang sudah dimuat (HUB menampilkan semua meja sekaligus). */
  contents: Record<string, ModeContent>;
  /** Mode yang dilihat di layar Toko / Buku Panduan / Lencana di luar shift. */
  menuMode: string;
  setMenuMode(modeId: string): void;
  /** Layar asal untuk tombol Kembali di layar menu. */
  returnTo: Screen;
  rulebookFocus: string | null;
  assessmentKind: AssessmentKind;
  /** Lencana yang baru didapat (ditampilkan sebagai banner di kantor sampai ditutup). */
  newBadges: string[];
  dismissBadges(): void;
  /** Bahasa aktif (PRD C4); App memasang ulang layar saat berubah. */
  locale: Locale;
  setLanguage(next: Locale): Promise<void>;
  init(): Promise<void>;
  goTo(screen: Screen): void;
  dismissNotice(): void;
  /** Memuat konten mode lebih awal (judul shift di HUB, masuk meja lebih cepat). */
  preloadContent(modeId: string): Promise<void>;
  /** Masuk meja: lanjutkan shift yang tersimpan, atau mulai shift berikutnya. */
  enterMode(modeId: string): Promise<void>;
  /** Mode Latihan: lanjutkan latihan tersimpan, atau mulai latihan shift yang sudah selesai. */
  enterPractice(modeId: string, shiftId?: string): Promise<void>;
  cancelPractice(modeId: string): void;
  /** Tantangan harian (ADR 029): lanjutkan yang tersimpan atau mulai tantangan hari ini. */
  enterDaily(modeId: string): Promise<void>;
  dispatch(action: ShiftAction): void;
  openMenu(screen: MenuScreen, modeId?: string): void;
  openRulebook(focusChapterId: string | null): void;
  openAssessment(kind: AssessmentKind): void;
  back(): void;
  buyTool(modeId: string, toolId: string): BuyResult | null;
  buyUpgrade(modeId: string, upgradeId: string): BuyUpgradeResult | null;
  exportCode(): Promise<string>;
  /** Mengganti save di perangkat ini (save lama menjadi cadangan). */
  importSave(data: SaveData): void;
  setFlag(key: string, value: boolean): void;
  updateSettings(patch: Partial<Settings>): void;
  saveAssessment(kind: AssessmentKind, correct: number, total: number): void;
  /** Laporan → Review Cepat selesai → simpan hasil (termasuk jawaban review) → kembali ke HUB. */
  finishShift(reviewResults: readonly ReviewResult[]): void;
}

let repo: SaveRepository | null = null;
const contentCache = new Map<string, Promise<ModeContent>>();
const AUTOSAVE_TICK_MS = 5000;
let msSinceSave = 0;

function loadContent(modeId: string): Promise<ModeContent> {
  const mode = getMode(modeId);
  if (!mode) return Promise.reject(new Error(`unknown mode ${modeId}`));
  const key = `${modeId}:${locale}`;
  let p = contentCache.get(key);
  if (!p) {
    p = mode.loadContent(locale);
    contentCache.set(key, p);
  }
  return p;
}

const nowIso = () => new Date().toISOString();

const schemasOf = (mode: CareerMode): CaseSchemas =>
  Object.fromEntries(mode.caseTypes.map((t) => [t.type, t.schema]));

/** Repository menulis jurnal seketika dan mengantrekan tulisan IndexedDB sesuai urutan. */
function write(save: SaveData) {
  repo?.save(save).catch((e: unknown) => console.error('save failed', e));
}

/** Slot save untuk sesi: jalur utama atau Mode Latihan (PRD S5). */
type SessionSlot = 'activeSession' | 'practiceSession';
const slotOf = (practice: boolean): SessionSlot => (practice ? 'practiceSession' : 'activeSession');

function withSession(
  save: SaveData,
  session: ShiftSession | null,
  modeId: string,
  slot: SessionSlot,
): SaveData {
  const progress = save.modes[modeId] ?? newModeProgress();
  const { [slot]: _old, ...rest } = progress;
  return {
    ...save,
    updatedAt: nowIso(),
    modes: { ...save.modes, [modeId]: session ? { ...rest, [slot]: session } : rest },
  };
}

export const useAppStore = create<AppState>()((set, get) => ({
  status: 'loading',
  storageKind: null,
  notice: null,
  newBadges: [],
  locale: 'id',
  screen: 'title',
  save: null,
  session: null,
  practice: false,
  content: null,
  contents: {},
  menuMode: modes[0]?.id ?? 'soc',
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
      await setLocale(save.profile.settings.language);
      set({ status: 'ready', storageKind: kind, notice, save, locale });
    } catch (e) {
      console.error(e);
      set({ status: 'error' });
    }
  },

  goTo(screen) {
    set({ screen });
  },

  dismissBadges() {
    set({ newBadges: [] });
  },

  dismissNotice() {
    set({ notice: null });
  },

  async preloadContent(modeId) {
    const content = await loadContent(modeId);
    set({ contents: { ...get().contents, [modeId]: content } });
    if (!get().session && get().menuMode === modeId) set({ content });
  },

  setMenuMode(modeId) {
    set({ menuMode: modeId });
    void get().preloadContent(modeId);
  },

  enterMode(modeId) {
    return openSession(modeId, false);
  },

  enterPractice(modeId, shiftId) {
    return openSession(modeId, true, shiftId);
  },

  enterDaily(modeId) {
    return openSession(modeId, true, undefined, localDate());
  },

  cancelPractice(modeId) {
    const { save, session, practice } = get();
    if (!save) return;
    const next = withSession(save, null, modeId, 'practiceSession');
    write(next);
    set({
      save: next,
      ...(practice && session?.modeId === modeId ? { session: null, practice: false } : {}),
    });
  },

  dispatch(action) {
    const { session, save } = get();
    if (!session || !save) return;
    const next = shiftReducer(session, action);
    if (next === session) return;

    const sound = save.profile.settings.sound;
    if (sound) {
      const arrived = (x: typeof session) => x.cases.filter((c) => c.status !== 'pending').length;
      if (arrived(next) > arrived(session) && next.phase !== 'briefing') playSfx('arrive');
      if (next.phase === 'ended' && session.phase !== 'ended') playSfx('bell');
    }

    if (action.type === 'TOGGLE_MARK' && sound) {
      const was = session.cases.find((c) => c.caseId === session.activeCaseId)?.marks;
      playSfx('tick', 0, was?.includes(action.evidenceId) ? 0.75 : 1);
    }

    if (action.type === 'DECIDE') {
      // Stempel menghantam kertas, lalu nada benar/salah saat slip muncul.
      if (sound) {
        playSfx('stamp');
        // Nada benar naik setiap keputusan tepat beruntun; tiap kelipatan 3 dapat arpeggio.
        const streak = currentStreak(next.cases);
        if (!action.outcome.correct) playSfx('wrong', 0.45);
        else if (streak >= 3 && streak % 3 === 0) playSfx('combo', 0.45);
        else playSfx('correct', 0.45, 2 ** (Math.min(streak - 1, 7) / 12));
      }
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
      nextSave = withSession(save, next, next.modeId, slotOf(get().practice));
      write(nextSave);
    }
    set({
      session: next,
      save: nextSave,
      screen: next.phase === 'ended' ? 'report' : get().screen,
    });
  },

  openMenu(screen, modeId) {
    if (modeId) get().setMenuMode(modeId);
    const from = get().screen;
    const menus: Screen[] = [
      'rulebook',
      'save-transfer',
      'shop',
      'assessment',
      'settings',
      'learning-report',
      'badges',
    ];
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
    const { save } = get();
    // Konten mode yang dibeli (tab Toko bisa berbeda dari mode yang terakhir dimainkan).
    const content = get().contents[modeId] ?? get().content;
    const tool = content?.tools.find((t) => t.id === toolId);
    if (!save || !tool) return null;
    const progress = save.modes[modeId] ?? newModeProgress();
    const result = buyTool(progress, tool);
    if (result.ok && content) {
      const now = nowIso();
      const { progress: withBadges, earned } = awardBadges(
        { ...progress, wallet: result.wallet, toolsOwned: result.toolsOwned },
        content,
        now,
      );
      const next: SaveData = {
        ...save,
        updatedAt: now,
        modes: { ...save.modes, [modeId]: withBadges },
      };
      write(next);
      set({ save: next, newBadges: [...get().newBadges, ...earned] });
    }
    return result;
  },

  buyUpgrade(modeId, upgradeId) {
    const { save } = get();
    const content = get().contents[modeId] ?? get().content;
    const item = content?.upgrades.find((u) => u.id === upgradeId);
    if (!save || !content || !item) return null;
    const progress = save.modes[modeId] ?? newModeProgress();
    const result = buyUpgrade(progress, item, rankOf(progress, content));
    if (result.ok) {
      const next: SaveData = {
        ...save,
        updatedAt: nowIso(),
        modes: {
          ...save.modes,
          [modeId]: { ...progress, wallet: result.wallet, upgradesOwned: result.upgradesOwned },
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
    if (data.profile.settings.language !== locale)
      void get().setLanguage(data.profile.settings.language);
  },

  async setLanguage(next) {
    await setLocale(next);
    get().updateSettings({ language: next });
    // Konten ikut berganti; kasus prosedural sesi yang sedang berjalan tetap dalam bahasa awalnya.
    const { content, session, contents } = get();
    const reloaded: Record<string, ModeContent> = {};
    for (const id of Object.keys(contents)) reloaded[id] = await loadContent(id);
    set({ contents: reloaded });
    const modeId = session?.modeId ?? content?.meta.id;
    const mode = modeId ? getMode(modeId) : undefined;
    if (content && mode) {
      const fresh = await loadContent(mode.id);
      set({ content: session ? withGeneratedCases(fresh, session, schemasOf(mode)) : fresh });
    }
    set({ locale: next });
  },

  updateSettings(patch) {
    const { save } = get();
    if (!save) return;
    const settings = { ...save.profile.settings, ...patch };
    const next = { ...save, updatedAt: nowIso(), profile: { ...save.profile, settings } };
    write(next);
    set({ save: next });
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
    const { session, save, content, practice } = get();
    if (!session || !save || !content || session.phase !== 'ended') return;
    const shift = content.shifts.find((s) => s.id === session.shiftId);
    const summary = summarizeShift(session, shift?.pay ?? { base: 0, perCase: 0 });
    // Tantangan harian bukan shift: tidak dicatat sebagai shift selesai (tidak ada shift_started).
    if (!session.daily)
      telemetry.track({
        name: 'shift_completed',
        modeId: session.modeId,
        shiftId: session.shiftId,
        averageScore: summary.averageScore,
        stars: summary.stars,
        practice,
      });
    // Latihan: hanya slot latihan yang dikosongkan; gaji, kepercayaan, skor, dan Leitner tidak berubah.
    // Tantangan harian: hanya hadiahnya dan streak harian yang disimpan (ADR 029).
    const next = session.daily
      ? commitDaily(save, session, nowIso()).save
      : practice
        ? withSession(save, null, session.modeId, 'practiceSession')
        : commitShift(save, session, content, nowIso(), reviewResults);
    write(next);
    const before = save.modes[session.modeId]?.badges ?? {};
    const earned = Object.keys(next.modes[session.modeId]?.badges ?? {}).filter(
      (b) => !(b in before),
    );
    if (earned.length && save.profile.settings.sound) playSfx('bell');
    set({
      save: next,
      session: null,
      practice: false,
      screen: 'hub',
      newBadges: [...get().newBadges, ...earned],
    });
  },
}));

// Analitik anonim (PRD S6) hanya mengirim bila pemain menyalakannya; ID-nya ID instalasi acak.
bindAnalyticsIdentity(() => {
  const { save } = useAppStore.getState();
  return save?.flags[ANALYTICS_OPT_IN] === true ? { installId: save.installId } : null;
});

/** Tanggal lokal pemain ('YYYY-MM-DD') untuk tantangan harian. */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Membuka sesi jalur utama atau latihan: lanjutkan yang tersimpan, atau mulai shift baru. */
async function openSession(
  modeId: string,
  practice: boolean,
  practiceShiftId?: string,
  dailyDate?: string,
) {
  const { save } = useAppStore.getState();
  const mode = getMode(modeId);
  if (!save || !mode) return;
  const content = await loadContent(modeId);
  const progress = save.modes[modeId] ?? newModeProgress();
  const slot = slotOf(practice);
  let session = progress[slot] ?? null;
  if (!session && dailyDate) {
    const plan = buildDaily(modeId, content, progress, dailyDate);
    if (!plan) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
    session = {
      ...startShift({
        plan,
        seed,
        playMode: save.profile.settings.playMode,
        trust: progress.trust,
        perks: perksFor(progress, content),
      }),
      daily: { date: dailyDate },
    };
  }
  if (!session) {
    const shift = practice
      ? practiceShifts(content, progress).find((s) => s.id === practiceShiftId)
      : nextShift(content, progress);
    if (!shift) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
    const { plan, generatedCases } = buildShift(modeId, shift, mode.generators ?? {}, seed, locale);
    session = startShift({
      plan,
      seed,
      playMode: save.profile.settings.playMode,
      trust: progress.trust,
      generatedCases,
      perks: perksFor(progress, content),
    });
    telemetry.track({
      name: 'shift_started',
      modeId,
      shiftId: shift.id,
      playMode: session.playMode,
      practice,
    });
  }
  const next = withSession(save, session, modeId, slot);
  write(next);
  useAppStore.setState({
    contents: { ...useAppStore.getState().contents, [modeId]: content },
    content: withGeneratedCases(content, session, schemasOf(mode)),
    session,
    practice,
    save: next,
    screen: session.phase === 'ended' ? 'report' : 'desk',
  });
}

/** Simpan posisi jam saat tab disembunyikan / halaman ditutup. */
export function persistNow() {
  const { session, save, practice } = useAppStore.getState();
  if (!session || !save) return;
  msSinceSave = 0;
  const next = withSession(save, session, session.modeId, slotOf(practice));
  write(next);
  useAppStore.setState({ save: next });
}
