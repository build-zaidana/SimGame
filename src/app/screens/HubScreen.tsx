import { useEffect, useState } from 'react';
import { id } from '../../i18n/id.ts';
import { modes, upcomingModes } from '../../modes/registry.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';
import { nextShift } from '../progress.ts';
import { useAppStore } from '../store.ts';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

/** HUB versi menu (v1.0). Ilustrasi kantor pixel menyusul di M4. */
export function HubScreen() {
  const save = useAppStore((s) => s.save);
  const content = useAppStore((s) => s.content);
  const enterMode = useAppStore((s) => s.enterMode);
  const preloadContent = useAppStore((s) => s.preloadContent);
  const openRulebook = useAppStore((s) => s.openRulebook);
  const openMenu = useAppStore((s) => s.openMenu);
  const openAssessment = useAppStore((s) => s.openAssessment);
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
      <nav className="flex flex-wrap gap-2" aria-label={id.hub.heading}>
        <button type="button" className={btnSecondary} onClick={() => openRulebook(null)}>
          <span aria-hidden="true">📖 </span>
          {id.hub.rulebook}
        </button>
        <button type="button" className={btnSecondary} onClick={() => openMenu('shop')}>
          <span aria-hidden="true">🛒 </span>
          {id.hub.shop}
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
          const shift =
            content && content.meta.id === m.id ? nextShift(content, progress) : undefined;
          const done = Object.keys(progress.shifts).length;
          const replay = shift !== undefined && shift.order < progress.unlockedShift;
          const label = active
            ? active.phase === 'ended'
              ? id.hub.viewReport(active.shiftOrder)
              : id.hub.continueShift(active.shiftOrder)
            : shift
              ? replay
                ? id.hub.replayShift(shift.order, shift.title)
                : id.hub.enterShift(shift.order, shift.title)
              : id.hub.loadingDesk;
          return (
            <li key={m.id} className={`${panel} flex flex-col gap-2 p-4`}>
              <h2 className="font-display text-lg">{m.deskTitle}</h2>
              <p className="text-sm text-ink-muted">{m.title}</p>
              <p className="text-sm">
                {id.hub.progress(done)} · {id.hub.wallet(progress.wallet)} ·{' '}
                {id.hub.trust(progress.trust)}
              </p>
              {replay && !active && <p className="text-sm text-accent">{id.hub.moreShiftsSoon}</p>}
              <button
                type="button"
                className={btnPrimary}
                disabled={entering || (!active && !shift)}
                onClick={() => {
                  setEntering(true);
                  void enterMode(m.id).finally(() => setEntering(false));
                }}
              >
                {label}
              </button>
            </li>
          );
        })}
        {upcomingModes.map((m) => (
          <li key={m.id} className={`${panel} flex flex-col gap-2 p-4 opacity-70`}>
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
