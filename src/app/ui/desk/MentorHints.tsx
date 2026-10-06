import { t as id } from '../../../i18n/index.ts';
import { btnSecondary } from '../styles.ts';

interface MentorHintsProps {
  mentorName: string;
  hints: readonly string[];
  used: number;
  /** Petunjuk yang tidak mengurangi skor (bawaan 1; Mesin kopi: 2). */
  freeHints?: number;
  disabled: boolean;
  onAsk(): void;
}

/** Petunjuk bertingkat: pertama gratis, berikutnya −10 skor kasus (lihat engine/scoring). */
export function MentorHints({
  mentorName,
  hints,
  used,
  freeHints = 1,
  disabled,
  onAsk,
}: MentorHintsProps) {
  const freeLeft = freeHints - used;
  const shown = hints.slice(0, used);
  const more = used < hints.length;
  return (
    <section aria-label={id.mentor.heading(mentorName)} className="mb-3 flex flex-col gap-2">
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
          {!more
            ? id.mentor.noMore
            : freeLeft <= 0
              ? id.mentor.costs
              : freeHints === 1
                ? id.mentor.free
                : id.mentor.freeLeft(freeLeft)}
        </span>
      </div>
    </section>
  );
}
