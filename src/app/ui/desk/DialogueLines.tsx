import { t as id } from '../../../i18n/index.ts';
import type { Dialogue } from '../../../content/schemas.ts';
import { Avatar } from '../Avatar.tsx';

export function DialogueLine({ line }: { line: Dialogue['lines'][number] }) {
  const speaker = id.speakers[line.speaker];
  const portrait =
    line.speaker === 'rani' || line.speaker === 'kelabu' || line.speaker === 'joko'
      ? line.speaker
      : null;
  return (
    <div className="flex items-start gap-3">
      {portrait && <Avatar kind={portrait} className="size-14 sm:size-16" />}
      <p className={line.speaker === 'kelabu' ? 'italic text-danger' : ''}>
        {speaker && <strong className="font-display text-accent">{speaker}: </strong>}
        {line.text}
      </p>
    </div>
  );
}
