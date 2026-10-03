import type { SessionCase } from './types.ts';

/** Aturan lencana (PRD C3, ADR 021). Data di konten; penilaiannya fungsi murni di sini. */
export type BadgeRule =
  | { type: 'shift-complete'; shiftId?: string }
  | { type: 'shift-stars'; stars: 1 | 2 | 3 }
  | { type: 'no-threat-allowed'; minCases: number; minStars?: number }
  | { type: 'no-legit-blocked'; minCases: number; minStars?: number }
  | { type: 'evidence-streak'; count: number }
  | { type: 'no-hints'; minCases: number; minStars?: number }
  | { type: 'review-perfect' }
  | { type: 'tools-owned'; count: number }
  | { type: 'trust-at-least'; value: number };

export interface BadgeContext {
  /** Shift yang baru selesai; null bila dinilai di luar shift (mis. membeli alat). */
  shiftId: string | null;
  cases: readonly SessionCase[];
  stars: number;
  trust: number;
  toolsOwned: number;
  reviewResults: readonly { correct: boolean }[];
}

const SHIFT_RULES = new Set<BadgeRule['type']>([
  'shift-complete',
  'shift-stars',
  'no-threat-allowed',
  'no-legit-blocked',
  'evidence-streak',
  'no-hints',
  'review-perfect',
]);

/** Semua kasus diputuskan (tidak ada yang terlewat) dan minimal `min` kasus. */
function allDecided(cases: readonly SessionCase[], min: number): boolean {
  return cases.length >= min && cases.every((c) => c.status === 'decided' && c.outcome);
}

function longestEvidenceStreak(cases: readonly SessionCase[]): number {
  const ordered = cases
    .filter((c) => c.status === 'decided' && c.outcome)
    .sort((a, b) => (a.openedAtMs ?? 0) - (b.openedAtMs ?? 0));
  let best = 0;
  let run = 0;
  for (const c of ordered) {
    const o = c.outcome!;
    const exact = o.correct && o.missedEvidence.length === 0 && o.wrongMarks.length === 0;
    run = exact ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function badgeEarned(rule: BadgeRule, ctx: BadgeContext): boolean {
  if (SHIFT_RULES.has(rule.type) && ctx.shiftId === null) return false;
  // Mencegah lencana dari asal klik (mis. mengizinkan semua = tak ada yang sah diblokir).
  if ('minStars' in rule && rule.minStars !== undefined && ctx.stars < rule.minStars) return false;
  switch (rule.type) {
    case 'shift-complete':
      return rule.shiftId === undefined || rule.shiftId === ctx.shiftId;
    case 'shift-stars':
      return ctx.stars >= rule.stars;
    case 'no-threat-allowed':
      return (
        allDecided(ctx.cases, rule.minCases) &&
        ctx.cases.every((c) => c.outcome?.impact !== 'threat-allowed')
      );
    case 'no-legit-blocked':
      return (
        allDecided(ctx.cases, rule.minCases) &&
        ctx.cases.every(
          (c) =>
            c.outcome?.impact !== 'legit-blocked' && c.outcome?.impact !== 'needless-escalation',
        )
      );
    case 'evidence-streak':
      return longestEvidenceStreak(ctx.cases) >= rule.count;
    case 'no-hints':
      return allDecided(ctx.cases, rule.minCases) && ctx.cases.every((c) => c.hintsUsed === 0);
    case 'review-perfect':
      return ctx.reviewResults.length > 0 && ctx.reviewResults.every((r) => r.correct);
    case 'tools-owned':
      return ctx.toolsOwned >= rule.count;
    case 'trust-at-least':
      return ctx.trust >= rule.value;
  }
}

/** ID lencana yang baru didapat sekarang (belum ada di `earned`), urut sesuai definisi. */
export function newBadges(
  defs: readonly { id: string; rule: BadgeRule }[],
  earned: Readonly<Record<string, string>>,
  ctx: BadgeContext,
): string[] {
  return defs.filter((d) => !(d.id in earned) && badgeEarned(d.rule, ctx)).map((d) => d.id);
}
