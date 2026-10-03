import { id } from '../../../i18n/id.ts';
import type { Visitor } from '../../../modes/contract.ts';
import { Avatar } from '../Avatar.tsx';

/** "Orang di loket": siapa yang membawa kasus ini ke meja, dengan satu kalimat. */
export function VisitorCard({ visitor }: { visitor: Visitor }) {
  return (
    <figure className="mb-3 flex items-start gap-3" data-testid="visitor">
      <Avatar kind={visitor.kind} seed={visitor.name} className="size-14 sm:size-16" />
      <figcaption className="min-w-0 flex-1">
        <p className="font-display text-sm">
          <span className="sr-only">{id.desk.visitorLabel} </span>
          <span className="text-accent">{visitor.name}</span>
          <span className="text-ink-muted"> · {visitor.role}</span>
        </p>
        <p className="mt-1 inline-block border-2 border-ink/60 bg-panel px-3 py-2 text-sm">
          “{visitor.line}”
        </p>
      </figcaption>
    </figure>
  );
}
