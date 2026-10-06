import { useRef, useState, type KeyboardEvent } from 'react';
import { t as id } from '../../../i18n/index.ts';
import { nextIndent, tokenizeLine, type TokenKind } from './pyHighlight.ts';

const TOKEN_CLASS: Record<TokenKind, string> = {
  kw: 'text-[#c678dd] font-bold',
  str: 'text-[#98c379]',
  num: 'text-[#d19a66]',
  com: 'text-[#7f8c98] italic',
  fn: 'text-[#61afef]',
  txt: '',
};
/** Tombol bantu di HP (keyboard ponsel sulit mengetik simbol & indentasi). */
const KEYS = ['⇥', ':', '(', ')', '[', ']', '"', '=', '_', '+'];
const INDENT = '    ';

interface CodeEditorProps {
  value: string;
  onChange(value: string): void;
  label: string;
  readOnly?: boolean;
  /** Baris yang ditandai error (1-based). */
  errorLine?: number | undefined;
  testId?: string;
  /** Baris perintah siap pakai (mis. perintah robot); disisipkan sebagai baris utuh. */
  commands?: readonly string[];
  commandsLabel?: string;
}

/**
 * Editor kode: textarea transparan di atas pewarnaan sintaks. Tab = 4 spasi, Enter mengikuti
 * indentasi. Esc lalu Tab untuk keluar dari editor dengan keyboard (agar fokus tidak terjebak).
 */
export function CodeEditor({
  value,
  onChange,
  label,
  readOnly,
  errorLine,
  testId,
  commands,
  commandsLabel,
}: CodeEditorProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const layer = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const [escaped, setEscaped] = useState(false);
  const lines = value.split('\n');

  const replace = (start: number, end: number, text: string, caret = start + text.length) => {
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      area.current?.setSelectionRange(caret, caret);
    });
  };

  const insert = (text: string) => {
    const el = area.current;
    if (!el || readOnly) return;
    replace(el.selectionStart, el.selectionEnd, text);
    el.focus();
  };

  /** Sisipkan satu baris perintah di baris kursor, mengikuti indentasinya, lalu pindah ke baris baru. */
  const insertLine = (cmd: string) => {
    const el = area.current;
    if (!el || readOnly) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const before = value.slice(lineStart, s);
    const indent = /^\s*/.exec(before)?.[0] ?? '';
    const onEmptyLine = before.trim() === '';
    const text = (onEmptyLine ? '' : '\n' + indent) + cmd + '\n' + nextIndent(indent + cmd);
    replace(s, el.selectionEnd, text);
    el.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === 'Escape') {
      setEscaped(true);
      return;
    }
    if (e.key === 'Tab' && !escaped) {
      e.preventDefault();
      const { selectionStart: s } = el;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      if (e.shiftKey) {
        const remove = /^ {1,4}/.exec(value.slice(lineStart))?.[0].length ?? 0;
        if (remove) replace(lineStart, lineStart + remove, '', Math.max(lineStart, s - remove));
      } else {
        replace(s, el.selectionEnd, INDENT);
      }
      return;
    }
    setEscaped(false);
    if (e.key === 'Enter') {
      e.preventDefault();
      const s = el.selectionStart;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      replace(s, el.selectionEnd, '\n' + nextIndent(value.slice(lineStart, s)));
    }
  };

  const syncScroll = () => {
    const el = area.current;
    if (!el) return;
    if (layer.current) {
      layer.current.scrollTop = el.scrollTop;
      layer.current.scrollLeft = el.scrollLeft;
    }
    if (gutter.current) gutter.current.scrollTop = el.scrollTop;
  };

  const font = 'font-mono text-sm leading-6';
  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex max-h-80 min-h-40 overflow-hidden border-2 border-ink/60 bg-[#1e2129] text-[#e6e1d6]">
        <div
          ref={gutter}
          aria-hidden="true"
          className={`${font} shrink-0 select-none overflow-hidden border-r border-white/10 px-2 py-2 text-right text-[#7f8c98]`}
        >
          {lines.map((_, i) => (
            <div key={i} className={errorLine === i + 1 ? 'bg-danger/40 text-white' : ''}>
              {i + 1}
            </div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <pre
            ref={layer}
            aria-hidden="true"
            className={`${font} pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-2`}
          >
            {lines.map((line, i) => (
              <div key={i} className={errorLine === i + 1 ? 'bg-danger/25' : ''}>
                {tokenizeLine(line).map((t, j) => (
                  <span key={j} className={TOKEN_CLASS[t.kind]}>
                    {t.text}
                  </span>
                ))}
                {line === '' && ' '}
              </div>
            ))}
          </pre>
          <textarea
            ref={area}
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
            aria-label={label}
            aria-describedby="code-editor-help"
            data-testid={testId}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            wrap="off"
            className={`${font} absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent p-2 text-transparent caret-[#f2c14e] outline-none selection:bg-[#3e4451] focus-visible:outline-4 focus-visible:outline-focus`}
            style={{ WebkitTextFillColor: 'transparent' }}
          />
        </div>
      </div>
      {!readOnly && commands && commands.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label={commandsLabel} role="group">
          {commands.map((c) => (
            <button
              key={c}
              type="button"
              className="min-h-11 border-2 border-accent bg-panel px-2 font-mono text-sm focus-visible:outline-4 focus-visible:outline-focus"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertLine(c)}
              data-command={c}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {!readOnly && (
        <div className="flex flex-wrap gap-1" aria-label={id.dev.editor.keysLabel} role="group">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className="min-h-11 min-w-11 border-2 border-ink/50 bg-panel font-mono text-sm focus-visible:outline-4 focus-visible:outline-focus"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(k === '⇥' ? INDENT : k)}
              aria-label={k === '⇥' ? id.dev.editor.indentKey : undefined}
            >
              {k}
            </button>
          ))}
        </div>
      )}
      <p id="code-editor-help" className="text-xs text-ink-muted">
        {id.dev.editor.help}
      </p>
    </div>
  );
}
