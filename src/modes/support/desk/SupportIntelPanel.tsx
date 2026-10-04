import { Evidence } from '../../../app/ui/Evidence.tsx';
import type { BaseCase } from '../../../content/schemas.ts';
import { t as id } from '../../../i18n/index.ts';
import type { DocumentProps } from '../../contract.ts';
import { SUPPORT_TOOLS } from '../tools.ts';

/** Hasil Alat Ping & Pemindai. Tanpa alat: hanya ajakan halus ke Toko Alat. */
export function SupportIntelPanel({ c, doc }: { c: BaseCase; doc: Omit<DocumentProps, 'data'> }) {
  const { ping, scan } = c.intel ?? {};
  const t = id.support.tools;
  const panels = [
    {
      key: 'ping',
      tool: SUPPORT_TOOLS.ping,
      name: t.pingName,
      heading: t.pingHeading,
      icon: '📶',
      rows: ping ?? [],
    },
    {
      key: 'scan',
      tool: SUPPORT_TOOLS.scanner,
      name: t.scanName,
      heading: t.scanHeading,
      icon: '🩺',
      rows: scan ?? [],
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
