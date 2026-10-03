import { id } from '../../../i18n/id.ts';
import type { Chapter } from '../../../content/schemas.ts';

interface RulebookPaneProps {
  chapters: Chapter[];
  shiftOrder: number;
}

/** Buku Panduan: bab yang sudah terbuka di shift ini. Kartu konsep & mastery menyusul (M2). */
export function RulebookPane({ chapters, shiftOrder }: RulebookPaneProps) {
  const open = chapters.filter((c) => c.unlockAtShift <= shiftOrder);
  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className="font-display text-ink-muted">{id.desk.rulebookHeading}</h2>
      {open.length === 0 && <p>{id.desk.rulebookEmpty}</p>}
      {open.map((ch) => (
        <section key={ch.id} aria-labelledby={`ch-${ch.id}`}>
          <h3 id={`ch-${ch.id}`} className="font-display text-accent">
            {ch.title}
          </h3>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm">
            {ch.rules.map((r) => (
              <li key={r.id}>{r.text}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
