import { t as id } from '../../../i18n/index.ts';
import type { Dialogue } from '../../../content/schemas.ts';
import { Avatar } from '../Avatar.tsx';
import { useTypewriter } from '../useTypewriter.ts';

type Line = Dialogue['lines'][number];

/** Nada suara "bicara" tiap tokoh. */
const VOICE: Partial<Record<Line['speaker'], number>> = { rani: 1.25, joko: 0.8, kelabu: 0.55 };

/** Teks mengetik; pembaca layar langsung menerima teks utuh. Ketuk teks untuk melewati. */
function TypedText({ text, pitch }: { text: string; pitch: number }) {
  const { shown, done, skip } = useTypewriter(text, pitch);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" onClick={done ? undefined : skip}>
        {text.slice(0, shown)}
        <span className="invisible">{text.slice(shown)}</span>
      </span>
    </>
  );
}

export function DialogueLine({ line, typewriter = false }: { line: Line; typewriter?: boolean }) {
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
        {typewriter ? (
          <TypedText key={line.text} text={line.text} pitch={VOICE[line.speaker] ?? 1} />
        ) : (
          line.text
        )}
      </p>
    </div>
  );
}
