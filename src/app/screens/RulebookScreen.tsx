import { t as id } from '../../i18n/index.ts';
import { rulebookTitle } from '../../modes/registry.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';
import { useAppStore } from '../store.ts';
import { useMenuMode } from '../useMenuMode.ts';
import { ModeTabs } from '../ui/ModeTabs.tsx';
import { telemetry } from '../telemetry.ts';
import { Rulebook } from '../ui/Rulebook.tsx';
import { btnSecondary } from '../ui/styles.ts';

export function RulebookScreen() {
  const save = useAppStore((s) => s.save);
  const session = useAppStore((s) => s.session);
  const focusChapterId = useAppStore((s) => s.rulebookFocus);
  const closeRulebook = useAppStore((s) => s.back);
  const { modeId, content, inSession } = useMenuMode();

  const progress = save?.modes[modeId] ?? newModeProgress();
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={closeRulebook}>
          <span aria-hidden="true">← </span>
          {id.rulebook.back}
        </button>
        <h1 className="font-display text-2xl text-accent">{rulebookTitle(modeId)}</h1>
      </div>
      <ModeTabs current={modeId} hidden={inSession} />
      {content && (
        <Rulebook
          chapters={content.rulebook.chapters}
          concepts={content.concepts}
          mastery={save?.mastery ?? {}}
          openUpToShift={Math.max(progress.unlockedShift, session?.shiftOrder ?? 0)}
          focusChapterId={focusChapterId}
          onOpenConcept={(conceptId) => telemetry.track({ name: 'lesson_opened', conceptId })}
          headingLevel={2}
        />
      )}
    </main>
  );
}
