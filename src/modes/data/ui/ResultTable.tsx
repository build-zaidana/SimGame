import type { Cell } from '../runner/sqlHarness.ts';

interface ResultTableProps {
  caption: string;
  columns: readonly string[];
  rows: readonly (readonly Cell[])[];
  /** Teks saat tidak ada baris. */
  empty?: string;
  testId?: string;
}

const show = (c: Cell) =>
  c === null ? 'NULL' : typeof c === 'number' ? String(Math.round(c * 100) / 100) : c;

/** Tabel data kecil. Tabel lebar digulir di dalam kotaknya sendiri, bukan seluruh halaman. */
export function ResultTable({ caption, columns, rows, empty, testId }: ResultTableProps) {
  return (
    <div className="max-w-full overflow-x-auto border-2 border-ink/40" data-testid={testId}>
      <table className="w-full border-collapse font-mono text-xs">
        <caption className="bg-panel px-2 py-1 text-left font-sans text-sm font-bold">
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col" className="border-b-2 border-ink/40 px-2 py-1 text-left">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-ink/5">
              {r.map((c, j) => (
                <td key={j} className={'px-2 py-1 ' + (c === null ? 'italic text-ink-muted' : '')}>
                  {show(c)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && empty && (
            <tr>
              <td colSpan={Math.max(1, columns.length)} className="px-2 py-1 text-ink-muted">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
