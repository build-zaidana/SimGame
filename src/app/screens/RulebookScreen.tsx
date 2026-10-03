import { useEffect } from 'react';
import { id } from '../../i18n/id.ts';
import { modes } from '../../modes/registry.ts';
import { newModeProgress } from '../../persistence/saveSchema.ts';
import { useAppStore } from '../store.ts';
import { telemetry } from '../telemetry.ts';
import { Rulebook } from '../ui/Rulebook.tsx';
import { btnSecondary } from '../ui/styles.ts';

export function RulebookScreen() {
  const content = useAppStore((s) => s.content);
  const save = useAppStore((s) => s.save);
  const session = useAppStore((s) => s.session);
  const { focusChapterId } = useAppStore((s) => s.rulebook);
  const closeRulebook = useAppStore((s) => s.closeRulebook);
  const preloadContent = useAppStore((s) => s.preloadContent);
  const modeId = session?.modeId ?? modes[0]?.id ?? 'soc';

  useEffect(() => {
    if (!content) void preloadContent(modeId);
  }, [content, modeId, preloadContent]);

  const progress = save?.modes[modeId] ?? newModeProgress();
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={closeRulebook}>
          <span aria-hidden="true">← </span>
          {id.rulebook.back}
        </button>
        <h1 className="font-display text-2xl text-accent">{id.rulebook.heading}</h1>
      </div>
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
