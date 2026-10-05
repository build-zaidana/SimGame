/**
 * Pemeriksaan konten Meja Developer yang butuh menjalankan Python (dipakai content:check, ADR 026):
 * solusi acuan lulus semua tes, kode awal gagal minimal satu tes, solusi CTF mencetak benderanya.
 * Tanpa DOM: interpreter disuntikkan (Node memakai paket MicroPython yang sama).
 */
import { runWithTests, type LoadMicroPython, type PyTest } from './runner/harness.ts';

interface DevCaseLike {
  id: string;
  type: string;
  data: unknown;
}

export async function verifyDevCase(load: LoadMicroPython, c: DevCaseLike): Promise<string[]> {
  const errors: string[] = [];
  if (c.type === 'coding') {
    const d = c.data as { starter: string; solution: string; tests: PyTest[] };
    const sol = await runWithTests(load, d.solution, d.tests);
    if (sol.error) errors.push(`solusi acuan error: ${sol.error.text}`);
    for (const t of sol.tests)
      if (!t.passed) errors.push(`solusi acuan gagal tes "${t.name}": ${t.message ?? ''}`);
    const start = await runWithTests(load, d.starter, d.tests);
    if (start.tests.every((t) => t.passed)) errors.push('kode awal sudah lulus semua tes');
  }
  if (c.type === 'ctf') {
    const d = c.data as { flag: string; solution: string; scratch: string };
    const sol = await runWithTests(load, d.solution, []);
    if (sol.error) errors.push(`solusi CTF error: ${sol.error.text}`);
    else if (!sol.output.some((l) => l.includes(d.flag)))
      errors.push('solusi CTF tidak mencetak bendera');
    const scratch = await runWithTests(load, d.scratch, []);
    if (scratch.error) errors.push(`kode konsol awal error: ${scratch.error.text}`);
  }
  return errors;
}
