import { useEffect, useState } from 'react';
import { id } from '../../i18n/id.ts';
import { summarizeEvents, type LoggedEvent } from '../../telemetry/SessionReportTelemetry.ts';
import { useAppStore } from '../store.ts';
import { sessionReport } from '../telemetry.ts';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

const pct = (x: number) => Math.round(x * 100);

/** Layar tersembunyi untuk uji main (ARCHITECTURE §8). Dibuka dengan mengetuk logo 5×. */
export function LearningReportScreen() {
  const save = useAppStore((s) => s.save);
  const back = useAppStore((s) => s.back);
  const [events, setEvents] = useState<LoggedEvent[] | null>(null);

  useEffect(() => {
    void sessionReport?.events().then(setEvents);
  }, []);

  const summary = events ? summarizeEvents(events) : null;
  const exportJson = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      installId: save?.installId,
      assessments: save?.assessments ?? {},
      summary,
      events,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `shiftit-laporan-belajar-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={back}>
          <span aria-hidden="true">← </span>
          {id.transfer.back}
        </button>
        <h1 className="font-display text-xl text-accent">{id.learningReport.heading}</h1>
      </div>
      <p className="text-sm">{id.learningReport.intro}</p>
      {!sessionReport && <p>{id.learningReport.disabled}</p>}
      {summary && events && (
        <section className={`${panel} flex flex-col gap-1 p-3`} data-testid="learning-summary">
          <p>{id.learningReport.shiftsStarted(summary.shiftsStarted)}</p>
          <p>{id.learningReport.cases(summary.cases, pct(summary.caseAccuracy))}</p>
          <p>{id.learningReport.evidence(pct(summary.avgEvidenceScore))}</p>
          <p>{id.learningReport.decisionTime(summary.avgDecisionSeconds)}</p>
          <p>{id.learningReport.hints(summary.hintsUsed)}</p>
          <p>{id.learningReport.review(summary.reviewAnswered, pct(summary.reviewAccuracy))}</p>
          <p>{id.learningReport.lessons(summary.lessonsOpened)}</p>
          {summary.shiftsCompleted.length > 0 && (
            <>
              <h2 className="mt-2 font-display">{id.learningReport.shiftsCompleted}</h2>
              <ul className="list-disc pl-5 text-sm">
                {summary.shiftsCompleted.map((s, i) => (
                  <li key={i}>
                    {id.learningReport.shiftRow(s.shiftId, s.averageScore, s.stars, s.practice)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {save?.assessments && (
            <p className="mt-2 text-sm">
              {id.learningReport.tests}:{' '}
              {save.assessments.pre
                ? `${save.assessments.pre.correct}/${save.assessments.pre.total}`
                : '–'}
              {' / '}
              {save.assessments.post
                ? `${save.assessments.post.correct}/${save.assessments.post.total}`
                : '–'}
            </p>
          )}
          <p className="mt-2 text-xs text-ink-muted">{id.learningReport.events(events.length)}</p>
        </section>
      )}
      {sessionReport && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={exportJson} disabled={!events}>
            {id.learningReport.export}
          </button>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              if (window.confirm(id.learningReport.confirmClear)) {
                void sessionReport?.clear().then(() => setEvents([]));
              }
            }}
          >
            {id.learningReport.clear}
          </button>
        </div>
      )}
    </main>
  );
}
