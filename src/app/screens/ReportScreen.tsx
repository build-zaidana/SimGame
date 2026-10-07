import { carryTrust } from '../../engine/economy.ts';
import { summarizeShift } from '../../engine/shift.ts';
import { t as id } from '../../i18n/index.ts';
import { getMode } from '../../modes/registry.ts';
import { useAppStore } from '../store.ts';
import { DialogueLine } from '../ui/desk/DialogueLines.tsx';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';
import { useEffect } from 'react';
import { playSfx } from '../sfx.ts';
import { useCountUp } from '../ui/useCountUp.ts';
import { prefersReducedMotion } from '../ui/motion.ts';
import { commitDaily, commitShift, rankOf } from '../progress.ts';
import { rankPayBonus } from '../../engine/rank.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';

/** Jeda antar-bintang di laporan (ms). */
const STAR_STEP = 350;

/** Bintang muncul satu per satu (dengan nada naik), lalu gaji "menghitung naik" + bunyi koin. */
function ShiftTally({
  stars,
  pay,
  showStars = true,
}: {
  stars: number;
  pay: number | null;
  showStars?: boolean;
}) {
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  const payDelay = stars * STAR_STEP + 150;
  const shown = useCountUp(pay ?? 0, 800, payDelay);
  useEffect(() => {
    if (!sound || prefersReducedMotion()) return;
    for (let i = 0; i < stars; i++) playSfx('star', (i * STAR_STEP) / 1000, 1 + i * 0.12);
    if (pay) playSfx('coin', (payDelay + 800) / 1000);
  }, [sound, stars, pay, payDelay]);
  return (
    <div className="flex flex-wrap items-baseline gap-4" aria-hidden="true">
      <p className={showStars ? 'font-display text-3xl' : 'hidden'} data-testid="star-row">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={i < stars ? 'star-pop text-accent' : 'text-ink-muted'}
            style={i < stars ? { animationDelay: `${i * STAR_STEP}ms` } : undefined}
          >
            {i < stars ? '★' : '☆'}
          </span>
        ))}
      </p>
      {pay !== null && (
        <p className="font-display text-xl text-accent">
          <span>◉ </span>+Rp {shown}
        </p>
      )}
    </div>
  );
}

/** Perayaan naik pangkat (ADR 027), muncul setelah hitungan gaji selesai. */
function RankUp({ title, rank, delayMs }: { title: string; rank: number; delayMs: number }) {
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  useEffect(() => {
    if (sound && !prefersReducedMotion()) playSfx('combo', delayMs / 1000);
  }, [sound, delayMs]);
  return (
    <section
      role="status"
      className="rank-in flex flex-col gap-1 border-4 border-accent bg-accent/10 p-3"
      style={{ animationDelay: `${delayMs}ms` }}
      data-testid="rank-up"
    >
      <p className="font-display text-xl text-accent">
        <span aria-hidden="true">⬆ </span>
        {id.rank.promoted(title)}
      </p>
      <p className="text-sm">{id.rank.promotedDetail(rankPayBonus(rank))}</p>
    </section>
  );
}

/** Laporan tantangan harian (ADR 029): hadiah + beruntun, lalu langsung kembali tanpa Review Cepat. */
function DailyReport() {
  const session = useAppStore((s) => s.session);
  const content = useAppStore((s) => s.content);
  const save = useAppStore((s) => s.save);
  const finishShift = useAppStore((s) => s.finishShift);
  if (!session?.daily || !content || !save) return null;
  const { save: after, reward } = commitDaily(save, session, session.daily.date);
  const streak = after.daily?.streak ?? 0;
  const already = save.daily?.done[session.modeId] === session.daily.date;
  const correct = session.cases.filter((c) => c.outcome?.correct).length;
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 p-4 pb-24">
      <h1 className="font-display text-2xl text-accent">
        <span aria-hidden="true">📅 </span>
        {id.daily.reportHeading(session.daily.date)}
      </h1>
      <section className={`${panel} grid gap-1 p-4`} data-testid="daily-result">
        <ShiftTally stars={0} pay={already ? null : reward} showStars={false} />
        <p>{id.report.correct(correct, session.cases.length)}</p>
        <p className="font-display text-accent" data-testid="daily-reward">
          <span aria-hidden="true">🔥 </span>
          {already ? id.daily.reportAgain : id.daily.reportReward(reward, streak)}
        </p>
        <p className="text-sm text-ink-muted">{id.daily.rewardRule}</p>
      </section>
      <ol className="flex flex-col gap-2">
        {session.cases.map((c) => (
          <li key={c.caseId} className={`${panel} p-3`}>
            <span aria-hidden="true">{c.outcome?.correct ? '✓ ' : '✗ '}</span>
            {content.cases[c.caseId]?.explanation}
          </li>
        ))}
      </ol>
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/40 bg-panel p-2">
        <div className="mx-auto max-w-3xl">
          <button type="button" className={`${btnPrimary} w-full`} onClick={() => finishShift([])}>
            {id.daily.claim}
          </button>
        </div>
      </div>
    </main>
  );
}

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
  const save = useAppStore((s) => s.save);
  const mode = session ? getMode(session.modeId) : undefined;
  if (!session || !content || !mode) return null;

  const shift = content.shifts.find((s) => s.id === session.shiftId);
  if (session.daily && save) return <DailyReport />;
  const summary = summarizeShift(session, shift?.pay ?? { base: 0, perCase: 0 });
  const outro = shift ? content.dialogues[shift.outroDialogue] : undefined;
  // Pangkat sesudah shift ini disimpan (disimpan sungguhan setelah Review Cepat).
  const rankBefore = save ? rankOf(save.modes[session.modeId] ?? newModeProgress(), content) : 0;
  const rankAfter =
    save && !practice
      ? rankOf(
          commitShift(save, session, content, session.shiftId).modes[session.modeId] ??
            newModeProgress(),
          content,
        )
      : rankBefore;
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
        <ShiftTally stars={summary.stars} pay={practice ? null : summary.pay} />
        <p data-testid="stars">{id.report.stars(summary.stars)}</p>
        <p>{id.report.average(summary.averageScore)}</p>
        <p>{id.report.correct(summary.correctCount, summary.totalCount)}</p>
        <p>{id.report.trust(summary.trust)}</p>
        {!practice && carryTrust(summary.trust) > summary.trust && (
          <p data-testid="trust-recovery">{id.report.trustRecovery(carryTrust(summary.trust))}</p>
        )}
        <p>
          {practice
            ? id.report.practicePay
            : id.report.pay(
                summary.pay,
                shift?.pay.base ?? 0,
                session.perks?.payBonus ?? 0,
                summary.bossBonus,
              )}
        </p>
      </section>
      {shift?.boss && session.boss && (
        <p
          className={`${panel} p-3 font-display`}
          data-testid="boss-result"
          data-status={summary.bossBonus > 0 ? 'defeated' : 'escaped'}
        >
          <span aria-hidden="true">👾 {shift.boss.icon} </span>
          {summary.bossBonus > 0
            ? id.boss.reportDefeated(shift.boss.title, summary.bossBonus)
            : id.boss.reportEscaped(shift.boss.title)}
        </p>
      )}
      {rankAfter > rankBefore && (
        <RankUp
          title={content.meta.ranks[rankAfter] ?? ''}
          rank={rankAfter}
          delayMs={summary.stars * STAR_STEP + 1100}
        />
      )}
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
