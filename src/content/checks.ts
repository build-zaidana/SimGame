/** Pemeriksaan silang & kebijakan konten (ARCHITECTURE §5.6). Fungsi murni; dipakai content-check. */
import type { ContentError, ModeContent } from './loader.ts';
import type { BaseCase } from './schemas.ts';
import { NO_ACTION_VERDICTS, type Verdict } from '../engine/types.ts';

export interface BrandTerm {
  term: string;
  /** true untuk singkatan yang juga kata umum (mis. "DANA" vs "dana"). */
  caseSensitive?: boolean;
}

export interface CheckPolicy {
  brandDenylist: BrandTerm[];
  /** Nama platform yang boleh disebut di materi (concepts/). */
  conceptBrandAllowlist: string[];
  /** Domain fiktif yang boleh dipakai selain TLD .test / .example. */
  fictionalDomains: string[];
  knownGenerators: string[];
  /** ID alat yang mekaniknya ada di kode mode; undefined = tidak dicek. */
  knownTools?: string[];
  safeRatio: { min: number; max: number };
  maxDocumentWords: number;
  maxConceptWords: number;
  maxExplanationSentences: number;
  /** Batas kata tiap tulisan di koran pagi. */
  maxNewsWords: number;
}

export const DEFAULT_LIMITS = {
  safeRatio: { min: 0.3, max: 0.4 },
  maxDocumentWords: 120,
  maxConceptWords: 180,
  maxExplanationSentences: 2,
  maxNewsWords: 60,
} as const;

/** TLD dunia nyata yang dicek; ekstensi file (.pdf, .apk) tidak dianggap domain. */
const REAL_TLDS = new Set(
  'com net org id co io info biz xyz me app dev site online top shop store link click live club tech ai us uk sg my au cc tk ml ga cf gq ru cn'.split(
    ' ',
  ),
);
const SAFE_TLDS = ['test', 'example', 'invalid', 'localhost'];
const DOMAIN_TOKEN = /(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*/gi;

export function countWords(s: string): number {
  return s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Titik di dalam domain/angka tidak dihitung sebagai akhir kalimat. */
export function countSentences(s: string): number {
  return s.split(/[.!?]+(?:\s+|$)/).filter((p) => p.trim().length > 0).length;
}

function walkStrings(
  v: unknown,
  keyFilter: ((key: string) => boolean) | null,
  out: string[],
  key = '',
) {
  if (typeof v === 'string') {
    if (!keyFilter || keyFilter(key)) out.push(v);
  } else if (Array.isArray(v)) {
    for (const x of v) walkStrings(x, keyFilter, out, key);
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) walkStrings(x, keyFilter, out, k);
  }
}

const allStrings = (v: unknown) => {
  const out: string[] = [];
  walkStrings(v, null, out);
  return out;
};

/** Teks yang dibaca pemain di dokumen (bukan ID atau href tersembunyi). */
export function documentText(data: unknown): string {
  const out: string[] = [];
  // Kode acuan, tes, dan kode awal editor (Meja Developer) bukan teks bacaan dokumen.
  walkStrings(
    data,
    (k) =>
      ![
        'evidenceId',
        'href',
        'id',
        'solution',
        'tests',
        'starter',
        'scratch',
        'flag',
        'maps',
      ].includes(k),
    out,
  );
  return out.join(' ');
}

export function collectEvidenceIds(data: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if (k === 'evidenceId' && typeof x === 'string') out.push(x);
        else walk(x);
      }
    }
  };
  walk(data);
  return out;
}

export function findBrands(
  text: string,
  terms: readonly BrandTerm[],
  allow: readonly string[] = [],
): string[] {
  const allowed = new Set(allow.map((a) => a.toLowerCase()));
  return terms
    .filter((t) => !allowed.has(t.term.toLowerCase()))
    .filter((t) => {
      const escaped = t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(
        `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,
        t.caseSensitive ? 'u' : 'iu',
      ).test(text);
    })
    .map((t) => t.term);
}

export function findNonFictionalDomains(text: string, fictional: readonly string[]): string[] {
  const bad = new Set<string>();
  for (const raw of text.match(DOMAIN_TOKEN) ?? []) {
    const domain = raw.toLowerCase();
    const tld = domain.slice(domain.lastIndexOf('.') + 1);
    if (SAFE_TLDS.includes(tld) || !REAL_TLDS.has(tld)) continue;
    if (fictional.some((f) => domain === f || domain.endsWith(`.${f}`))) continue;
    bad.add(domain);
  }
  return [...bad];
}

export function checkModeContent(content: ModeContent, policy: CheckPolicy): ContentError[] {
  const errors: ContentError[] = [];
  const err = (file: string, message: string) => errors.push({ file, message });

  const conceptIds = new Set(content.concepts.map((c) => c.id));
  const ruleIds = new Set<string>();
  const chapterIds = new Set<string>();
  const dupCheck = (seen: Set<string>, id: string, file: string, kind: string) => {
    if (seen.has(id)) err(file, `ID ${kind} duplikat: ${id}`);
    seen.add(id);
  };

  const seenConcepts = new Set<string>();
  for (const c of content.concepts) {
    const file = `concepts/${c.id}.md`;
    dupCheck(seenConcepts, c.id, file, 'konsep');
    if (c.mode !== content.meta.id) err(file, `mode "${c.mode}" ≠ "${content.meta.id}"`);
    const words = countWords(c.body);
    if (words > policy.maxConceptWords)
      err(file, `materi ${words} kata (maks ${policy.maxConceptWords})`);
    const brands = findBrands(
      c.body + ' ' + c.title,
      policy.brandDenylist,
      policy.conceptBrandAllowlist,
    );
    if (brands.length) err(file, `merek nyata: ${brands.join(', ')}`);
  }

  for (const ch of content.rulebook.chapters) {
    dupCheck(chapterIds, ch.id, 'rulebook.json', 'bab');
    if (!conceptIds.has(ch.conceptId))
      err('rulebook.json', `${ch.id}: konsep tidak ada: ${ch.conceptId}`);
    for (const r of ch.rules) dupCheck(ruleIds, r.id, 'rulebook.json', 'aturan');
  }
  const rulebookBrands = findBrands(allStrings(content.rulebook).join(' '), policy.brandDenylist);
  if (rulebookBrands.length) err('rulebook.json', `merek nyata: ${rulebookBrands.join(', ')}`);

  for (const c of Object.values(content.cases)) checkCase(c, `cases/${c.id}.json`);

  function checkCase(c: BaseCase, file: string) {
    for (const id of c.conceptIds) if (!conceptIds.has(id)) err(file, `konsep tidak ada: ${id}`);
    for (const id of c.ruleRefs) if (!ruleIds.has(id)) err(file, `aturan tidak ada: ${id}`);

    const evidenceIds = collectEvidenceIds(c.data);
    const intelIds = collectEvidenceIds(c.intel ?? {});
    const evidenceSet = new Set(evidenceIds);
    const allIds = [...evidenceIds, ...intelIds];
    if (new Set(allIds).size !== allIds.length) err(file, 'evidenceId duplikat di data/intel');
    for (const id of c.evidence.required) {
      if (intelIds.includes(id)) err(file, `evidence wajib "${id}" hanya terlihat dengan alat`);
      else if (!evidenceSet.has(id)) err(file, `evidence "${id}" tidak ada di data`);
    }
    for (const id of c.evidence.supporting) {
      if (!evidenceSet.has(id) && !intelIds.includes(id))
        err(file, `evidence "${id}" tidak ada di data`);
    }
    const overlap = c.evidence.required.filter((id) => c.evidence.supporting.includes(id));
    if (overlap.length) err(file, `evidence ada di required & supporting: ${overlap.join(', ')}`);
    if (
      c.verdict !== 'task' &&
      !NO_ACTION_VERDICTS.includes(c.verdict) &&
      c.evidence.required.length === 0
    ) {
      err(file, 'kasus berbahaya/mencurigakan wajib punya evidence.required');
    }
    if (c.correctDecision in c.acceptableDecisions) {
      err(file, 'correctDecision tidak boleh ada di acceptableDecisions');
    }

    const words = countWords(documentText(c.data));
    if (words > policy.maxDocumentWords)
      err(file, `dokumen ${words} kata (maks ${policy.maxDocumentWords})`);
    const sentences = countSentences(c.explanation);
    if (sentences > policy.maxExplanationSentences) {
      err(file, `penjelasan ${sentences} kalimat (maks ${policy.maxExplanationSentences})`);
    }

    for (const hint of c.hints) {
      if (countSentences(hint) > policy.maxExplanationSentences) {
        err(
          file,
          `petunjuk lebih dari ${policy.maxExplanationSentences} kalimat: "${hint.slice(0, 40)}…"`,
        );
      }
    }

    const text = allStrings(c).join(' ');
    const brands = findBrands(text, policy.brandDenylist);
    if (brands.length) err(file, `merek nyata: ${brands.join(', ')}`);
    const domains = findNonFictionalDomains(text, policy.fictionalDomains);
    if (domains.length)
      err(file, `domain bukan .test/.example/fiktif terdaftar: ${domains.join(', ')}`);
  }

  for (const s of content.shifts) {
    const file = `shifts/${s.id}.json`;
    if (s.boss) {
      const queued = new Set(s.queue.flatMap((q) => ('caseId' in q ? [q.caseId] : [])));
      if (new Set(s.boss.caseIds).size !== s.boss.caseIds.length)
        err(file, 'boss: kasus boss ganda');
      for (const id of s.boss.caseIds)
        if (!queued.has(id)) err(file, `boss: kasus tidak ada di antrian: ${id}`);
      if (s.boss.arriveAt + s.boss.durationGameMinutes > s.durationGameMinutes)
        err(file, 'boss: batas waktu boss melewati akhir shift');
    }
    let safe = 0;
    // Tugas coding/CTF (verdict `task`, ADR 026) bukan keputusan aman/tidak: tidak ikut rasio.
    let decisions = 0;
    for (const q of s.queue) {
      if ('caseId' in q) {
        const c = content.cases[q.caseId];
        if (!c) err(file, `kasus tidak ada: ${q.caseId}`);
        else if (c.verdict !== 'task') decisions++;
        if (c && NO_ACTION_VERDICTS.includes(c.verdict)) safe++;
      } else {
        if (!policy.knownGenerators.includes(q.generator))
          err(file, `generator tidak dikenal: ${q.generator}`);
        decisions++;
        if (NO_ACTION_VERDICTS.includes(q.params['verdict'] as Verdict)) safe++;
      }
    }
    const ratio = decisions === 0 ? policy.safeRatio.min : safe / decisions;
    if (ratio < policy.safeRatio.min || ratio > policy.safeRatio.max) {
      err(
        file,
        `rasio kasus aman ${(ratio * 100).toFixed(0)}% (harus ${policy.safeRatio.min * 100}–${policy.safeRatio.max * 100}%)`,
      );
    }
    for (const id of s.unlocksChapters) if (!chapterIds.has(id)) err(file, `bab tidak ada: ${id}`);
    for (const id of s.review.conceptIds)
      if (!conceptIds.has(id)) err(file, `konsep review tidak ada: ${id}`);
    for (const id of [s.introDialogue, s.outroDialogue]) {
      if (!content.dialogues[id]) err(file, `dialog tidak ada: ${id}`);
    }
    if (s.newspaper) {
      const n = s.newspaper;
      if (s.order === 1 && n.impact) err(file, 'koran: berita dampak tidak ada di shift pertama');
      if (s.order > 1 && !n.impact)
        err(file, 'koran: shift ini butuh berita dampak (good/mixed/bad)');
      const stories: [string, string][] = [
        ['lead', n.lead],
        ['tips', n.tip.text],
        ...Object.entries(n.impact ?? {}).map(([k, v]): [string, string] => [`dampak ${k}`, v]),
        ...(n.classified ? [['iklan', n.classified] as [string, string]] : []),
      ];
      for (const [name, story] of stories) {
        const words = countWords(story);
        if (words > policy.maxNewsWords)
          err(file, `koran: ${name} ${words} kata (maks ${policy.maxNewsWords})`);
      }
      const newsText = allStrings(n).join(' ');
      const brands = findBrands(newsText, policy.brandDenylist);
      if (brands.length) err(file, `koran: merek nyata: ${brands.join(', ')}`);
      const domains = findNonFictionalDomains(newsText, policy.fictionalDomains);
      if (domains.length)
        err(file, `koran: domain bukan .test/.example/fiktif terdaftar: ${domains.join(', ')}`);
    }
    const pool = content.review.filter((r) => s.review.conceptIds.includes(r.conceptId));
    if (pool.length < Math.min(3, s.review.count)) {
      err(file, `soal review untuk konsep shift ini hanya ${pool.length} (min 3)`);
    }
  }

  const seenReview = new Set<string>();
  for (const r of content.review) {
    const file = `review/${r.conceptId}.json`;
    dupCheck(seenReview, r.id, file, 'soal');
    if (!conceptIds.has(r.conceptId)) err(file, `${r.id}: konsep tidak ada: ${r.conceptId}`);
    if (r.type === 'mcq' && r.answerIndex >= r.choices.length)
      err(file, `${r.id}: answerIndex di luar pilihan`);
    if (r.type === 'order-steps' && new Set(r.steps).size !== r.steps.length) {
      err(file, `${r.id}: langkah duplikat`);
    }
    if (r.type === 'tap-evidence') {
      const ids = new Set(r.parts.flatMap((p) => (p.evidenceId ? [p.evidenceId] : [])));
      for (const a of r.answer)
        if (!ids.has(a)) err(file, `${r.id}: jawaban "${a}" tidak ada di parts`);
    }
    if (countSentences(r.explanation) > policy.maxExplanationSentences) {
      err(file, `${r.id}: penjelasan lebih dari ${policy.maxExplanationSentences} kalimat`);
    }
    const brands = findBrands(allStrings(r).join(' '), policy.brandDenylist);
    if (brands.length) err(file, `${r.id}: merek nyata: ${brands.join(', ')}`);
  }

  const seenTools = new Set<string>();
  for (const t of content.tools) {
    dupCheck(seenTools, t.id, 'tools.json', 'alat');
    if (!conceptIds.has(t.conceptId))
      err('tools.json', `${t.id}: konsep tidak ada: ${t.conceptId}`);
    if (policy.knownTools && !policy.knownTools.includes(t.id)) {
      err('tools.json', `${t.id}: alat belum diimplementasikan di kode mode`);
    }
  }

  const seenUpgrades = new Set<string>();
  for (const u of content.upgrades) {
    dupCheck(seenUpgrades, u.id, 'upgrades.json', 'upgrade');
    const brands = findBrands(allStrings(u).join(' '), policy.brandDenylist);
    if (brands.length) err('upgrades.json', `${u.id}: merek nyata: ${brands.join(', ')}`);
  }

  const seenBadges = new Set<string>();
  const shiftIds = new Set(content.shifts.map((s) => s.id));
  for (const b of content.badges) {
    if (b.rule.type === 'shift-complete' && b.rule.shiftId && !shiftIds.has(b.rule.shiftId))
      err('badges.json', `${b.id}: shift tidak ada: ${b.rule.shiftId}`);
    dupCheck(seenBadges, b.id, 'badges.json', 'lencana');
    if (b.rule.type === 'tools-owned' && b.rule.count > content.tools.length)
      err(
        'badges.json',
        `${b.id}: butuh ${b.rule.count} alat, toko hanya punya ${content.tools.length}`,
      );
    const brands = findBrands(allStrings(b).join(' '), policy.brandDenylist);
    if (brands.length) err('badges.json', `${b.id}: merek nyata: ${brands.join(', ')}`);
  }

  if (content.assessment) {
    const { pre, post } = content.assessment;
    for (const rid of [...pre, ...post]) {
      if (!seenReview.has(rid)) err('assessment.json', `soal tidak ada: ${rid}`);
    }
    const overlap = pre.filter((x) => post.includes(x));
    if (overlap.length)
      err('assessment.json', `soal pre & post tumpang tindih: ${overlap.join(', ')}`);
  }

  for (const d of Object.values(content.dialogues)) {
    const brands = findBrands(allStrings(d).join(' '), policy.brandDenylist);
    if (brands.length) err(`dialogue/${d.id}`, `merek nyata: ${brands.join(', ')}`);
  }

  return errors;
}
