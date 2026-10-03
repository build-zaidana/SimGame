import { t as id } from '../../../i18n/index.ts';
import { btnSecondary } from '../styles.ts';

interface MentorHintsProps {
  hints: readonly string[];
  used: number;
  disabled: boolean;
  onAsk(): void;
}

/** Petunjuk bertingkat: pertama gratis, berikutnya −10 skor kasus (lihat engine/scoring). */
export function MentorHints({ hints, used, disabled, onAsk }: MentorHintsProps) {
  const shown = hints.slice(0, used);
  const more = used < hints.length;
  return (
    <section aria-label={id.mentor.heading} className="mb-3 flex flex-col gap-2">
      {shown.length > 0 && (
        <ol
          className="flex flex-col gap-1 border-2 border-accent/60 bg-accent/10 p-2 text-sm"
          aria-live="polite"
        >
          {shown.map((h, i) => (
            <li key={i}>
              <strong className="font-display text-accent">
                {id.mentor.level(i + 1, hints.length)}:{' '}
              </strong>
              {h}
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={btnSecondary}
          disabled={disabled || !more}
          onClick={onAsk}
          data-testid="ask-mentor"
        >
          <span aria-hidden="true">💬 </span>
          {used === 0 ? id.mentor.ask : id.mentor.askAgain}
        </button>
        <span className="text-xs text-ink-muted">
          {!more ? id.mentor.noMore : used === 0 ? id.mentor.free : id.mentor.costs}
        </span>
      </div>
    </section>
  );
}
