import { useState } from 'react';
import { t as id } from '../../i18n/index.ts';
import { useAppStore } from '../store.ts';
import { QuestionRunner } from '../ui/review/QuestionRunner.tsx';
import { btnPrimary, panel } from '../ui/styles.ts';

/** Tes awal/akhir (PRD §5.3). Tidak memengaruhi skor atau Leitner. */
export function AssessmentScreen() {
  const content = useAppStore((s) => s.content);
  const kind = useAppStore((s) => s.assessmentKind);
  const saveAssessment = useAppStore((s) => s.saveAssessment);
  const back = useAppStore((s) => s.back);
  const [seed] = useState(() => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1);
  if (!content?.assessment) return null;
  const ids = content.assessment[kind];
  const items = ids.flatMap((rid) => content.review.filter((r) => r.id === rid));

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <h1 className="font-display text-2xl text-accent">
        {kind === 'pre' ? id.assessment.preHeading : id.assessment.postHeading}
      </h1>
      <QuestionRunner
        items={items}
        seed={seed}
        intro={id.assessment.intro}
        renderDone={(results) => {
          const correct = results.filter((r) => r.correct).length;
          return (
            <section className={`${panel} flex flex-col gap-2 p-4`}>
              <p data-testid="assessment-score">{id.assessment.done(correct, items.length)}</p>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  saveAssessment(kind, correct, items.length);
                  back();
                }}
              >
                {id.assessment.finish}
              </button>
            </section>
          );
        }}
      />
    </main>
  );
}
