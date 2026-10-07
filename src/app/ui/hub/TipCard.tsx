import { t as id } from '../../../i18n/index.ts';
import { dismissTip, nextTip, skipAllTips, type TipId } from '../../onboarding.ts';
import { useAppStore } from '../../store.ts';
import { btnPrimary, btnSecondary } from '../styles.ts';

const ICON: Record<TipId, string> = {
  welcome: '👋',
  rank: '🎖',
  daily: '📅',
  shop: '🛒',
  practice: '🎯',
};

/** Satu tips onboarding di kantor (ADR 030); muncul saat fiturnya baru relevan. */
export function TipCard() {
  const save = useAppStore((s) => s.save);
  const updateSave = useAppStore((s) => s.updateSave);
  const tip = save ? nextTip(save) : null;
  if (!tip) return null;
  const text = id.tips[tip];
  return (
    <section
      aria-label={id.tips.label}
      className="rank-in flex flex-col gap-2 border-4 border-focus bg-panel p-3 pixel-shadow"
      data-testid="tip-card"
      data-tip={tip}
    >
      <h2 className="font-display text-lg text-focus">
        <span aria-hidden="true">{ICON[tip]} </span>
        {text.title}
      </h2>
      <p>{text.body}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnPrimary}
          onClick={() => updateSave((s) => dismissTip(s, tip))}
        >
          {id.tips.gotIt}
        </button>
        <button type="button" className={btnSecondary} onClick={() => updateSave(skipAllTips)}>
          {id.tips.skipAll}
        </button>
      </div>
    </section>
  );
}
