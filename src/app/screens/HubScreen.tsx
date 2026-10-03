import { useEffect, useState } from 'react';
import { id } from '../../i18n/id.ts';
import { modes, upcomingModes } from '../../modes/registry.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';
import { nextShift, practiceShifts } from '../progress.ts';
import { useAppStore } from '../store.ts';
import { OfficeIllustration } from '../ui/hub/OfficeIllustration.tsx';
import { Medal } from '../ui/Medal.tsx';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

/** HUB versi menu (v1.0). Ilustrasi kantor pixel menyusul di M4. */
export function HubScreen() {
  const save = useAppStore((s) => s.save);
  const content = useAppStore((s) => s.content);
  const enterMode = useAppStore((s) => s.enterMode);
  const enterPractice = useAppStore((s) => s.enterPractice);
  const cancelPractice = useAppStore((s) => s.cancelPractice);
  const preloadContent = useAppStore((s) => s.preloadContent);
  const openRulebook = useAppStore((s) => s.openRulebook);
  const openMenu = useAppStore((s) => s.openMenu);
  const openAssessment = useAppStore((s) => s.openAssessment);
  const newBadges = useAppStore((s) => s.newBadges);
  const dismissBadges = useAppStore((s) => s.dismissBadges);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    for (const m of modes) void preloadContent(m.id);
  }, [preloadContent]);

  // Tes awal: sebelum shift pertama selesai. Tes akhir: setelah shift terakhir selesai (PRD §5.3).
  const socProgress = save?.modes[modes[0]?.id ?? 'soc'] ?? newModeProgress();
  const pre = save?.assessments?.pre;
  const post = save?.assessments?.post;
  const lastShiftId = content?.shifts.at(-1)?.id;
  const hasAssessment = !!content?.assessment;
  const canPreTest = hasAssessment && !pre && Object.keys(socProgress.shifts).length === 0;
  const canPostTest = hasAssessment && !post && !!lastShiftId && lastShiftId in socProgress.shifts;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 p-4">
      <h1 className="font-display text-2xl text-accent">{id.hub.heading}</h1>
      <p className="text-ink-muted">{id.hub.intro}</p>
      {newBadges.length > 0 && content && (
        <section
          role="status"
          className="flex flex-wrap items-center gap-3 border-4 border-accent bg-panel p-3 pixel-shadow"
          data-testid="new-badges"
        >
          <p className="font-display text-accent">{id.hub.newBadges}</p>
          <ul className="flex flex-1 flex-wrap gap-3">
            {newBadges.map((bid) => {
              const b = content.badges.find((x) => x.id === bid);
              return b ? (
                <li key={bid} className="stamp flex items-center gap-2">
                  <Medal tier={b.tier} icon={b.icon} locked={false} className="w-9 text-lg" />
                  <span className="font-display text-sm">{b.title}</span>
                </li>
              ) : null;
            })}
          </ul>
          <button type="button" className={btnSecondary} onClick={() => openMenu('badges')}>
            {id.hub.viewBadges}
          </button>
          <button type="button" className={btnSecondary} onClick={dismissBadges}>
            {id.hub.dismissBadges}
          </button>
        </section>
      )}
      <OfficeIllustration
        desks={[
          ...modes.map((m) => ({
            label: m.deskTitle,
            available: m.status === 'available',
            disabled: entering,
            onEnter: () => {
              setEntering(true);
              void enterMode(m.id).finally(() => setEntering(false));
            },
          })),
          ...upcomingModes.map((m) => ({ label: m.deskTitle, available: false })),
        ]}
      />
      <nav className="flex flex-wrap gap-2" aria-label={id.hub.heading}>
        <button type="button" className={btnSecondary} onClick={() => openRulebook(null)}>
          <span aria-hidden="true">📖 </span>
          {id.hub.rulebook}
        </button>
        <button type="button" className={btnSecondary} onClick={() => openMenu('shop')}>
          <span aria-hidden="true">🛒 </span>
          {id.hub.shop}
        </button>
        <button type="button" className={btnSecondary} onClick={() => openMenu('badges')}>
          <span aria-hidden="true">🏅 </span>
          {id.hub.badges(Object.keys(socProgress.badges ?? {}).length, content?.badges.length ?? 0)}
        </button>
        <button type="button" className={btnSecondary} onClick={() => openMenu('settings')}>
          <span aria-hidden="true">⚙ </span>
          {id.hub.settings}
        </button>
        <button type="button" className={btnSecondary} onClick={() => openMenu('save-transfer')}>
          <span aria-hidden="true">💾 </span>
          {id.hub.transfer}
        </button>
        {canPreTest && (
          <button type="button" className={btnSecondary} onClick={() => openAssessment('pre')}>
            <span aria-hidden="true">📝 </span>
            {id.hub.preTest}
          </button>
        )}
        {canPostTest && (
          <button type="button" className={btnSecondary} onClick={() => openAssessment('post')}>
            <span aria-hidden="true">📝 </span>
            {id.hub.postTest}
          </button>
        )}
      </nav>
      {pre && post && (
        <p className="text-sm" data-testid="test-results">
          {id.hub.testResults(`${pre.correct}/${pre.total}`, `${post.correct}/${post.total}`)}
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {modes.map((m) => {
          const progress = save?.modes[m.id] ?? newModeProgress();
          const active = progress.activeSession;
          const practiceRun = progress.practiceSession;
          const ownContent = content && content.meta.id === m.id ? content : null;
          const shift = ownContent ? nextShift(ownContent, progress) : undefined;
          const practiceList = ownContent ? practiceShifts(ownContent, progress) : [];
          const done = Object.keys(progress.shifts).length;
          const allDone = !!ownContent && !active && !shift && done > 0;
          const run = (start: () => Promise<void>) => {
            setEntering(true);
            void start().finally(() => setEntering(false));
          };
          const label = active
            ? active.phase === 'ended'
              ? id.hub.viewReport(active.shiftOrder)
              : id.hub.continueShift(active.shiftOrder)
            : shift
              ? id.hub.enterShift(shift.order, shift.title)
              : id.hub.loadingDesk;
          return (
            <li key={m.id} className={`${panel} flex flex-col gap-2 p-4`}>
              <h2 className="font-display text-lg">{m.deskTitle}</h2>
              <p className="text-sm text-ink-muted">{m.title}</p>
              <p className="text-sm">
                {id.hub.progress(done)} · {id.hub.wallet(progress.wallet)} ·{' '}
                {id.hub.trust(progress.trust)}
              </p>
              {allDone ? (
                <p className="text-sm text-accent">{id.hub.allShiftsDone}</p>
              ) : (
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={entering || (!active && !shift)}
                  onClick={() => run(() => enterMode(m.id))}
                >
                  {label}
                </button>
              )}
              {(practiceRun || practiceList.length > 0) && (
                <section
                  aria-labelledby={`practice-${m.id}`}
                  className="mt-2 flex flex-col gap-2 border-t-2 border-ink/30 pt-2"
                >
                  <h3 id={`practice-${m.id}`} className="font-display">
                    <span aria-hidden="true">🎯 </span>
                    {id.hub.practiceHeading}
                  </h3>
                  <p className="text-xs text-ink-muted">{id.hub.practiceIntro}</p>
                  {practiceRun ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnSecondary}
                        disabled={entering}
                        onClick={() => run(() => enterPractice(m.id))}
                      >
                        {id.hub.continuePractice(practiceRun.shiftOrder)}
                      </button>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => cancelPractice(m.id)}
                      >
                        {id.hub.cancelPractice}
                      </button>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {practiceList.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className={`${btnSecondary} w-full justify-start text-left`}
                            disabled={entering}
                            onClick={() => run(() => enterPractice(m.id, s.id))}
                          >
                            {id.hub.practiceShift(s.order, s.title)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </li>
          );
        })}
        {upcomingModes.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 border-2 border-dashed border-ink/40 p-4">
            <h2 className="font-display text-lg">{m.deskTitle}</h2>
            <p className="text-sm text-ink-muted">{m.title}</p>
            <p className="font-display text-sm">
              <span aria-hidden="true">🔒 </span>
              {id.hub.comingSoon}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted">{id.hub.storageNote}</p>
    </main>
  );
}
