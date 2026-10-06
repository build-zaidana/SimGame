/**
 * Menjalankan kode Python pemain lalu tes-tesnya di interpreter MicroPython yang baru (ADR 026).
 * Tanpa DOM/React: dipakai di Web Worker (game) dan di Node (content:check, unit test).
 * Batas waktu (loop tak berujung) diurus pemanggil dengan mematikan worker.
 */
import type {
  MicroPython,
  MicroPythonOptions,
} from '@micropython/micropython-webassembly-pyscript';

export interface PyTest {
  name: string;
  code: string;
  hidden?: boolean | undefined;
}
export interface TestResult {
  name: string;
  passed: boolean;
  hidden: boolean;
  message?: string;
  /** Untuk tes `assert A == B` tanpa pesan: nilai A dari kode pemain dan nilai B (repr). */
  got?: string;
  expected?: string;
}
/** Petunjuk ramah untuk error yang khas di MicroPython (teksnya ada di i18n). */
export type ErrorHint = 'slice-step' | 'missing-method' | 'indent';
export interface RunError {
  /** Baris terakhir traceback, mis. "NameError: name 'x' isn't defined". */
  text: string;
  /** Nomor baris di kode pemain, bila ada. */
  line?: number;
  hint?: ErrorHint;
}
export interface RunResult {
  tests: TestResult[];
  output: string[];
  truncated: boolean;
  error?: RunError;
}

export type LoadMicroPython = (options?: MicroPythonOptions) => Promise<MicroPython>;

const MAX_OUTPUT_LINES = 100;
/** `assert <hasil> == <harapan>` satu baris tanpa pesan sendiri. */
const PLAIN_EQUALITY = /^assert\s+(.+?)\s*==\s*(.+?)\s*$/;

/** Baris terakhir traceback + nomor baris kode pemain (`File "<stdin>", line N`). */
export function parseError(raw: unknown): RunError {
  const message = raw instanceof Error ? raw.message : String(raw);
  const lines = message
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const text = lines.at(-1) ?? message;
  const lineMatches = [...message.matchAll(/File "<stdin>", line (\d+)/g)];
  const line = lineMatches.length ? Number(lineMatches.at(-1)?.[1]) : undefined;
  const hint: ErrorHint | undefined = /slices with step/.test(text)
    ? 'slice-step'
    : /object has no attribute/.test(text)
      ? 'missing-method'
      : /IndentationError|unexpected indent|unindent/.test(text)
        ? 'indent'
        : undefined;
  return { text, ...(line !== undefined ? { line } : {}), ...(hint ? { hint } : {}) };
}

export async function runWithTests(
  load: LoadMicroPython,
  code: string,
  tests: readonly PyTest[],
  options: Pick<MicroPythonOptions, 'url'> = {},
): Promise<RunResult> {
  const output: string[] = [];
  let truncated = false;
  const write = (line: string) => {
    if (output.length < MAX_OUTPUT_LINES) output.push(line);
    else truncated = true;
  };
  // Keluaran bisa dialihkan sementara (probe nilai tes) agar tidak bercampur dengan print pemain.
  let sink = write;
  const mp = await load({
    ...options,
    stdout: (l) => sink(l),
    stderr: (l) => sink(l),
    linebuffer: true,
  });
  /** repr() dari sebuah ekspresi, atau undefined bila gagal dihitung. */
  const probe = (expr: string): string | undefined => {
    const got: string[] = [];
    sink = (l) => got.push(l);
    try {
      mp.runPython(`print(repr(${expr}))`);
      return got.join('\n');
    } catch {
      return undefined;
    } finally {
      sink = write;
    }
  };
  const results = (passed: (t: PyTest) => TestResult) => tests.map(passed);

  try {
    mp.runPython(code);
  } catch (e) {
    const error = parseError(e);
    return {
      error,
      output,
      truncated,
      tests: results((t) => ({
        name: t.name,
        passed: false,
        hidden: t.hidden === true,
        message: error.text,
      })),
    };
  }
  return {
    output,
    truncated,
    tests: results((t) => {
      try {
        mp.runPython(t.code);
        return { name: t.name, passed: true, hidden: t.hidden === true };
      } catch (e) {
        const failed: TestResult = {
          name: t.name,
          passed: false,
          hidden: t.hidden === true,
          message: parseError(e).text,
        };
        const eq = PLAIN_EQUALITY.exec(t.code.trim());
        if (eq?.[1] && eq[2] && !t.code.trim().includes('\n')) {
          const got = probe(eq[1]);
          const expected = probe(eq[2]);
          if (got !== undefined && expected !== undefined) return { ...failed, got, expected };
        }
        return failed;
      }
    }),
  };
}
