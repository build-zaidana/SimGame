import { useState } from 'react';
import { id } from '../../../i18n/id.ts';
import type { Dialogue } from '../../../content/schemas.ts';
import { Dialog } from '../Dialog.tsx';
import { btnPrimary } from '../styles.ts';
import { DialogueLine } from './DialogueLines.tsx';

interface BriefingDialogProps {
  heading: string;
  dialogue: Dialogue | undefined;
  onStart(): void;
}

/** Briefing mentor di awal shift; satu baris per ketukan. */
export function BriefingDialog({ heading, dialogue, onStart }: BriefingDialogProps) {
  const lines = dialogue?.lines ?? [];
  const [index, setIndex] = useState(0);
  const last = index >= lines.length - 1;
  const line = lines[index];
  return (
    <Dialog labelledBy="briefing-title">
      <h2 id="briefing-title" className="mb-3 font-display text-lg text-accent">
        {heading}
      </h2>
      <div className="min-h-24" aria-live="polite">
        {line && <DialogueLine line={line} />}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className={btnPrimary}

          onClick={() => (last ? onStart() : setIndex(index + 1))}
        >
          {last ? id.briefing.start : id.briefing.next}
        </button>
      </div>
    </Dialog>
  );
}
