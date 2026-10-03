import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import { hostOf, ownerOf } from '../../intel.ts';
import { SOC_TOOLS } from '../../tools.ts';
import type { UrlRequestCase } from './schema.ts';

export function UrlRequestDocument({
  data,
  marks,
  onToggleMark,
  locked,
  tools,
}: DocumentProps<UrlRequestCase>) {
  const { requester, url, reason } = data.data;
  const fullUrl = url.parts.map((p) => p.text).join('');
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  return (
    <article aria-labelledby="doc-heading" className="border-2 border-ink/40 bg-bg p-3">
      <h2 id="doc-heading" className="mb-3 font-display text-accent">
        <span aria-hidden="true">🔗 </span>
        {id.soc.urlRequest.heading}
      </h2>
      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-sm text-ink-muted">{id.soc.urlRequest.requester}</dt>
          <dd className="px-1">
            {requester.name} ({requester.department})
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">{id.soc.urlRequest.url}</dt>
          <dd className="font-mono text-lg">
            {url.parts.map((p, i) => (
              <Evidence key={i} inline {...mark(p.evidenceId)}>
                {p.text}
              </Evidence>
            ))}
            {tools.has(SOC_TOOLS.linkChecker) && (
              <span className="block px-1 font-body text-sm" data-testid="link-owner">
                <span aria-hidden="true">🔍 </span>
                {id.tools.owner} <strong>{ownerOf(hostOf(fullUrl))}</strong>
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">{id.soc.urlRequest.reason}</dt>
          <dd>
            <Evidence {...mark(reason.evidenceId)}>{reason.text}</Evidence>
          </dd>
        </div>
      </dl>
    </article>
  );
}
