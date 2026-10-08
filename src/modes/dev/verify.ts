/**
 * Pemeriksaan konten Meja Developer yang butuh menjalankan Python (dipakai content:check, ADR 026):
 * solusi acuan lulus semua tes, kode awal gagal minimal satu tes, solusi CTF mencetak benderanya.
 * Tanpa DOM: interpreter disuntikkan (Node memakai paket MicroPython yang sama).
 */
import { runWithTests, type LoadMicroPython, type PyTest } from './runner/harness.ts';
import { runRobot, type RobotMap } from './runner/robot.ts';
import { missingCommands, type RobotCommand } from './runner/robotPalette.ts';

/** Peta valid: pinggir dinding, start di lantai, ada paket dan tujuan. */
export function robotMapErrors(map: RobotMap, i: number): string[] {
  const errors: string[] = [];
  const g = map.grid;
  const width = g[0]?.length ?? 0;
  const at = `peta ${i + 1}`;
  if (g.some((r) => r.length !== width)) errors.push(`${at}: semua baris harus sama panjang`);
  const border = g.every((r, y) =>
    y === 0 || y === g.length - 1 ? /^#+$/.test(r) : r.startsWith('#') && r.endsWith('#'),
  );
  if (!border) errors.push(`${at}: pinggir peta harus dinding (#)`);
  const startCell = g[map.start.y]?.[map.start.x];
  if (!startCell || startCell === '#') errors.push(`${at}: posisi awal robot harus di lantai`);
  if (!g.some((r) => r.includes('P'))) errors.push(`${at}: belum ada paket (P)`);
  if (!g.some((r) => r.includes('T'))) errors.push(`${at}: belum ada tujuan (T)`);
  return errors;
}

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
  if (c.type === 'robot') {
    const d = c.data as {
      maps: RobotMap[];
      starter: string;
      solution: string;
      commands?: RobotCommand[];
    };
    d.maps.forEach((m, i) => errors.push(...robotMapErrors(m, i)));
    const missing = missingCommands(d.solution, d.commands);
    if (missing.length)
      errors.push(
        `solusi acuan memakai perintah yang tidak ada di palet level: ${missing.join(', ')}`,
      );
    if (errors.length) return errors;
    const sol = await runRobot(load, d.solution, d.maps);
    sol.maps.forEach((m, i) => {
      if (!m.passed)
        errors.push(`solusi acuan gagal di peta ${i + 1}${m.error ? `: ${m.error.text}` : ''}`);
    });
    const start = await runRobot(load, d.starter, d.maps);
    if (start.maps.every((m) => m.passed))
      errors.push('kode awal robot sudah berhasil di semua peta');
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
