import { useEffect, useState } from 'react';
import { t as id } from '../../i18n/index.ts';
import { modes, upcomingModes } from '../../modes/registry.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';
import { nextShift, practiceShifts } from '../progress.ts';
import { localDate, useAppStore } from '../store.ts';
import { previousDate } from '../../engine/daily.ts';
import { PhaserHub, type HotspotInfo, type HubSpeech } from '../../hub/PhaserHub.tsx';
import { OfficeIllustration } from '../ui/hub/OfficeIllustration.tsx';
import { Medal } from '../ui/Medal.tsx';
import { RankLine } from '../ui/RankLine.tsx';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

/** HUB versi menu (v1.0). Ilustrasi kantor pixel menyusul di M4. */
export function HubScreen() {
  const save = useAppStore((s) => s.save);
  const contents = useAppStore((s) => s.contents);
  const content = contents[modes[0]?.id ?? 'soc'] ?? null;
  const enterMode = useAppStore((s) => s.enterMode);
  const enterPractice = useAppStore((s) => s.enterPractice);
  const cancelPractice = useAppStore((s) => s.cancelPractice);
  const enterDaily = useAppStore((s) => s.enterDaily);
  const today = localDate();
  // Beruntun masih hidup bila tantangan terakhir hari ini atau kemarin.
  const streak =
    save?.daily?.lastDate === today || save?.daily?.lastDate === previousDate(today)
      ? save.daily.streak
      : 0;
  const preloadContent = useAppStore((s) => s.preloadContent);
  const openRulebook = useAppStore((s) => s.openRulebook);
  const openMenu = useAppStore((s) => s.openMenu);
  const openAssessment = useAppStore((s) => s.openAssessment);
  const newBadges = useAppStore((s) => s.newBadges);
  const dismissBadges = useAppStore((s) => s.dismissBadges);
  const [entering, setEntering] = useState(false);
  const explore = useAppStore((s) => s.save?.profile.settings.exploreOffice ?? false);

  const startDesk = (modeId: string) => {
    if (entering) return;
    setEntering(true);
    void enterMode(modeId).finally(() => setEntering(false));
  };
  const illustration = (
    <OfficeIllustration
      desks={[
        ...modes.map((m) => ({
          label: m.deskTitle,
          available: m.status === 'available',
          disabled: entering,
          onEnter: () => startDesk(m.id),
        })),
        ...upcomingModes.map((m) => ({ label: m.deskTitle, available: false })),
      ]}
    />
  );

  // Kantor yang bisa dijelajahi (PRD C1): arti setiap hotspot di peta.
  const allModes = [...modes, ...upcomingModes];
  const describeHotspot = (hotspotId: string): HotspotInfo => {
    const [kind, key] = hotspotId.split(':');
    if (kind === 'desk') {
      const m = allModes.find((x) => x.id === key);
      return m?.status === 'available'
        ? { label: m.deskTitle, action: id.explore.enter }
        : { label: m?.deskTitle ?? key ?? '' };
    }
    if (hotspotId === 'npc:rani') return { label: id.explore.raniLabel, action: id.explore.talk };
    if (hotspotId === 'npc:joko') return { label: id.explore.jokoLabel, action: id.explore.talk };
    if (hotspotId === 'npc:dimas') return { label: id.explore.dimasLabel, action: id.explore.talk };
    if (hotspotId === 'menu:shop') return { label: id.explore.shopLabel, action: id.explore.open };
    if (hotspotId === 'menu:rulebook')
      return { label: id.explore.rulebookLabel, action: id.explore.open };
    return { label: id.explore.badgesLabel, action: id.explore.open };
  };
  const interactHotspot = (hotspotId: string): HubSpeech | void => {
    const [kind, key] = hotspotId.split(':');
    if (kind === 'desk') {
      if (modes.some((m) => m.id === key && m.status === 'available')) startDesk(key ?? '');
      return;
    }
    if (hotspotId === 'menu:shop') return openMenu('shop');
    if (hotspotId === 'menu:rulebook') return openRulebook(null);
    if (hotspotId === 'menu:badges') return openMenu('badges');
    // Mentor (Mbak Rani: SOC, Pak Joko: Bengkel IT): satu aturan acak dari bab yang sudah terbuka.
    const mentor = modes.find((m) => `npc:${m.mentor}` === hotspotId);
    if (!mentor || !['rani', 'joko', 'dimas'].includes(mentor.mentor)) return;
    const unlocked = Math.max(1, save?.modes[mentor.id]?.unlockedShift ?? 1);
    const rules = (contents[mentor.id]?.rulebook.chapters ?? [])
      .filter((ch) => ch.unlockAtShift <= unlocked)
      .flatMap((ch) => ch.rules);
    const rule = rules[Math.floor(Math.random() * rules.length)];
    return rule
      ? { speaker: mentor.mentor as HubSpeech['speaker'], text: id.explore.raniTip(rule.text) }
      : undefined;
  };

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
      {newBadges.length > 0 && (
        <section
          role="status"
          className="flex flex-wrap items-center gap-3 border-4 border-accent bg-panel p-3 pixel-shadow"
          data-testid="new-badges"
        >
          <p className="font-display text-accent">{id.hub.newBadges}</p>
          <ul className="flex flex-1 flex-wrap gap-3">
            {newBadges.map((bid) => {
              const b = Object.values(contents)
                .flatMap((c) => c.badges)
                .find((x) => x.id === bid);
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
      {explore ? (
        <PhaserHub
          activeModes={modes.filter((m) => m.status === 'available').map((m) => m.id)}
          describe={describeHotspot}
          onInteract={interactHotspot}
          fallback={illustration}
        />
      ) : (
        illustration
      )}
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
          {id.hub.badges(
            modes.reduce((n, m) => n + Object.keys(save?.modes[m.id]?.badges ?? {}).length, 0),
            Object.values(contents).reduce((n, c) => n + c.badges.length, 0),
          )}
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
          const slotRun = progress.practiceSession;
          // Slot latihan dipakai bersama: tantangan harian ditandai `daily` (ADR 029).
          const dailyRun = slotRun?.daily ? slotRun : undefined;
          const practiceRun = slotRun?.daily ? undefined : slotRun;
          const dailyDone = save?.daily?.done[m.id] === today;
          const ownContent = contents[m.id] ?? null;
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
              {ownContent && <RankLine progress={progress} content={ownContent} />}
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
              {ownContent && (
                <section
                  aria-labelledby={`daily-${m.id}`}
                  className="mt-2 flex flex-col gap-2 border-t-2 border-ink/30 pt-2"
                  data-testid={`daily-${m.id}`}
                >
                  <h3 id={`daily-${m.id}`} className="font-display">
                    <span aria-hidden="true">📅 </span>
                    {id.daily.heading}
                    {streak > 0 && (
                      <span className="ml-2 text-sm text-accent" data-testid="daily-streak">
                        <span aria-hidden="true">🔥 </span>
                        {id.daily.streak(streak)}
                      </span>
                    )}
                  </h3>
                  {practiceList.length === 0 ? (
                    <p className="text-xs text-ink-muted">{id.daily.locked}</p>
                  ) : dailyRun ? (
                    <button
                      type="button"
                      className={btnSecondary}
                      disabled={entering}
                      onClick={() => run(() => enterDaily(m.id))}
                    >
                      {id.daily.resume}
                    </button>
                  ) : dailyDone ? (
                    <p className="text-sm text-safe">
                      <span aria-hidden="true">✓ </span>
                      {id.daily.doneToday}
                    </p>
                  ) : practiceRun ? (
                    <p className="text-xs text-ink-muted">{id.daily.busy}</p>
                  ) : (
                    <>
                      <p className="text-xs text-ink-muted">
                        {id.daily.intro(3)} {id.daily.rewardRule}
                      </p>
                      <button
                        type="button"
                        className={btnSecondary}
                        disabled={entering}
                        onClick={() => run(() => enterDaily(m.id))}
                      >
                        {id.daily.start(m.deskTitle)}
                      </button>
                    </>
                  )}
                </section>
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
                  {dailyRun ? (
                    <p className="text-xs text-ink-muted">{id.daily.busyPractice}</p>
                  ) : practiceRun ? (
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
