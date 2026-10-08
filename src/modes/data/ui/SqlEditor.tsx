import { useRef } from 'react';
import { MAX_ANSWER_LENGTH } from '../../../engine/shift.ts';
import { t as id } from '../../../i18n/index.ts';

/** Kata kunci siap ketuk: keyboard ponsel lambat untuk SQL. `()` menaruh kursor di dalam kurung. */
const KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'ORDER BY',
  'DESC',
  'GROUP BY',
  'HAVING',
  'COUNT(*)',
  'SUM()',
  'AVG()',
  'LIMIT',
];
const SYMBOLS = ['*', ',', '=', '<', '>', "''", ';'];

interface SqlEditorProps {
  value: string;
  onChange(value: string): void;
  readOnly: boolean;
}

/** Editor query: textarea monospace + tombol kata kunci SQL (Meja Data, ADR 031). */
export function SqlEditor({ value, onChange, readOnly }: SqlEditorProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const t = id.data.editor;

  const insert = (token: string) => {
    const el = area.current;
    if (!el || readOnly) return;
    const s = el.selectionStart;
    const before = value.slice(0, s);
    const word = /^[A-Z]/.test(token);
    // Kata kunci diberi spasi di kiri-kanan; simbol disisipkan apa adanya.
    const lead = word && before !== '' && !/\s$/.test(before) ? ' ' : '';
    const text = lead + token + (word && !token.endsWith('()') ? ' ' : '');
    const next = (before + text + value.slice(el.selectionEnd)).slice(0, MAX_ANSWER_LENGTH);
    // Fungsi "SUM()" / tanda kutip "''": kursor di tengah, siap diisi.
    const inside = token.endsWith('()') || token === "''" ? 1 : 0;
    const caret = s + text.length - inside;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const key =
    'min-h-11 border-2 bg-panel px-2 font-mono text-sm focus-visible:outline-4 focus-visible:outline-focus';
  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={area}
        value={value}
        readOnly={readOnly}
        maxLength={MAX_ANSWER_LENGTH}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
        aria-label={t.label}
        aria-describedby="sql-editor-help"
        data-testid="sql-editor"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        rows={5}
        className="min-h-32 w-full resize-y border-2 border-ink/60 bg-[#1e2129] p-2 font-mono text-sm leading-6 text-[#e6e1d6] caret-[#f2c14e] outline-none focus-visible:outline-4 focus-visible:outline-focus"
      />
      {!readOnly && (
        <div className="flex flex-wrap gap-1" aria-label={t.keysLabel} role="group">
          {KEYWORDS.map((k) => (
            <button
              key={k}
              type="button"
              className={`${key} border-accent`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(k)}
              data-sql-key={k}
            >
              {k}
            </button>
          ))}
          {SYMBOLS.map((k) => (
            <button
              key={k}
              type="button"
              className={`${key} min-w-11 border-ink/50`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(k)}
              data-sql-key={k}
            >
              {k}
            </button>
          ))}
        </div>
      )}
      <p id="sql-editor-help" className="text-xs text-ink-muted">
        {t.help}
      </p>
    </div>
  );
}
