import { carryTrust } from '../../engine/economy.ts';
import { summarizeShift } from '../../engine/shift.ts';
import { id } from '../../i18n/id.ts';
import { getMode } from '../../modes/registry.ts';
import { useAppStore } from '../store.ts';
import { DialogueLine } from '../ui/desk/DialogueLines.tsx';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

/** Pengingat ekspor muncul di laporan shift ini (ARCHITECTURE §7.3). */
const EXPORT_REMINDER_SHIFTS = [2, 4];
const EXPORT_REMINDER_OFF = 'exportReminderOff';

/** Laporan Shift: skor, kesalahan + penjelasan + tautan ke bab, lalu Review Cepat. */
export function ReportScreen() {
  const session = useAppStore((s) => s.session);
  const content = useAppStore((s) => s.content);
  const goTo = useAppStore((s) => s.goTo);
  const openRulebook = useAppStore((s) => s.openRulebook);
  const openMenu = useAppStore((s) => s.openMenu);
  const setFlag = useAppStore((s) => s.setFlag);
  const reminderOff = useAppStore((s) => s.save?.flags[EXPORT_REMINDER_OFF] === true);
  const practice = useAppStore((s) => s.practice);
  const mode = session ? getMode(session.modeId) : undefined;
  if (!session || !content || !mode) return null;

  const shift = content.shifts.find((s) => s.id === session.shiftId);
  const summary = summarizeShift(session, shift?.pay ?? { base: 0, perCase: 0 });
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
        {!practice && carryTrust(summary.trust) > summary.trust && (
          <p data-testid="trust-recovery">{id.report.trustRecovery(carryTrust(summary.trust))}</p>
        )}
        <p>{practice ? id.report.practicePay : id.report.pay(summary.pay, shift?.pay.base ?? 0)}</p>
      </section>
      {practice && (
        <p role="note" className="border-2 border-focus p-3" data-testid="practice-banner">
          <span aria-hidden="true">🎯 </span>
          {id.report.practiceBanner}
        </p>
      )}
      {!practice && EXPORT_REMINDER_SHIFTS.includes(session.shiftOrder) && !reminderOff && (
        <section
          role="note"
          className="flex flex-col gap-2 border-2 border-accent p-3"
          data-testid="export-reminder"
        >
          <p>
            <span aria-hidden="true">💾 </span>
            {id.exportReminder.text}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => openMenu('save-transfer')}>
              {id.exportReminder.now}
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setFlag(EXPORT_REMINDER_OFF, true)}
            >
              {id.exportReminder.never}
            </button>
          </div>
        </section>
      )}
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
              ...new Map(
                (data?.ruleRefs ?? [])
                  .map((r) => chapterOfRule(r))
                  .filter((ch) => ch !== undefined)
                  .map((ch) => [ch.id, ch]),
              ).values(),
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
                    <div className="mt-1 flex flex-wrap gap-2">
                      {chapters.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          className={`${btnSecondary} text-sm`}
                          onClick={() => openRulebook(ch.id)}
                        >
                          <span aria-hidden="true">📖 </span>
                          {id.report.readChapter(ch.title)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/40 bg-panel p-2">
        <div className="mx-auto max-w-3xl">
          <button type="button" className={`${btnPrimary} w-full`} onClick={() => goTo('review')}>
            {id.report.toReview}
          </button>
        </div>
      </div>
    </main>
  );
}
