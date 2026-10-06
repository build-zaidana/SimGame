import type { ModeContent } from '../../content/loader.ts';
import { careerRank, nextRankGoal } from '../../engine/rank.ts';
import { t as id } from '../../i18n/index.ts';
import type { ModeProgress } from '../../persistence/saveSchema.ts';
import { rankInput } from '../progress.ts';

/** Pangkat karier sekarang + syarat pangkat berikutnya (ADR 027). */
export function RankLine({ progress, content }: { progress: ModeProgress; content: ModeContent }) {
  const input = rankInput(progress, content);
  const rank = careerRank(input);
  const goal = nextRankGoal(input);
  const ranks = content.meta.ranks;
  const next = goal ? (ranks[goal.rank] ?? '') : '';
  return (
    <p className="text-sm" data-testid="rank" data-rank={rank}>
      <span aria-hidden="true">🎖 </span>
      <strong className="font-display text-accent">{id.rank.current(ranks[rank] ?? '')}</strong>
      <span className="text-ink-muted">
        {' · '}
        {goal ? id.rank.nextShifts(goal.shiftsLeft, next) : id.rank.top}
      </span>
    </p>
  );
}
