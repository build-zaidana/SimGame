/**
 * Simulator ekonomi (ADR 017): memainkan kelima shift konten asli memakai rumus engine yang
 * sebenarnya (skor, kepercayaan, gaji, bintang, toko) untuk tiga profil pemain.
 * Hanya alat bantu penyetelan, tidak dijalankan di CI. `pnpm sim:economy [jumlahRun]`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parseModeContent } from '../src/content/loader.ts';
import { applyTrust, buyTool, carryTrust, shiftPay, trustDelta } from '../src/engine/economy.ts';
import { createRng, nextFloat, type RngState } from '../src/engine/rng.ts';
import { caseScore, shiftStars } from '../src/engine/scoring.ts';
import type { CaseCore, DecisionId } from '../src/engine/types.ts';
import { INITIAL_TRUST } from '../src/persistence/saveSchema.ts';
import { socCaseSchemas } from '../src/modes/soc/caseTypes/schemas.ts';
import { evaluateSocCase } from '../src/modes/soc/evaluate.ts';
import { socGenerators } from '../src/modes/soc/generators/index.ts';

const ROOT = join(import.meta.dirname, '..');
const MODE_DIR = join(ROOT, 'content/id/modes/soc');
/** Keputusan yang terbuka per shift (sama dengan src/modes/soc/index.ts). */
const DECISIONS: [DecisionId, number][] = [
  ['allow', 1],
  ['block', 1],
  ['escalate', 1],
  ['reset-password', 3],
  ['quarantine', 4],
];

interface Profile {
  name: string;
  /** Peluang keputusan benar per tingkat kesulitan kasus (1–3). */
  pCorrect: [number, number, number];
  /** Bila salah: peluang memilih keputusan yang masih dapat nilai sebagian. */
  pPartial: number;
  /** Peluang menandai tiap bukti wajib / pendukung. */
  pRequired: number;
  pSupporting: number;
  /** Rata-rata tandai yang salah per kasus. */
  wrongMarks: number;
  /** Rata-rata petunjuk per kasus. */
  hints: number;
}

const PROFILES: Profile[] = [
  {
    name: 'pemula',
    pCorrect: [0.7, 0.55, 0.4],
    pPartial: 0.5,
    pRequired: 0.6,
    pSupporting: 0.2,
    wrongMarks: 0.6,
    hints: 1.5,
  },
  {
    name: 'rata-rata',
    pCorrect: [0.88, 0.75, 0.6],
    pPartial: 0.6,
    pRequired: 0.8,
    pSupporting: 0.35,
    wrongMarks: 0.3,
    hints: 0.8,
  },
  {
    name: 'mahir',
    pCorrect: [0.98, 0.95, 0.88],
    pPartial: 0.7,
    pRequired: 0.95,
    pSupporting: 0.5,
    wrongMarks: 0.1,
    hints: 0.2,
  },
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function loadContent() {
  const files: Record<string, unknown> = {};
  for (const path of walk(MODE_DIR)) {
    const rel = relative(MODE_DIR, path).split(sep).join('/');
    const raw = readFileSync(path, 'utf8');
    files[rel] = path.endsWith('.json') ? JSON.parse(raw) : raw;
  }
  const { content, errors } = parseModeContent(files, socCaseSchemas);
  if (errors.length > 0) throw new Error(`konten tidak valid: ${errors[0]?.message}`);
  return content;
}

/** Rng berbentuk state; dibungkus agar mudah dipakai berulang. */
class R {
  private rng: RngState;
  constructor(rng: RngState) {
    this.rng = rng;
  }
  next(): number {
    const [v, r] = nextFloat(this.rng);
    this.rng = r;
    return v;
  }
  pick<T>(xs: readonly T[]): T {
    return xs[Math.floor(this.next() * xs.length)] as T;
  }
  /** Bilangan bulat ≥ 0 dengan rata-rata `mean` (Poisson sederhana). */
  count(mean: number): number {
    let n = 0;
    let p = Math.exp(-mean);
    let s = p;
    const u = this.next();
    while (u > s && n < 10) {
      n++;
      p *= mean / n;
      s += p;
    }
    return n;
  }
  get state(): RngState {
    return this.rng;
  }
}

function playCase(c: CaseCore, order: number, profile: Profile, r: R) {
  const open = DECISIONS.filter(([, at]) => at <= order).map(([d]) => d);
  const difficulty = Math.min(3, Math.max(1, (c as { difficulty?: number }).difficulty ?? 2));
  let decision: DecisionId = c.correctDecision;
  if (r.next() >= profile.pCorrect[difficulty - 1]!) {
    const partial = open.filter((d) => (c.acceptableDecisions[d] ?? 0) > 0);
    const others = open.filter((d) => d !== c.correctDecision && !partial.includes(d));
    decision = partial.length > 0 && r.next() < profile.pPartial ? r.pick(partial) : r.pick(others);
  }
  const marks = [
    ...c.evidence.required.filter(() => r.next() < profile.pRequired),
    ...c.evidence.supporting.filter(() => r.next() < profile.pSupporting),
    ...Array.from({ length: r.count(profile.wrongMarks) }, (_, i) => `x-wrong-${i}`),
  ];
  const outcome = evaluateSocCase(c, { decision, marks });
  const score = caseScore({
    decisionScore: outcome.decisionScore,
    evidenceScore: outcome.evidenceScore,
    hintsUsed: r.count(profile.hints),
    timeBonus: 0, // mode Santai (default pemula)
  });
  return { outcome, score };
}

const runs = Number(process.argv[2] ?? 2000);
const content = loadContent();
const shifts = [...content.shifts].sort((a, b) => a.order - b.order);
const tools = [...content.tools].sort((a, b) => a.unlockAtShift - b.unlockAtShift);

const pct = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0;
};
const mean = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

for (const profile of PROFILES) {
  const per = shifts.map(() => ({
    score: [] as number[],
    pay: [] as number[],
    trust: [] as number[],
    stars: [0, 0, 0, 0],
    walletStart: [] as number[],
    toolsAtStart: [] as number[],
  }));
  const toolOwnedAt: Record<string, number[]> = Object.fromEntries(tools.map((t) => [t.id, []]));
  for (let run = 0; run < runs; run++) {
    const r = new R(createRng(run * 7919 + profile.name.length));
    let wallet = 0;
    let trust = INITIAL_TRUST;
    let owned: string[] = [];
    shifts.forEach((shift, si) => {
      // Belanja serakah sebelum shift: alat termurah yang sudah terbuka dulu.
      for (const t of [...tools].sort((a, b) => a.price - b.price)) {
        if (t.unlockAtShift > shift.order) continue;
        const res = buyTool({ wallet, toolsOwned: owned }, t);
        if (res.ok) {
          wallet = res.wallet;
          owned = res.toolsOwned;
          toolOwnedAt[t.id]!.push(shift.order);
        }
      }
      per[si]!.walletStart.push(wallet);
      per[si]!.toolsAtStart.push(owned.length);
      trust = carryTrust(trust);
      const scores: number[] = [];
      let rng = r.state;
      shift.queue.forEach((q, i) => {
        let c: CaseCore | undefined;
        if ('caseId' in q) c = content.cases[q.caseId];
        else {
          const gen = socGenerators[q.generator];
          if (!gen) return;
          const [raw, next] = gen(q.params, rng, { id: `${shift.id}-gen-${i}` });
          rng = next;
          c = socCaseSchemas[raw.type]?.parse(raw) as CaseCore;
        }
        if (!c) return;
        const { outcome, score } = playCase(c, shift.order, profile, r);
        scores.push(score);
        trust = applyTrust(trust, trustDelta(outcome.impact, outcome.severity));
      });
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const pay = shiftPay(shift.pay, scores);
      wallet += pay;
      const p = per[si]!;
      p.score.push(avg);
      p.pay.push(pay);
      p.trust.push(trust);
      p.stars[shiftStars(avg, trust)]!++;
    });
  }
  console.log(`\n== ${profile.name} (${runs} run) ==`);
  console.log('shift  skor  gaji  dompet-awal  kepercayaan(p10/med)  bintang 0/1/2/3 (%)');
  shifts.forEach((s, si) => {
    const p = per[si]!;
    const stars = p.stars.map((n) => Math.round((100 * n) / runs)).join('/');
    console.log(
      `${s.id}  ${String(mean(p.score)).padStart(4)}  ${String(mean(p.pay)).padStart(4)}  ` +
        `${String(mean(p.walletStart)).padStart(11)}  ${String(pct(p.trust, 0.1)).padStart(9)}/${String(
          pct(p.trust, 0.5),
        ).padEnd(10)}  ${stars}`,
    );
  });
  for (const t of tools) {
    const at = toolOwnedAt[t.id]!;
    const share = Math.round((100 * at.length) / runs);
    console.log(
      `  ${t.id} (Rp ${t.price}, buka shift ${t.unlockAtShift}): terbeli ${share}%` +
        (at.length ? `, median sebelum shift ${pct(at, 0.5)}` : ''),
    );
  }
}
