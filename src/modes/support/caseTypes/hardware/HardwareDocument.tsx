import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import type { HardwareCase } from './schema.ts';

export function HardwareDocument({
  data,
  marks,
  onToggleMark,
  locked,
}: DocumentProps<HardwareCase>) {
  const { device, checks, note } = data.data;
  const t = id.support.hardware;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  return (
    <article aria-labelledby="doc-heading" className="border-2 border-ink/40 bg-bg p-3">
      <h2 id="doc-heading" className="font-display text-accent">
        <span aria-hidden="true">🔧 </span>
        {t.heading}
      </h2>
      <p className="mb-3 px-1 text-sm text-ink-muted">
        {t.device}: <strong className="text-ink">{device.name}</strong> · {device.owner}
      </p>
      <p className="px-1 text-sm text-ink-muted">{t.checks}</p>
      <ul className="mb-3 flex flex-col">
        {checks.map((c) => (
          <li key={c.part}>
            <Evidence {...mark(c.evidenceId)}>
              <span className="font-bold">{c.part}: </span>
              {c.observation}
            </Evidence>
          </li>
        ))}
      </ul>
      {note && (
        <>
          <p className="px-1 text-sm text-ink-muted">{t.note}</p>
          <Evidence {...mark(note.evidenceId)}>{note.text}</Evidence>
        </>
      )}
    </article>
  );
}
