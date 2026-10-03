import { applyTrust, shiftPay, trustDelta, type PayRule } from './economy.ts';
import { createRng } from './rng.ts';
import { caseScore, shiftStars, timeBonus } from './scoring.ts';
import type {
  CaseOutcome,
  EvidenceId,
  PlayMode,
  SessionCase,
  ShiftPlan,
  ShiftSession,
} from './types.ts';

export interface StartShiftParams {
  plan: ShiftPlan;
  seed: number;
  playMode: PlayMode;
  trust: number;
}

export type ShiftAction =
  | ({ type: 'START_SHIFT' } & StartShiftParams)
  | { type: 'DISMISS_BRIEFING' }
  | { type: 'TICK'; dtMs: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'OPEN_CASE'; caseId: string }
  | { type: 'TOGGLE_MARK'; evidenceId: EvidenceId }
  | { type: 'USE_HINT' }
  /** `outcome` berasal dari `CaseTypeDef.evaluate()` milik mode. */
  | { type: 'DECIDE'; outcome: CaseOutcome }
  | { type: 'CLOSE_FEEDBACK' }
  | { type: 'END_SHIFT' };

export function startShift({ plan, seed, playMode, trust }: StartShiftParams): ShiftSession {
  const msPerGameMinute = plan.realSecondsPerGameMinute * 1000;
  const cases: SessionCase[] = [...plan.cases]
    .sort((a, b) => a.arriveAt - b.arriveAt)
    .map((c) => ({
      caseId: c.caseId,
      arriveAtMs: c.arriveAt * msPerGameMinute,
      status: 'pending',
      marks: [],
      hintsUsed: 0,
      openedAtMs: null,
      outcome: null,
      score: null,
    }));
  return arrive({
    shiftId: plan.shiftId,
    modeId: plan.modeId,
    shiftOrder: plan.order,
    playMode,
    seed,
    rng: createRng(seed),
    phase: 'briefing',
    paused: false,
    elapsedMs: 0,
    durationMs: plan.durationGameMinutes * msPerGameMinute,
    msPerGameMinute,
    cases,
    activeCaseId: null,
    feedbackCaseId: null,
    trust,
  });
}

/** Kasus yang jamnya sudah tiba berpindah dari pending ke arrived. */
function arrive(s: ShiftSession): ShiftSession {
  if (!s.cases.some((c) => c.status === 'pending' && c.arriveAtMs <= s.elapsedMs)) return s;
  return {
    ...s,
    cases: s.cases.map((c) =>
      c.status === 'pending' && c.arriveAtMs <= s.elapsedMs ? { ...c, status: 'arrived' } : c,
    ),
  };
}

function updateCase(
  s: ShiftSession,
  caseId: string,
  fn: (c: SessionCase) => SessionCase,
): ShiftSession {
  return { ...s, cases: s.cases.map((c) => (c.caseId === caseId ? fn(c) : c)) };
}

function end(s: ShiftSession): ShiftSession {
  return {
    ...s,
    phase: 'ended',
    activeCaseId: null,
    feedbackCaseId: null,
    cases: s.cases.map((c) => (c.status === 'decided' ? c : { ...c, status: 'missed' })),
  };
}

/** Setelah umpan balik: selesai jika semua kasus beres; lompati jam jika antrian kosong. */
function afterCase(s: ShiftSession): ShiftSession {
  if (s.cases.every((c) => c.status === 'decided' || c.status === 'missed')) return end(s);
  if (s.cases.some((c) => c.status === 'arrived')) return s;
  const next = s.cases.find((c) => c.status === 'pending');
  if (!next) return s;
  return arrive({ ...s, elapsedMs: Math.max(s.elapsedMs, next.arriveAtMs) });
}

function tick(s: ShiftSession, dtMs: number): ShiftSession {
  if (s.paused || (s.phase !== 'working' && s.phase !== 'inspecting') || dtMs <= 0) return s;
  const elapsedMs = Math.min(s.durationMs, s.elapsedMs + dtMs);
  const next = arrive({ ...s, elapsedMs });
  if (elapsedMs < s.durationMs) return next;
  if (s.playMode === 'normal') return end(next);
  // Mode Santai: tanpa penalti waktu; semua kasus tersisa langsung masuk antrian.
  return arrive({ ...next, elapsedMs: Math.max(elapsedMs, ...s.cases.map((c) => c.arriveAtMs)) });
}

function decide(s: ShiftSession, outcome: CaseOutcome): ShiftSession {
  const active = s.cases.find((c) => c.caseId === s.activeCaseId);
  if (s.phase !== 'inspecting' || !active || active.caseId !== outcome.caseId) return s;
  const score = caseScore({
    decisionScore: outcome.decisionScore,
    evidenceScore: outcome.evidenceScore,
    hintsUsed: active.hintsUsed,
    timeBonus: timeBonus(
      s.playMode,
      outcome.decisionScore,
      s.elapsedMs - (active.openedAtMs ?? s.elapsedMs),
    ),
  });
  return {
    ...updateCase(s, active.caseId, (c) => ({ ...c, status: 'decided', outcome, score })),
    phase: 'feedback',
    feedbackCaseId: active.caseId,
    trust: applyTrust(s.trust, trustDelta(outcome.impact, outcome.severity)),
  };
}

export function shiftReducer(s: ShiftSession, a: ShiftAction): ShiftSession {
  if (a.type === 'START_SHIFT') return startShift(a);
  if (s.phase === 'ended') return s;

  switch (a.type) {
    case 'DISMISS_BRIEFING':
      return s.phase === 'briefing' ? { ...s, phase: 'working' } : s;
    case 'TICK':
      return tick(s, a.dtMs);
    case 'PAUSE':
      return s.paused ? s : { ...s, paused: true };
    case 'RESUME':
      return s.paused ? { ...s, paused: false } : s;
    case 'OPEN_CASE': {
      const c = s.cases.find((x) => x.caseId === a.caseId);
      if ((s.phase !== 'working' && s.phase !== 'inspecting') || c?.status !== 'arrived') return s;
      return {
        ...updateCase(s, a.caseId, (x) => ({ ...x, openedAtMs: x.openedAtMs ?? s.elapsedMs })),
        phase: 'inspecting',
        activeCaseId: a.caseId,
      };
    }
    case 'TOGGLE_MARK': {
      if (s.phase !== 'inspecting' || !s.activeCaseId) return s;
      return updateCase(s, s.activeCaseId, (c) => ({
        ...c,
        marks: c.marks.includes(a.evidenceId)
          ? c.marks.filter((m) => m !== a.evidenceId)
          : [...c.marks, a.evidenceId],
      }));
    }
    case 'USE_HINT':
      if (s.phase !== 'inspecting' || !s.activeCaseId) return s;
      return updateCase(s, s.activeCaseId, (c) => ({ ...c, hintsUsed: c.hintsUsed + 1 }));
    case 'DECIDE':
      return decide(s, a.outcome);
    case 'CLOSE_FEEDBACK':
      if (s.phase !== 'feedback') return s;
      return afterCase({ ...s, phase: 'working', activeCaseId: null, feedbackCaseId: null });
    case 'END_SHIFT':
      return end(s);
  }
}

export interface ShiftSummary {
  averageScore: number;
  correctCount: number;
  decidedCount: number;
  totalCount: number;
  pay: number;
  stars: 0 | 1 | 2 | 3;
  trust: number;
}

export function summarizeShift(s: ShiftSession, pay: PayRule): ShiftSummary {
  const total = s.cases.length;
  const sum = s.cases.reduce((acc, c) => acc + (c.score ?? 0), 0);
  const averageScore = total === 0 ? 0 : Math.round(sum / total);
  const correctCount = s.cases.filter((c) => c.outcome?.correct).length;
  return {
    averageScore,
    correctCount,
    decidedCount: s.cases.filter((c) => c.status === 'decided').length,
    totalCount: total,
    pay: shiftPay(pay, correctCount),
    stars: shiftStars(averageScore, s.trust),
    trust: s.trust,
  };
}
