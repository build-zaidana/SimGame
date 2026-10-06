import { describe, expect, it } from 'vitest';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { replay, runRobot, type RobotMap } from '../robot.ts';

// '#' dinding, '.' lantai, 'P' paket, 'T' tujuan. Robot mulai menghadap timur (E).
const straight: RobotMap = { grid: ['#####', '#.PT#', '#####'], start: { x: 1, y: 1, dir: 'E' } };
const longer: RobotMap = {
  grid: ['#######', '#..P.T#', '#######'],
  start: { x: 1, y: 1, dir: 'E' },
};

describe('runRobot (robot kurir di MicroPython)', () => {
  it('records the moves and passes when every package is delivered', async () => {
    const r = await runRobot(loadMicroPython, 'maju()\nambil()\nmaju()\nantar()', [straight]);
    expect(r.maps[0]).toMatchObject({ passed: true, delivered: 1, total: 1 });
    expect(r.maps[0]?.trace).toEqual(['F', 'P', 'F', 'D']);
  });

  it('runs the same program on every map, so hard-coded steps fail elsewhere', async () => {
    const r = await runRobot(loadMicroPython, 'maju()\nambil()\nmaju()\nantar()', [
      straight,
      longer,
    ]);
    expect(r.maps.map((m) => m.passed)).toEqual([true, false]);
  });

  it('lets sensors drive loops and ifs', async () => {
    const code = [
      'while not di_tujuan():',
      '    if ada_paket():',
      '        ambil()',
      '    maju()',
      'antar()',
    ].join('\n');
    const r = await runRobot(loadMicroPython, code, [straight, longer]);
    expect(r.maps.map((m) => m.passed)).toEqual([true, true]);
  });

  it('stops with a friendly error when the robot hits a wall', async () => {
    const r = await runRobot(loadMicroPython, 'belok_kiri()\nmaju()', [straight]);
    expect(r.maps[0]?.passed).toBe(false);
    expect(r.maps[0]?.trace).toEqual(['L', 'X']);
    expect(r.maps[0]?.error?.text).toMatch(/dinding/);
  });

  it('caps the number of steps so endless loops end', async () => {
    const r = await runRobot(loadMicroPython, 'while True:\n    belok_kanan()', [straight]);
    expect(r.maps[0]?.passed).toBe(false);
    expect(r.maps[0]?.error?.text).toMatch(/langkah/);
  });

  it('accepts the English function names too', async () => {
    const r = await runRobot(loadMicroPython, 'forward()\npick_up()\nforward()\ndeliver()', [
      straight,
    ]);
    expect(r.maps[0]?.passed).toBe(true);
  });
});

describe('replay (frames for the robot animation)', () => {
  it('turns a trace into positions, cargo and deliveries', () => {
    const frames = replay(straight, ['F', 'P', 'F', 'D']);
    expect(frames).toHaveLength(5);
    expect(frames[0]).toMatchObject({ x: 1, y: 1, dir: 'E', carrying: 0, delivered: 0 });
    expect(frames[2]).toMatchObject({ x: 2, y: 1, carrying: 1, packages: [] });
    expect(frames[4]).toMatchObject({ x: 3, y: 1, carrying: 0, delivered: 1 });
  });

  it('marks a crash without moving into the wall', () => {
    const frames = replay(straight, ['L', 'X']);
    expect(frames.at(-1)).toMatchObject({ x: 1, y: 1, dir: 'N', crashed: true });
  });
});
