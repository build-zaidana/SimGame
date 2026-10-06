import { Suspense } from 'react';
import { t as id } from '../../i18n/index.ts';
import { newsTier } from '../../engine/news.ts';
import { getMode } from '../../modes/registry.ts';
import { useAppStore } from '../store.ts';

export function DeskScreen() {
  const session = useAppStore((s) => s.session);
  const content = useAppStore((s) => s.content);
  const save = useAppStore((s) => s.save);
  const dispatch = useAppStore((s) => s.dispatch);
  const practice = useAppStore((s) => s.practice);
  const mode = session ? getMode(session.modeId) : undefined;
  if (!session || !content || !mode) return null;
  const progress = save?.modes[mode.id];
  const wallet = progress?.wallet ?? 0;
  const prevShift = content.shifts.find((s) => s.order === session.shiftOrder - 1);
  const tier =
    practice || !progress || !prevShift
      ? null
      : newsTier(progress.shifts[prevShift.id], progress.trust);
  return (
    <Suspense fallback={<p className="p-4">{id.hub.loadingDesk}</p>}>
      <mode.Desk
        mode={mode}
        content={content}
        session={session}
        wallet={wallet}
        mastery={save?.mastery ?? {}}
        toolsOwned={save?.modes[mode.id]?.toolsOwned ?? []}
        upgrades={content.upgrades.filter((u) => progress?.upgradesOwned.includes(u.id))}
        practice={practice}
        newsTier={tier}
        dispatch={dispatch}
      />
    </Suspense>
  );
}
