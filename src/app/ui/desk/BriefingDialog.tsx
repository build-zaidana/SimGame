import { useState } from 'react';
import { t as id } from '../../../i18n/index.ts';
import type { Dialogue, Newspaper as NewspaperData } from '../../../content/schemas.ts';
import type { NewsTier } from '../../../engine/news.ts';
import { Dialog } from '../Dialog.tsx';
import { btnPrimary } from '../styles.ts';
import { DialogueLine } from './DialogueLines.tsx';
import { Newspaper } from './Newspaper.tsx';

interface BriefingDialogProps {
  heading: string;
  dialogue: Dialogue | undefined;
  /** Koran pagi dibaca dulu sebelum briefing mentor (ADR 020). */
  newspaper?: { paper: NewspaperData; edition: number; tier: NewsTier | null } | undefined;
  onStart(): void;
}

/** Awal shift: koran pagi (bila ada), lalu briefing mentor satu baris per ketukan. */
export function BriefingDialog({ heading, dialogue, newspaper, onStart }: BriefingDialogProps) {
  const lines = dialogue?.lines ?? [];
  const [index, setIndex] = useState(newspaper ? -1 : 0);
  const last = index >= lines.length - 1;
  const line = index >= 0 ? lines[index] : undefined;
  return (
    <Dialog labelledBy="briefing-title">
      <h2 id="briefing-title" className="mb-3 font-display text-lg text-accent">
        {heading}
      </h2>
      <div className="min-h-24" aria-live="polite">
        {index < 0 && newspaper ? (
          <Newspaper {...newspaper} />
        ) : (
          line && <DialogueLine key={index} line={line} typewriter />
        )}
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
