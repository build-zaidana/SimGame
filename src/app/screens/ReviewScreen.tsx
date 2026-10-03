import { useState } from 'react';
import { id } from '../../i18n/id.ts';
import { reviewItemsFor } from '../progress.ts';
import { useAppStore } from '../store.ts';
import { telemetry } from '../telemetry.ts';
import { QuestionRunner } from '../ui/review/QuestionRunner.tsx';
import { btnPrimary, panel } from '../ui/styles.ts';

/** Review Cepat akhir shift (3–5 soal). Jawaban disimpan ke Leitner saat selesai. */
export function ReviewScreen() {
  const session = useAppStore((s) => s.session);
  const content = useAppStore((s) => s.content);
  const save = useAppStore((s) => s.save);
  const finishShift = useAppStore((s) => s.finishShift);
  const practice = useAppStore((s) => s.practice);
  const [items] = useState(() =>
    session && content && save ? reviewItemsFor(content, session, save.mastery) : [],
  );
  if (!session) return null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <h1 className="font-display text-2xl text-accent">{id.review.heading}</h1>
      <QuestionRunner
        items={items}
        seed={session.seed}
        intro={id.review.intro}
        onAnswer={(r) => telemetry.track({ name: 'review_answered', ...r })}
        renderDone={(results) => {
          const correct = results.filter((r) => r.correct).length;
          return (
            <section className={`${panel} flex flex-col gap-2 p-4`}>
              {items.length === 0 ? (
                <p>{id.review.empty}</p>
              ) : (
                <>
                  <h2 className="font-display text-lg">{id.review.doneHeading}</h2>
                  <p data-testid="review-score">{id.review.score(correct, items.length)}</p>
                  {practice ? (
                    <p className="text-sm">{id.review.practiceNote}</p>
                  ) : (
                    correct < items.length && <p className="text-sm">{id.review.retryNote}</p>
                  )}
                </>
              )}
              <button
                type="button"
                className={`${btnPrimary} mt-2`}
                onClick={() => finishShift(results)}
              >
                {practice ? id.review.finishPractice : id.review.finish}
              </button>
            </section>
          );
        }}
      />
    </main>
  );
}
