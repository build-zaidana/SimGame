import { useEffect, useRef } from 'react';
import type { Chapter, Concept } from '../../content/schemas.ts';
import { masteryOf, type MasteryMap } from '../../engine/mastery.ts';
import { t as id } from '../../i18n/index.ts';

interface RulebookProps {
  chapters: Chapter[];
  concepts: Concept[];
  mastery: MasteryMap;
  /** Bab dengan unlockAtShift ≤ nilai ini yang terbuka. */
  openUpToShift: number;
  /** Bab yang dibuka & di-scroll saat tampil (dari tautan "Baca lagi"). */
  focusChapterId?: string | null;
  onOpenConcept?(conceptId: string): void;
  headingLevel?: 2 | 3;
}

export function MasteryBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        role="progressbar"
        aria-label={id.rulebook.masteryLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-3 flex-1 border border-ink/60 bg-bg"
      >
        <div className="h-full bg-safe" style={{ width: `${pct}%` }} />
      </div>
      <span>{id.rulebook.mastery(pct)}</span>
    </div>
  );
}

/** Buku Panduan: bab = satu konsep (aturan praktis + kartu materi + bar penguasaan). */
export function Rulebook({
  chapters,
  concepts,
  mastery,
  openUpToShift,
  focusChapterId,
  onOpenConcept,
  headingLevel = 3,
}: RulebookProps) {
  const focusRef = useRef<HTMLElement>(null);
  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: 'start' });
    focusRef.current?.focus();
  }, [focusChapterId]);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const open = chapters.filter((c) => c.unlockAtShift <= openUpToShift);
  if (open.length === 0) return <p>{id.desk.rulebookEmpty}</p>;

  return (
    <div className="flex flex-col gap-4">
      {open.map((ch) => {
        const concept = concepts.find((c) => c.id === ch.conceptId);
        const focused = ch.id === focusChapterId;
        return (
          <section
            key={ch.id}
            ref={focused ? focusRef : undefined}
            tabIndex={focused ? -1 : undefined}
            aria-labelledby={`ch-${ch.id}`}
            data-chapter={ch.id}
            className="flex flex-col gap-2 border-l-4 border-accent/60 pl-3 focus-visible:outline-4 focus-visible:outline-focus"
          >
            <H id={`ch-${ch.id}`} className="font-display text-accent">
              {ch.title}
            </H>
            <MasteryBar value={masteryOf(mastery, ch.conceptId)} />
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
              {ch.rules.map((r) => (
                <li key={r.id}>{r.text}</li>
              ))}
            </ul>
            {concept && (
              <details
                open={focused}
                onToggle={(e) => {
                  if ((e.currentTarget as HTMLDetailsElement).open) onOpenConcept?.(concept.id);
                }}
              >
                <summary className="flex min-h-11 cursor-pointer items-center font-display text-sm focus-visible:outline-4 focus-visible:outline-focus">
                  {id.rulebook.readConcept}: {concept.title}
                </summary>
                <div
                  className="concept-card mt-2 border-2 border-ink/30 bg-bg p-3 text-sm"
                  // Konten tepercaya dari repo, sudah divalidasi content:check.
                  dangerouslySetInnerHTML={{ __html: concept.html }}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  {id.rulebook.sources}: {concept.sources.join(' · ')}
                </p>
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}
