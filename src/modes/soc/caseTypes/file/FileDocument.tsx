import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import type { FileCase } from './schema.ts';

export function FileDocument({ data, marks, onToggleMark, locked }: DocumentProps<FileCase>) {
  const { fileName, fileType, size, source, message } = data.data;
  const t = id.soc.file;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  const rows = [
    [t.name, fileName, 'font-mono font-bold break-all'],
    [t.type, fileType, ''],
    [t.size, size, ''],
    [t.source, source, ''],
    [t.message, message, ''],
  ] as const;
  return (
    <article aria-labelledby="doc-heading" className="border-2 border-ink/40 bg-bg p-3">
      <h2 id="doc-heading" className="mb-3 font-display text-accent">
        <span aria-hidden="true">📄 </span>
        {t.heading}
      </h2>
      <dl className="flex flex-col gap-2">
        {rows.map(([label, part, cls]) => (
          <div key={label}>
            <dt className="px-1 text-sm text-ink-muted">{label}</dt>
            <dd>
              <Evidence {...mark(part.evidenceId)}>
                <span className={cls}>{part.text}</span>
              </Evidence>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
