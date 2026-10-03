import { Evidence } from '../../../app/ui/Evidence.tsx';
import type { BaseCase } from '../../../content/schemas.ts';
import { id } from '../../../i18n/id.ts';
import type { DocumentProps } from '../../contract.ts';
import { SOC_TOOLS } from '../tools.ts';

/** Hasil Cek WHOIS & Sandbox. Tanpa alat: hanya ajakan halus ke Toko Alat. */
export function SocIntelPanel({ c, doc }: { c: BaseCase; doc: Omit<DocumentProps, 'data'> }) {
  const { whois, sandbox } = c.intel ?? {};
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? doc.marks.has(evidenceId) : false,
    locked: doc.locked,
    onToggle: doc.onToggleMark,
  });
  const panels = [
    {
      key: 'whois',
      tool: SOC_TOOLS.whois,
      name: 'Cek WHOIS',
      heading: id.tools.whoisHeading,
      icon: '📅',
      rows: (whois ?? []).map((w) => ({
        text: id.tools.whoisRow(w.domain, w.registered),
        evidenceId: w.evidenceId,
      })),
    },
    {
      key: 'sandbox',
      tool: SOC_TOOLS.sandbox,
      name: 'Sandbox',
      heading: id.tools.sandboxHeading,
      icon: '🧪',
      rows: sandbox ?? [],
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
              <Evidence key={i} {...mark(r.evidenceId)}>
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
