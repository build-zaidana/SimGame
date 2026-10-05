/** Pewarnaan sintaks Python sederhana untuk editor (tanpa dependensi). Murni: mudah diuji. */
export type TokenKind = 'kw' | 'str' | 'num' | 'com' | 'fn' | 'txt';
export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set(
  'and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield'.split(
    ' ',
  ),
);
const BUILTINS = new Set(
  'print len range int str float list dict set tuple sum min max abs sorted reversed enumerate zip input round type isinstance ord chr any all map filter open'.split(
    ' ',
  ),
);

const TOKEN =
  /(#.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+|.)/gm;

export function tokenizeLine(line: string): Token[] {
  const out: Token[] = [];
  for (const m of line.matchAll(TOKEN)) {
    const [text, com, str, num, word] = m;
    const kind: TokenKind = com
      ? 'com'
      : str
        ? 'str'
        : num
          ? 'num'
          : word && KEYWORDS.has(word)
            ? 'kw'
            : word && BUILTINS.has(word)
              ? 'fn'
              : 'txt';
    const prev = out.at(-1);
    if (prev && prev.kind === kind && kind === 'txt') prev.text += text;
    else out.push({ kind, text });
  }
  return out;
}

/** Indentasi baris baru setelah Enter: sama dengan baris ini, +4 spasi setelah ":". */
export function nextIndent(line: string): string {
  const base = /^\s*/.exec(line)?.[0] ?? '';
  return line.trimEnd().endsWith(':') ? base + '    ' : base;
}
