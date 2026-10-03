import { summarizeShift } from '../../engine/shift.ts';
import { id } from '../../i18n/id.ts';
import { getMode } from '../../modes/registry.ts';
import { useAppStore } from '../store.ts';
import { DialogueLine } from '../ui/desk/DialogueLines.tsx';
import { btnPrimary, panel } from '../ui/styles.ts';

/** Laporan Shift. Review Cepat menyusul di M2. */
export function ReportScreen() {
  const session = useAppStore((s) => s.session);
  const content = useAppStore((s) => s.content);
  const finishShift = useAppStore((s) => s.finishShift);
  const mode = session ? getMode(session.modeId) : undefined;
  if (!session || !content || !mode) return null;

  const shift = content.shifts.find((s) => s.id === session.shiftId);
  const summary = summarizeShift(session, shift?.pay ?? { base: 0, perCorrect: 0 });
  const outro = shift ? content.dialogues[shift.outroDialogue] : undefined;
  const chapterOfRule = (ruleId: string) =>
    content.rulebook.chapters.find((ch) => ch.rules.some((r) => r.id === ruleId));

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 p-4 pb-24">
      <h1 className="font-display text-2xl text-accent">
        {id.report.heading(session.shiftOrder, shift?.title ?? '')}
      </h1>
      <section
        className={`${panel} grid gap-1 p-4`}
        aria-label={id.report.average(summary.averageScore)}
      >
        <p className="font-display text-2xl text-accent" aria-hidden="true">
          {'★'.repeat(summary.stars)}
          {'☆'.repeat(3 - summary.stars)}
        </p>
        <p data-testid="stars">{id.report.stars(summary.stars)}</p>
        <p>{id.report.average(summary.averageScore)}</p>
        <p>{id.report.correct(summary.correctCount, summary.totalCount)}</p>
        <p>{id.report.trust(summary.trust)}</p>
        <p>{id.report.pay(summary.pay)}</p>
      </section>
      {outro && (
        <section className={`${panel} flex flex-col gap-2 p-4`}>
          {outro.lines.map((line, i) => (
            <DialogueLine key={i} line={line} />
          ))}
        </section>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg">{id.report.casesHeading}</h2>
        <ol className="flex flex-col gap-2">
          {session.cases.map((c) => {
            const data = content.cases[c.caseId];
            const type = data ? mode.caseTypes.find((t) => t.type === data.type) : undefined;
            const label = data && type ? type.queueLabel(data) : { icon: '•', title: c.caseId };
            const ok = c.outcome?.correct === true;
            const perfect = ok && (c.score ?? 0) >= 100;
            const chapters = [
              ...new Set(
                (data?.ruleRefs ?? []).map((r) => chapterOfRule(r)?.title).filter(Boolean),
              ),
            ];
            return (
              <li key={c.caseId} className={`${panel} p-3`}>
                <p className="flex gap-2">
                  <span aria-hidden="true" className={ok ? 'text-safe' : 'text-danger'}>
                    {ok ? '✓' : '✗'}
                  </span>
                  <span className="flex-1">
                    <span aria-hidden="true">{label.icon} </span>
                    {label.title}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {c.status === 'missed' ? id.report.missed : id.report.caseScore(c.score ?? 0)}
                  </span>
                </p>
                {!perfect && data && (
                  <div className="mt-2 text-sm">
                    <p>{data.explanation}</p>
                    {chapters.map((t) => (
                      <p key={t} className="text-accent">
                        {id.report.readChapter(t ?? '')}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/40 bg-panel p-2">
        <div className="mx-auto max-w-3xl">
          <button type="button" className={`${btnPrimary} w-full`} onClick={finishShift}>
            {id.report.finish}
          </button>
        </div>
      </div>
    </main>
  );
}
