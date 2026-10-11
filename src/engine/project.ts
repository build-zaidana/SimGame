/**
 * Proyek klien (ADR 032): pekerjaan nyata yang lebih panjang dari satu shift. Pemain memilah
 * kebutuhan di brief, merencanakan sprint di papan kerja sesuai kapasitas, mengerjakan kartunya
 * di meja (sprint = satu sesi shift biasa), lalu melihat hasilnya di retro. Murni: tanpa React/DOM.
 */
import type { ShiftPlan, ShiftSession } from './types.ts';

export type Priority = 'must' | 'should' | 'could';
export type BriefKind = 'clear' | 'ambiguous' | 'out-of-scope';

export interface ProjectCard {
  id: string;
  points: number;
  priority: Priority;
  /** Kasus mode yang dikerjakan saat kartu ini ada di sprint. */
  caseId: string;
}

/** Progres satu proyek di save (v15). */
export interface ProjectProgress {
  /** Skor memilah kebutuhan (0–1); tidak ada = brief belum dikerjakan. */
  briefScore?: number | undefined;
  sprintsDone: number;
  /** Kartu yang sudah selesai (urut selesai). */
  doneCards: string[];
  /** Poin selesai per sprint. */
  velocity: number[];
  /** Skor perencanaan per sprint (0–1). */
  planScores: number[];
  /** Waktu proyek selesai (ISO). */
  completedAt?: string | undefined;
}

export function newProjectProgress(): ProjectProgress {
  return { sprintsDone: 0, doneCards: [], velocity: [], planScores: [] };
}

/** Bagian kebutuhan yang dipilah dengan benar (0–1) dan ID yang salah/terlewat. */
export function scoreBrief(
  items: readonly { id: string; kind: BriefKind }[],
  answers: Readonly<Record<string, BriefKind>>,
): { score: number; wrong: string[] } {
  const wrong = items.filter((i) => answers[i.id] !== i.kind).map((i) => i.id);
  return { score: items.length ? (items.length - wrong.length) / items.length : 1, wrong };
}

/** Kartu yang belum selesai, dalam urutan konten. */
export function remainingCards<T extends ProjectCard>(
  cards: readonly T[],
  progress: Pick<ProjectProgress, 'doneCards'>,
): T[] {
  return cards.filter((c) => !progress.doneCards.includes(c.id));
}

const pointsOf = (cards: readonly ProjectCard[]) => cards.reduce((sum, c) => sum + c.points, 0);

/** Kartu boleh masuk sprint bila belum dipilih dan masih muat di kapasitas. */
export function canAdd(
  selected: readonly ProjectCard[],
  card: ProjectCard,
  capacity: number,
): boolean {
  return !selected.some((c) => c.id === card.id) && pointsOf(selected) + card.points <= capacity;
}

/**
 * Nilai perencanaan: must-have didahulukan. Acuan = poin must-have yang bisa muat bila dipilih
 * lebih dulu (urutan konten); nilai = poin must-have yang dipilih ÷ acuan. Tanpa must-have tersisa,
 * rencana yang terisi dinilai penuh, rencana kosong nol.
 */
export function scorePlan(
  remaining: readonly ProjectCard[],
  selected: readonly ProjectCard[],
  capacity: number,
): number {
  let room = capacity;
  let reachable = 0;
  for (const c of remaining.filter((x) => x.priority === 'must')) {
    if (c.points <= room) {
      room -= c.points;
      reachable += c.points;
    }
  }
  if (reachable === 0) return selected.length > 0 ? 1 : 0;
  const chosen = pointsOf(selected.filter((c) => c.priority === 'must'));
  return Math.min(1, chosen / reachable);
}

/** Satu sprint sebagai rencana shift: kartu langsung ada di papan, kejutan datang belakangan. */
export function sprintPlan(p: {
  projectId: string;
  modeId: string;
  sprint: number;
  /** Tingkat shift untuk keputusan yang terbuka bertahap (mis. Rollback mulai shift 3). */
  level: number;
  cards: readonly ProjectCard[];
  surprises: readonly { caseId: string; arriveAt: number }[];
  durationGameMinutes: number;
  realSecondsPerGameMinute: number;
}): ShiftPlan {
  return {
    shiftId: `${p.projectId}-sprint-${p.sprint}`,
    modeId: p.modeId,
    order: p.level,
    durationGameMinutes: p.durationGameMinutes,
    realSecondsPerGameMinute: p.realSecondsPerGameMinute,
    cases: [
      ...p.cards.map((c) => ({ caseId: c.caseId, arriveAt: 0 })),
      ...p.surprises.map((s) => ({ caseId: s.caseId, arriveAt: s.arriveAt })),
    ],
  };
}

export interface SprintOutcome {
  done: string[];
  /** Kartu yang belum selesai: kembali ke backlog untuk sprint berikutnya. */
  carried: string[];
  donePoints: number;
  plannedPoints: number;
}

/** Kartu selesai bila kasusnya diputuskan dengan benar (tugas: semua tes lulus). */
export function sprintOutcome(session: ShiftSession, cards: readonly ProjectCard[]): SprintOutcome {
  const ok = (c: ProjectCard) =>
    session.cases.some(
      (x) => x.caseId === c.caseId && x.status === 'decided' && x.outcome?.correct,
    );
  const done = cards.filter(ok);
  const carried = cards.filter((c) => !ok(c));
  return {
    done: done.map((c) => c.id),
    carried: carried.map((c) => c.id),
    donePoints: pointsOf(done),
    plannedPoints: pointsOf(cards),
  };
}

export function commitSprint(
  progress: ProjectProgress,
  outcome: SprintOutcome,
  planScore: number,
): ProjectProgress {
  return {
    ...progress,
    sprintsDone: progress.sprintsDone + 1,
    doneCards: [
      ...progress.doneCards,
      ...outcome.done.filter((id) => !progress.doneCards.includes(id)),
    ],
    velocity: [...progress.velocity, outcome.donePoints],
    planScores: [...progress.planScores, planScore],
  };
}
