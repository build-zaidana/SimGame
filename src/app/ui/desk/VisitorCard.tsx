import { hashString } from '../../../engine/rng.ts';
import { t as id } from '../../../i18n/index.ts';
import type { Visitor } from '../../../modes/contract.ts';
import { Avatar } from '../Avatar.tsx';
import type { Mood } from '../pixel/portraits.ts';

interface VisitorCardProps {
  visitor: Visitor;
  /** Reaksi setelah stempel: ekspresi wajah + kalimat balasan. */
  mood?: Mood | undefined;
}

/** "Orang di loket": siapa yang membawa kasus ini ke meja, dengan satu kalimat. */
export function VisitorCard({ visitor, mood }: VisitorCardProps) {
  const lines = mood
    ? id.desk.reactions[visitor.kind === 'system' ? 'system' : 'person'][mood]
    : undefined;
  const reaction = lines?.[hashString(visitor.name + visitor.line) % lines.length];
  const motion = mood === 'happy' ? 'hop' : mood === 'upset' ? 'flinch' : '';
  return (
    <figure className="mb-3 flex items-start gap-3" data-testid="visitor">
      <span key={mood ?? 'idle'} className={`shrink-0 ${motion}`}>
        <Avatar
          kind={visitor.kind}
          seed={visitor.name}
          mood={mood ?? 'neutral'}
          className="size-14 sm:size-16"
        />
      </span>
      <figcaption className="min-w-0 flex-1">
        <p className="font-display text-sm">
          <span className="sr-only">{id.desk.visitorLabel} </span>
          <span className="text-accent">{visitor.name}</span>
          <span className="text-ink-muted"> · {visitor.role}</span>
        </p>
        {reaction ? (
          <p
            key="reaction"
            className={
              'bubble-pop mt-1 inline-block border-2 px-3 py-2 text-sm ' +
              (mood === 'upset' ? 'border-danger bg-panel' : 'border-ink/60 bg-panel-2')
            }
            data-testid="visitor-reaction"
            data-mood={mood}
          >
            “{reaction}”
          </p>
        ) : (
          <p className="mt-1 inline-block border-2 border-ink/60 bg-panel px-3 py-2 text-sm">
            “{visitor.line}”
          </p>
        )}
      </figcaption>
    </figure>
  );
}
