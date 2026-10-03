import { useEffect, useState } from 'react';
import { id } from '../../i18n/id.ts';
import { modes } from '../../modes/registry.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';
import { useAppStore } from '../store.ts';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

export function ShopScreen() {
  const content = useAppStore((s) => s.content);
  const save = useAppStore((s) => s.save);
  const buyTool = useAppStore((s) => s.buyTool);
  const back = useAppStore((s) => s.back);
  const preloadContent = useAppStore((s) => s.preloadContent);
  const [message, setMessage] = useState<string | null>(null);
  const modeId = modes[0]?.id ?? 'soc';

  useEffect(() => {
    if (!content) void preloadContent(modeId);
  }, [content, modeId, preloadContent]);

  const progress = save?.modes[modeId] ?? newModeProgress();
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={back}>
          <span aria-hidden="true">← </span>
          {id.transfer.back}
        </button>
        <h1 className="font-display text-2xl text-accent">{id.shop.heading}</h1>
      </div>
      <p className="text-ink-muted">{id.shop.intro}</p>
      <p className="font-display" data-testid="wallet">
        {id.shop.wallet(progress.wallet)}
      </p>
      {message && (
        <p role="status" className="text-safe">
          {message}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {content?.tools.map((t) => {
          const owned = progress.toolsOwned.includes(t.id);
          const locked = t.unlockAtShift > progress.unlockedShift;
          const affordable = progress.wallet >= t.price;
          const concept = content.concepts.find((c) => c.id === t.conceptId);
          return (
            <li key={t.id} className={`${panel} flex flex-col gap-2 p-3`} data-tool={t.id}>
              <h2 className="font-display text-lg">
                <span aria-hidden="true">{t.icon} </span>
                {t.name}
              </h2>
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
    </main>
  );
}
