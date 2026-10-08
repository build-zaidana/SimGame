import { Evidence } from '../../../app/ui/Evidence.tsx';
import type { BaseCase } from '../../../content/schemas.ts';
import { t as id } from '../../../i18n/index.ts';
import type { DocumentProps } from '../../contract.ts';
import { DATA_TOOLS } from '../tools.ts';

/** Hasil Profiler Data & Cek Sumber. Tanpa alat: hanya ajakan halus ke Toko Alat. */
export function DataIntelPanel({ c, doc }: { c: BaseCase; doc: Omit<DocumentProps, 'data'> }) {
  const { profile, source } = c.intel ?? {};
  const t = id.data.tools;
  const panels = [
    {
      key: 'profile',
      tool: DATA_TOOLS.profiler,
      name: t.profileName,
      heading: t.profileHeading,
      icon: '🔬',
      rows: profile ?? [],
    },
    {
      key: 'source',
      tool: DATA_TOOLS.sourceCheck,
      name: t.sourceName,
      heading: t.sourceHeading,
      icon: '🔎',
      rows: source ?? [],
    },
  ].filter((p) => p.rows.length > 0);
  if (panels.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {panels.map((p) =>
        doc.tools.has(p.tool) ? (
          <section
            key={p.key}
            className="border-2 border-focus/60 bg-bg p-2"
            data-testid={`intel-${p.key}`}
          >
            <h3 className="text-sm font-bold">
              <span aria-hidden="true">{p.icon} </span>
              {p.heading}
            </h3>
            {p.rows.map((r, i) => (
              <Evidence
                key={i}
                evidenceId={r.evidenceId}
                marked={r.evidenceId ? doc.marks.has(r.evidenceId) : false}
                locked={doc.locked}
                onToggle={doc.onToggleMark}
              >
                {r.text}
              </Evidence>
            ))}
          </section>
        ) : (
          <p key={p.key} className="text-xs text-ink-muted">
            {id.tools.lockedHint(p.name)}
          </p>
        ),
      )}
    </div>
  );
}
