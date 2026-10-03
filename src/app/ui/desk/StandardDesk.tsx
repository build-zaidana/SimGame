import { useCallback, useState } from 'react';
import { id } from '../../../i18n/id.ts';
import type { ReactNode } from 'react';
import type { BaseCase } from '../../../content/schemas.ts';
import type { DeskProps, DocumentProps } from '../../../modes/contract.ts';
import { ActionBar } from './ActionBar.tsx';
import { BriefingDialog } from './BriefingDialog.tsx';
import { FeedbackDialog } from './FeedbackDialog.tsx';
import { Hud } from './Hud.tsx';
import { QueuePane, type QueueItem } from './QueuePane.tsx';
import { MentorHints } from './MentorHints.tsx';
import { Rulebook } from '../Rulebook.tsx';
import { useShiftClock } from './useShiftClock.ts';

type Tab = 'queue' | 'document' | 'rulebook';
const TABS: Tab[] = ['queue', 'document', 'rulebook'];

/**
 * Meja kerja standar: Antrian · Dokumen · Panduan + bar aksi.
 * Desktop ≥ 1024 px: 3 kolom. Lebih kecil: tab + bar aksi lengket di bawah.
 */
interface StandardDeskProps extends DeskProps {
  /** Panel tambahan di bawah dokumen (mis. hasil alat). */
  renderExtra?(c: BaseCase, doc: Omit<DocumentProps, 'data'>): ReactNode;
}

export function StandardDesk({
  mode,
  content,
  session,
  wallet,
  mastery,
  toolsOwned,
  dispatch,
  renderExtra,
}: StandardDeskProps) {
  const [tab, setTab] = useState<Tab>(session.activeCaseId ? 'document' : 'queue');
  const running =
    !session.paused && (session.phase === 'working' || session.phase === 'inspecting');
  useShiftClock(dispatch, running);

  const caseTypeOf = useCallback(
    (type: string) => mode.caseTypes.find((t) => t.type === type),
    [mode.caseTypes],
  );
  const labelOf = (caseId: string): QueueItem => {
    const c = content.cases[caseId];
    const label = c ? caseTypeOf(c.type)?.queueLabel(c) : undefined;
    return { caseId, icon: label?.icon ?? '•', title: label?.title ?? caseId };
  };

  const active = session.cases.find((c) => c.caseId === session.activeCaseId);
  const activeCase = active ? content.cases[active.caseId] : undefined;
  const activeType = activeCase ? caseTypeOf(activeCase.type) : undefined;
  const marks = new Set(active?.marks ?? []);
  const tools = new Set(toolsOwned);
  const docProps: Omit<DocumentProps, 'data'> = {
    marks,
    tools,
    locked: session.phase !== 'inspecting',
    onToggleMark: (evidenceId) => dispatch({ type: 'TOGGLE_MARK', evidenceId }),
  };
  const decisions = mode.decisions.filter((d) => d.unlockedAtShift <= session.shiftOrder);
  const decisionLabel = (d: string) => mode.decisions.find((x) => x.id === d)?.label ?? d;

  const shift = content.shifts.find((s) => s.id === session.shiftId);
  const feedbackCase = session.cases.find((c) => c.caseId === session.feedbackCaseId);
  const feedbackData = feedbackCase ? content.cases[feedbackCase.caseId] : undefined;
  const rules = content.rulebook.chapters.flatMap((ch) => ch.rules);

  const paneClass = (t: Tab) =>
    `${tab === t ? 'block' : 'hidden'} h-full overflow-y-auto lg:block ` +
    (t === 'document' ? 'lg:border-x-2 lg:border-ink/40' : '');

  return (
    <div className="flex h-dvh flex-col">
      <Hud
        deskTitle={mode.deskTitle}
        session={session}
        wallet={wallet}
        onTogglePause={() => dispatch({ type: session.paused ? 'RESUME' : 'PAUSE' })}
      />
      <div role="tablist" aria-label={id.desk.tabsLabel} className="grid grid-cols-3 lg:hidden">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`pane-${t}`}
            onClick={() => setTab(t)}
            className={
              'min-h-11 border-b-4 font-display focus-visible:outline-4 focus-visible:outline-focus ' +
              (tab === t ? 'border-accent text-accent' : 'border-transparent text-ink-muted')
            }
          >
            {id.desk.tabs[t]}
            {t === 'document' && active && (
              <span className="sr-only">: {labelOf(active.caseId).title}</span>
            )}
          </button>
        ))}
      </div>
      <main className="min-h-0 flex-1 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
        <section
          id="pane-queue"
          role="tabpanel"
          aria-labelledby="tab-queue"
          className={paneClass('queue')}
        >
          <QueuePane
            session={session}
            labelOf={labelOf}
            onOpen={(caseId) => {
              dispatch({ type: 'OPEN_CASE', caseId });
              setTab('document');
            }}
          />
        </section>
        <section
          id="pane-document"
          role="tabpanel"
          aria-labelledby="tab-document"
          className={paneClass('document')}
        >
          <div className="mx-auto max-w-2xl p-3">
            {active && activeCase && activeType ? (
              <>
                <p className="mb-2 text-sm text-ink-muted">
                  {id.desk.markHint} ·{' '}
                  <span data-testid="marks-count">{id.desk.marksCount(marks.size)}</span>
                </p>
                <div data-testid="document" data-case-id={active.caseId}>
                  <activeType.Document data={activeCase} {...docProps} />
                  {renderExtra?.(activeCase, docProps)}
                </div>
                <div className="mt-3">
                  <MentorHints
                    hints={activeCase.hints}
                    used={active.hintsUsed}
                    disabled={session.phase !== 'inspecting'}
                    onAsk={() => dispatch({ type: 'USE_HINT' })}
                  />
                </div>
              </>
            ) : (
              <p className="p-4 text-ink-muted">{id.desk.noCaseOpen}</p>
            )}
          </div>
        </section>
        <section
          id="pane-rulebook"
          role="tabpanel"
          aria-labelledby="tab-rulebook"
          className={paneClass('rulebook')}
        >
          <div className="flex flex-col gap-3 p-3">
            <h2 className="font-display text-ink-muted">{id.desk.rulebookHeading}</h2>
            <Rulebook
              chapters={content.rulebook.chapters}
              concepts={content.concepts}
              mastery={mastery}
              openUpToShift={session.shiftOrder}
            />
          </div>
        </section>
      </main>
      <ActionBar
        decisions={decisions}
        disabled={session.phase !== 'inspecting' || !activeCase}
        onDecide={(decision) => {
          if (!active || !activeCase || !activeType) return;
          dispatch({
            type: 'DECIDE',
            outcome: activeType.evaluate(activeCase, { decision, marks: active.marks }),
          });
        }}
      />
      {session.phase === 'briefing' && (
        <BriefingDialog
          heading={id.briefing.shiftHeading(session.shiftOrder, shift?.title ?? '')}
          dialogue={shift ? content.dialogues[shift.introDialogue] : undefined}
          onStart={() => dispatch({ type: 'DISMISS_BRIEFING' })}
        />
      )}
      {session.phase === 'feedback' && feedbackCase && feedbackData && (
        <FeedbackDialog
          caseData={feedbackData}
          sessionCase={feedbackCase}
          rules={rules.filter((r) => feedbackData.ruleRefs.includes(r.id))}
          decisionLabel={decisionLabel}
          onContinue={() => dispatch({ type: 'CLOSE_FEEDBACK' })}
        />
      )}
    </div>
  );
}
