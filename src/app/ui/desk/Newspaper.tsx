import type { Newspaper as NewspaperData } from '../../../content/schemas.ts';
import type { NewsTier } from '../../../engine/news.ts';
import { id } from '../../../i18n/id.ts';

const TIER_ICON: Record<NewsTier, string> = { good: '▲', mixed: '■', bad: '▼' };

interface NewspaperProps {
  paper: NewspaperData;
  edition: number;
  /** Nada berita dampak shift kemarin; null = tidak ditampilkan (shift pertama / latihan). */
  tier: NewsTier | null;
}

/** Koran pagi ala Papers, Please: berita hari ini, dampak kerja kemarin, tips, iklan baris. */
export function Newspaper({ paper, edition, tier }: NewspaperProps) {
  const impact = tier && paper.impact ? paper.impact[tier] : null;
  return (
    <article
      className="paper paper-sheet paper-in p-3 sm:p-4"
      aria-labelledby="news-headline"
      data-testid="newspaper"
    >
      <header className="border-b-4 border-double border-ink pb-1 text-center">
        <p className="font-display text-2xl tracking-[0.2em] sm:text-3xl">{id.news.masthead}</p>
        <p className="flex justify-between text-xs text-ink-muted">
          <span>{id.news.edition(edition)}</span>
          <span>{id.news.price}</span>
        </p>
      </header>
      <h3 id="news-headline" className="mt-2 font-display text-xl leading-tight sm:text-2xl">
        {paper.headline}
      </h3>
      <p className="mt-1 text-sm">{paper.lead}</p>
      <div
        className={
          'mt-3 grid gap-3 border-t-2 border-ink/50 pt-2 ' + (impact ? 'sm:grid-cols-2' : '')
        }
      >
        {impact && tier && (
          <section data-testid="news-impact" data-tier={tier}>
            <h4 className="font-display text-sm">
              <span aria-hidden="true">{TIER_ICON[tier]} </span>
              {id.news.impactHeading} · {id.news.tier[tier]}
            </h4>
            <p className="text-sm">{impact}</p>
          </section>
        )}
        <section className="border-2 border-ink/60 p-2">
          <h4 className="font-display text-sm">
            <span aria-hidden="true">💡 </span>
            {paper.tip.title}
          </h4>
          <p className="text-sm">{paper.tip.text}</p>
        </section>
      </div>
      {paper.classified && (
        <p className="mt-3 border-t border-dashed border-ink/60 pt-2 text-xs italic">
          <span className="font-display not-italic">{id.news.classified} </span>
          {paper.classified}
        </p>
      )}
    </article>
  );
}
