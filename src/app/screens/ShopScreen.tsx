import { useState } from 'react';
import { t as id } from '../../i18n/index.ts';
import { rankPayBonus } from '../../engine/rank.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';
import { rankOf } from '../progress.ts';
import { RankLine } from '../ui/RankLine.tsx';
import { useAppStore } from '../store.ts';
import { useMenuMode } from '../useMenuMode.ts';
import { ModeTabs } from '../ui/ModeTabs.tsx';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

export function ShopScreen() {
  const save = useAppStore((s) => s.save);
  const buyTool = useAppStore((s) => s.buyTool);
  const buyUpgrade = useAppStore((s) => s.buyUpgrade);
  const back = useAppStore((s) => s.back);
  const [message, setMessage] = useState<string | null>(null);
  const { modeId, content, inSession } = useMenuMode();

  const progress = save?.modes[modeId] ?? newModeProgress();
  const rank = content ? rankOf(progress, content) : 0;
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={back}>
          <span aria-hidden="true">← </span>
          {id.transfer.back}
        </button>
        <h1 className="font-display text-2xl text-accent">{id.shop.heading}</h1>
      </div>
      <ModeTabs current={modeId} hidden={inSession} />
      <p className="text-ink-muted">{id.shop.intro}</p>
      <p className="font-display" data-testid="wallet">
        {id.shop.wallet(progress.wallet)}
      </p>
      {content && (
        <div>
          <RankLine progress={progress} content={content} />
          {rank > 0 && (
            <p className="text-xs text-ink-muted">{id.rank.allowance(rankPayBonus(rank))}</p>
          )}
        </div>
      )}
      {message && (
        <p role="status" className="text-safe">
          {message}
        </p>
      )}
      <h2 className="font-display text-xl">{id.shop.toolsHeading}</h2>
      <ul className="flex flex-col gap-3">
        {content?.tools.map((t) => {
          const owned = progress.toolsOwned.includes(t.id);
          const locked = t.unlockAtShift > progress.unlockedShift;
          const affordable = progress.wallet >= t.price;
          const concept = content.concepts.find((c) => c.id === t.conceptId);
          return (
            <li key={t.id} className={`${panel} flex flex-col gap-2 p-3`} data-tool={t.id}>
              <h3 className="font-display text-lg">
                <span aria-hidden="true">{t.icon} </span>
                {t.name}
              </h3>
              <p className="text-sm">{t.description}</p>
              {concept && (
                <p className="text-xs text-ink-muted">{id.shop.concept(concept.title)}</p>
              )}
              {owned ? (
                <p className="font-display text-safe">
                  <span aria-hidden="true">✓ </span>
                  {id.shop.owned}
                </p>
              ) : locked ? (
                <p className="text-sm text-ink-muted">
                  <span aria-hidden="true">🔒 </span>
                  {id.shop.lockedUntil(t.unlockAtShift)}
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={!affordable}
                    onClick={() => {
                      if (buyTool(modeId, t.id)?.ok) setMessage(id.shop.bought(t.name));
                    }}
                  >
                    {id.shop.buy(t.name, t.price)}
                  </button>
                  {!affordable && <p className="text-xs text-ink-muted">{id.shop.notEnough}</p>}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {content && content.upgrades.length > 0 && (
        <>
          <h2 className="font-display text-xl">{id.shop.upgradesHeading}</h2>
          <p className="text-sm text-ink-muted">{id.shop.upgradesIntro}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {content.upgrades.map((u) => {
              const owned = progress.upgradesOwned.includes(u.id);
              const locked = rank < u.requiresRank;
              const affordable = progress.wallet >= u.price;
              return (
                <li key={u.id} className={`${panel} flex flex-col gap-2 p-3`} data-upgrade={u.id}>
                  <h3 className="font-display text-lg">
                    <span aria-hidden="true">{u.icon} </span>
                    {u.name}
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    {u.effect.kind === 'cosmetic' ? id.shop.cosmetic : id.shop.perk}
                  </p>
                  <p className="text-sm">{u.description}</p>
                  {owned ? (
                    <p className="font-display text-safe">
                      <span aria-hidden="true">✓ </span>
                      {id.shop.owned}
                    </p>
                  ) : locked ? (
                    <p className="text-sm text-ink-muted">
                      <span aria-hidden="true">🔒 </span>
                      {id.shop.rankLocked(content.meta.ranks[u.requiresRank] ?? '')}
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={btnPrimary}
                        disabled={!affordable}
                        aria-describedby={affordable ? undefined : `upgrade-${u.id}-funds`}
                        onClick={() => {
                          if (buyUpgrade(modeId, u.id)?.ok) setMessage(id.shop.installed(u.name));
                        }}
                      >
                        {id.shop.buy(u.name, u.price)}
                      </button>
                      {!affordable && (
                        <p id={`upgrade-${u.id}-funds`} className="text-xs text-ink-muted">
                          {id.shop.notEnough}
                        </p>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
