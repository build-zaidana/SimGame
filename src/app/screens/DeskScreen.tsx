import { Suspense } from 'react';
import { id } from '../../i18n/id.ts';
import { getMode } from '../../modes/registry.ts';
import { useAppStore } from '../store.ts';

export function DeskScreen() {
  const session = useAppStore((s) => s.session);
  const content = useAppStore((s) => s.content);
  const save = useAppStore((s) => s.save);
  const dispatch = useAppStore((s) => s.dispatch);
  const mode = session ? getMode(session.modeId) : undefined;
  if (!session || !content || !mode) return null;
  const wallet = save?.modes[mode.id]?.wallet ?? 0;
  return (
    <Suspense fallback={<p className="p-4">{id.hub.loadingDesk}</p>}>
      <mode.Desk
        mode={mode}
        content={content}
        session={session}
        wallet={wallet}
        mastery={save?.mastery ?? {}}
        dispatch={dispatch}
      />
    </Suspense>
  );
}
