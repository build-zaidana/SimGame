import { useCallback, useEffect, useState } from 'react';
import { btnSecondary } from '../styles.ts';
import { t as id } from '../../../i18n/index.ts';
import { rulebookTitle } from '../../../modes/registry.ts';
import type { ReactNode } from 'react';
import type { BaseCase } from '../../../content/schemas.ts';
import type { DeskProps, DocumentProps } from '../../../modes/contract.ts';
import { ActionBar } from './ActionBar.tsx';
import { BriefingDialog } from './BriefingDialog.tsx';
import { FeedbackDialog } from './FeedbackDialog.tsx';
import { Hud } from './Hud.tsx';
import { QueuePane, type QueueItem } from './QueuePane.tsx';
import { BossBar } from './BossBar.tsx';
import { MentorHints } from './MentorHints.tsx';
import { Rulebook } from '../Rulebook.tsx';
import { useShiftClock } from './useShiftClock.ts';
import { VisitorCard } from './VisitorCard.tsx';
import { prefersReducedMotion } from '../motion.ts';
import { currentStreak } from '../../../engine/badges.ts';

/** Lama stempel "menghantam" kertas + reaksi pengunjung sebelum slip umpan balik muncul. */
const STAMP_MS = 1000;
const STAMP_COLOR: Record<string, string> = {
  allow: 'text-safe',
  block: 'text-danger',
  escalate: 'text-accent',
  guide: 'text-safe',
  replace: 'text-danger',
  approve: 'text-safe',
  rollback: 'text-danger',
};

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
  upgrades = [],
  practice,
  newsTier,
  dispatch,
  renderExtra,
}: StandardDeskProps) {
  const [tab, setTab] = useState<Tab>(session.activeCaseId ? 'document' : 'queue');
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);
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
    answer: active?.answer,
    onAnswer: (text) => dispatch({ type: 'SET_ANSWER', text }),
    onRun: (passed, total) => dispatch({ type: 'RECORD_RUN', passed, total }),
    clock: {
      nowMs: session.elapsedMs,
      openedAtMs: active?.openedAtMs ?? null,
      shiftOrder: session.shiftOrder,
      relaxed: session.playMode === 'relaxed',
    },
    onRollback: () => dispatch({ type: 'ROLLBACK_INCIDENT' }),
  };
  const decisions = mode.decisions.filter(
    (d) =>
      d.unlockedAtShift <= session.shiftOrder &&
      (!activeType?.decisions || activeType.decisions.includes(d.id)),
  );
  const answerReady =
    !activeType?.ready || (activeCase ? activeType.ready(activeCase, active?.answer) : false);
  const decisionLabel = (d: string) => mode.decisions.find((x) => x.id === d)?.label ?? d;

  // Stempel dulu, baru slip umpan balik (langsung bila animasi dikurangi).
  const [slipFor, setSlipFor] = useState<string | null>(null);
  const feedbackId = session.phase === 'feedback' ? session.feedbackCaseId : null;
  const instantSlip = prefersReducedMotion();
  useEffect(() => {
    if (!feedbackId || instantSlip) return;
    const t = window.setTimeout(() => setSlipFor(feedbackId), STAMP_MS);
    return () => window.clearTimeout(t);
  }, [feedbackId, instantSlip]);
  const slipReady = feedbackId !== null && (instantSlip || slipFor === feedbackId);
  const visitor = activeCase ? activeType?.visitor?.(activeCase) : undefined;
  const stamped = active?.outcome?.decision;
  const visitorMood = active?.outcome
    ? active.outcome.correct
      ? 'happy'
      : active.outcome.decisionScore > 0
        ? 'neutral'
        : 'upset'
    : undefined;

  const shift = content.shifts.find((s) => s.id === session.shiftId);
  const feedbackCase = session.cases.find((c) => c.caseId === session.feedbackCaseId);
  const feedbackData = feedbackCase ? content.cases[feedbackCase.caseId] : undefined;
  const rules = content.rulebook.chapters.flatMap((ch) => ch.rules);

  // HP: satu panel per tab. Tablet (md): Dokumen + Panduan berdampingan, Antrian jadi laci.
  // Desktop (lg): tiga kolom.
  const paneClass = (t: Tab) => {
    const mobile = `${tab === t ? 'block' : 'hidden'} h-full overflow-y-auto`;
    if (t === 'queue') {
      return (
        `${mobile} ` +
        (drawerOpen
          ? 'md:fixed md:inset-y-0 md:left-0 md:z-30 md:block md:w-72 md:border-r-2 md:border-ink/40 md:bg-panel md:pixel-shadow '
          : 'md:hidden ') +
        'lg:static lg:z-auto lg:block lg:w-auto lg:border-r-0 lg:bg-transparent lg:shadow-none'
      );
    }
    if (t === 'document') return `${mobile} desk-surface md:block lg:border-x-2 lg:border-ink/40`;
    return `${mobile} md:block md:border-l-2 md:border-ink/40 lg:border-l-0`;
  };
  const waitingCount = session.cases.filter((c) => c.status === 'arrived').length;
  const bossMeta = content.shifts.find((s) => s.id === session.shiftId)?.boss;

  return (
    <div className="flex h-dvh flex-col">
      <Hud
        deskTitle={mode.deskTitle}
        streak={currentStreak(session.cases)}
        practice={practice}
        session={session}
        wallet={wallet}
        onTogglePause={() => dispatch({ type: session.paused ? 'RESUME' : 'PAUSE' })}
      />
      {bossMeta && <BossBar session={session} meta={bossMeta} practice={practice} />}
      <div className="hidden items-center gap-2 border-b-2 border-ink/40 p-2 md:flex lg:hidden">
        <button
          type="button"
          className={btnSecondary}
          aria-expanded={drawerOpen}
          aria-controls="pane-queue"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <span aria-hidden="true">☰ </span>
          {id.desk.queueToggle(waitingCount)}
        </button>
      </div>
      {drawerOpen && (
        <button
          type="button"
          aria-label={id.desk.closeQueue}
          className="fixed inset-0 z-20 hidden bg-bg/60 md:block lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div role="tablist" aria-label={id.desk.tabsLabel} className="grid grid-cols-3 md:hidden">
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
      <main className="min-h-0 flex-1 md:grid md:grid-cols-[minmax(0,1fr)_18rem] lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
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
              setDrawerOpen(false);
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
                {!activeType.ready && (
                  <p className="mb-2 text-sm text-ink-muted">
                    {id.desk.markHint} ·{' '}
                    <span data-testid="marks-count">{id.desk.marksCount(marks.size)}</span>
                  </p>
                )}
                {visitor && <VisitorCard visitor={visitor} mood={visitorMood} />}
                <div
                  key={active.caseId}
                  data-testid="document"
                  data-case-id={active.caseId}
                  className={
                    'paper paper-sheet paper-in relative ' + (stamped ? 'paper-shake' : '')
                  }
                >
                  <activeType.Document data={activeCase} {...docProps} />
                  {renderExtra?.(activeCase, docProps)}
                  {stamped && (
                    <span
                      aria-hidden="true"
                      data-testid="stamp"
                      className={
                        'stamp-slam whitespace-nowrap border-4 border-current px-3 py-1 font-stamp text-3xl sm:text-4xl ' +
                        (STAMP_COLOR[stamped] ?? 'text-focus')
                      }
                    >
                      {id.stamps[stamped] ?? stamped.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <MentorHints
                    mentorName={id.speakers[mode.mentor] ?? mode.mentor}
                    hints={activeCase.hints}
                    used={active.hintsUsed}
                    freeHints={session.perks?.freeHints ?? 1}
                    disabled={session.phase !== 'inspecting'}
                    onAsk={() => dispatch({ type: 'USE_HINT' })}
                  />
                </div>
              </>
            ) : (
              <p className="p-4 text-ink-muted">{id.desk.noCaseOpen}</p>
            )}
            {upgrades.length > 0 && (
              <ul
                aria-label={id.rank.deskLabel}
                className="mt-4 flex flex-wrap justify-end gap-2 text-2xl"
                data-testid="desk-items"
              >
                {upgrades.map((u) => (
                  <li key={u.id} title={u.name} className="hop">
                    <span aria-hidden="true">{u.icon}</span>
                    <span className="sr-only">{u.name}</span>
                  </li>
                ))}
              </ul>
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
            <h2 className="font-display text-ink-muted">{rulebookTitle(mode.id)}</h2>
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
        disabled={session.phase !== 'inspecting' || !activeCase || !answerReady}
        onDecide={(decision) => {
          if (!active || !activeCase || !activeType) return;
          setTab('document');
          dispatch({
            type: 'DECIDE',
            outcome: activeType.evaluate(activeCase, {
              decision,
              marks: active.marks,
              answer: active.answer,
              timing: {
                openedAtMs: active.openedAtMs ?? session.elapsedMs,
                nowMs: session.elapsedMs,
                relaxed: session.playMode === 'relaxed',
              },
            }),
          });
        }}
      />
      {session.phase === 'briefing' && (
        <BriefingDialog
          heading={
            session.daily
              ? id.daily.reportHeading(session.daily.date)
              : id.briefing.shiftHeading(session.shiftOrder, shift?.title ?? '')
          }
          dialogue={shift ? content.dialogues[shift.introDialogue] : undefined}
          newspaper={
            shift?.newspaper
              ? { paper: shift.newspaper, edition: shift.order, tier: newsTier ?? null }
              : undefined
          }
          onStart={() => dispatch({ type: 'DISMISS_BRIEFING' })}
        />
      )}
      {session.phase === 'feedback' && feedbackCase && feedbackData && slipReady && (
        <FeedbackDialog
          caseData={feedbackData}
          sessionCase={feedbackCase}
          rules={rules.filter((r) => feedbackData.ruleRefs.includes(r.id))}
          decisionLabel={decisionLabel}
          deskTitle={mode.deskTitle}
          citations={mode.citations}
          onContinue={() => dispatch({ type: 'CLOSE_FEEDBACK' })}
        />
      )}
    </div>
  );
}
