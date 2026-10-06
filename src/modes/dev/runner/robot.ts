/**
 * Dunia robot kurir (ADR 026, tahap "game feel"): program Python pemain menggerakkan robot di peta
 * kisi. Dunia disimulasikan di Python sendiri, jadi sensor (depan_kosong(), ada_paket()) bisa dipakai
 * di if/while. Setiap peta dijalankan di interpreter baru; jejak langkah dianimasikan di UI.
 */
import type { LoadMicroPython, RunError } from './harness.ts';
import { parseError } from './harness.ts';

export type RobotDir = 'N' | 'E' | 'S' | 'W';
export interface RobotMap {
  /** '#' dinding, '.' lantai, 'P' paket, 'T' tujuan. Pinggir peta wajib dinding. */
  grid: string[];
  start: { x: number; y: number; dir: RobotDir };
}
/** F maju · L/R belok · P ambil · D antar · X menabrak. */
export type RobotStep = 'F' | 'L' | 'R' | 'P' | 'D' | 'X';
export interface RobotMapResult {
  passed: boolean;
  trace: RobotStep[];
  delivered: number;
  total: number;
  error?: RunError;
}
export interface RobotResult {
  maps: RobotMapResult[];
  output: string[];
}

/** Batas langkah per peta: loop tak berujung berhenti dengan pesan yang jelas. */
export const MAX_ROBOT_STEPS = 300;
const DIRS: RobotDir[] = ['N', 'E', 'S', 'W'];

/** Kode Python dunia robot; nama fungsi Indonesia + alias Inggris. */
export function robotPrelude(map: RobotMap): string {
  return `
_W = ${JSON.stringify(map.grid)}
_x, _y, _d = ${map.start.x}, ${map.start.y}, ${DIRS.indexOf(map.start.dir)}
_DX = [0, 1, 0, -1]
_DY = [-1, 0, 1, 0]
_paket = []
for _r in range(len(_W)):
    for _c in range(len(_W[_r])):
        if _W[_r][_c] == "P":
            _paket.append((_c, _r))
_total = len(_paket)
_bawa = 0
_antar = 0
_jejak = []
def _langkah():
    if len(_jejak) >= ${MAX_ROBOT_STEPS}:
        raise RuntimeError("Robot kelelahan: lebih dari ${MAX_ROBOT_STEPS} langkah")
def _depan():
    return _x + _DX[_d], _y + _DY[_d]
def maju():
    global _x, _y
    _langkah()
    nx, ny = _depan()
    if _W[ny][nx] == "#":
        _jejak.append("X")
        raise RuntimeError("Robot menabrak dinding!")
    _x, _y = nx, ny
    _jejak.append("F")
def belok_kiri():
    global _d
    _langkah()
    _d = (_d + 3) % 4
    _jejak.append("L")
def belok_kanan():
    global _d
    _langkah()
    _d = (_d + 1) % 4
    _jejak.append("R")
def depan_kosong():
    nx, ny = _depan()
    return _W[ny][nx] != "#"
def ada_paket():
    return (_x, _y) in _paket
def di_tujuan():
    return _W[_y][_x] == "T"
def ambil():
    global _bawa
    _langkah()
    if (_x, _y) not in _paket:
        raise RuntimeError("Tidak ada paket di sini")
    _paket.remove((_x, _y))
    _bawa += 1
    _jejak.append("P")
def antar():
    global _bawa, _antar
    _langkah()
    if not di_tujuan():
        raise RuntimeError("Belum sampai di tujuan")
    if _bawa == 0:
        raise RuntimeError("Robot tidak membawa paket")
    _antar += _bawa
    _bawa = 0
    _jejak.append("D")
forward, turn_left, turn_right = maju, belok_kiri, belok_kanan
front_clear, has_package, at_target = depan_kosong, ada_paket, di_tujuan
pick_up, deliver = ambil, antar
def _status():
    return "".join(_jejak) + "|" + str(_antar) + "|" + str(_total)
`;
}

export async function runRobot(
  load: LoadMicroPython,
  code: string,
  maps: readonly RobotMap[],
  options: { url?: string } = {},
): Promise<RobotResult> {
  const output: string[] = [];
  const results: RobotMapResult[] = [];
  for (const map of maps) {
    let sink = (l: string) => {
      if (output.length < 100) output.push(l);
    };
    const mp = await load({
      ...options,
      stdout: (l) => sink(l),
      stderr: (l) => sink(l),
      linebuffer: true,
    });
    mp.runPython(robotPrelude(map));
    let error: RunError | undefined;
    try {
      mp.runPython(code);
    } catch (e) {
      error = parseError(e);
    }
    let status = '';
    sink = (l) => (status = l);
    mp.runPython('print(_status())');
    const [trace = '', delivered = '0', total = '0'] = status.split('|');
    const d = Number(delivered);
    const t = Number(total);
    results.push({
      passed: !error && t > 0 && d === t,
      trace: [...trace] as RobotStep[],
      delivered: d,
      total: t,
      ...(error ? { error } : {}),
    });
  }
  return { maps: results, output };
}

export interface RobotFrame {
  x: number;
  y: number;
  dir: RobotDir;
  carrying: number;
  delivered: number;
  /** Paket yang masih tergeletak di peta. */
  packages: { x: number; y: number }[];
  crashed: boolean;
}

/** Bingkai animasi dari jejak langkah (murni; aturan sama dengan dunia Python). */
export function replay(map: RobotMap, trace: readonly RobotStep[]): RobotFrame[] {
  const packages: { x: number; y: number }[] = [];
  map.grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'P') packages.push({ x, y });
    }),
  );
  let f: RobotFrame = {
    x: map.start.x,
    y: map.start.y,
    dir: map.start.dir,
    carrying: 0,
    delivered: 0,
    packages,
    crashed: false,
  };
  const frames = [f];
  const turn = (by: number) => DIRS[(DIRS.indexOf(f.dir) + by + 4) % 4] as RobotDir;
  const DX = { N: 0, E: 1, S: 0, W: -1 };
  const DY = { N: -1, E: 0, S: 1, W: 0 };
  for (const s of trace) {
    if (s === 'F') f = { ...f, x: f.x + DX[f.dir], y: f.y + DY[f.dir] };
    else if (s === 'L') f = { ...f, dir: turn(-1) };
    else if (s === 'R') f = { ...f, dir: turn(1) };
    else if (s === 'P')
      f = {
        ...f,
        carrying: f.carrying + 1,
        packages: f.packages.filter((p) => p.x !== f.x || p.y !== f.y),
      };
    else if (s === 'D') f = { ...f, delivered: f.delivered + f.carrying, carrying: 0 };
    else f = { ...f, crashed: true };
    frames.push(f);
  }
  return frames;
}
