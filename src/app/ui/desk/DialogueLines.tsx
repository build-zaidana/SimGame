import { id } from '../../../i18n/id.ts';
import type { Dialogue } from '../../../content/schemas.ts';

export function DialogueLine({ line }: { line: Dialogue['lines'][number] }) {
  const speaker = id.speakers[line.speaker];
  return (
    <p className={line.speaker === 'kelabu' ? 'italic text-danger' : ''}>
      {speaker && <strong className="font-display text-accent">{speaker}: </strong>}
      {line.text}
    </p>
  );
}
