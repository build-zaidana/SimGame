import { describe, expect, it } from 'vitest';
import { socCaseSchemas } from '../../modes/soc/caseTypes/schemas.ts';
import {
  checkModeContent,
  countSentences,
  countWords,
  DEFAULT_LIMITS,
  findBrands,
  findNonFictionalDomains,
  type CheckPolicy,
} from '../checks.ts';
import { parseModeContent } from '../loader.ts';

const policy: CheckPolicy = {
  ...DEFAULT_LIMITS,
  brandDenylist: [{ term: 'DANA', caseSensitive: true }, { term: 'Tokopedia' }],
  conceptBrandAllowlist: ['WhatsApp'],
  fictionalDomains: ['banknusantara.co.id'],
  knownGenerators: [],
};

const emailCase = (id: string, verdict: 'safe' | 'malicious', over: object = {}) => ({
  id,
  type: 'email',
  conceptIds: ['url'],
  difficulty: 1,
  verdict,
  correctDecision: verdict === 'safe' ? 'allow' : 'block',
  severity: 2,
  data: {
    from: { name: 'Bank Nusantara', address: 'info@banknusantara.co.id', evidenceId: 'sender' },
    subject: { text: 'Halo', evidenceId: 'subject' },
    body: [{ text: 'Isi email.', evidenceId: 'body' }],
  },
  evidence: { required: verdict === 'safe' ? [] : ['sender'], supporting: [] },
  explanation: 'Satu kalimat.',
  ruleRefs: ['r-1'],
  ...over,
});

function fixture(): Record<string, unknown> {
  return {
    'mode.json': { id: 'soc', title: 'SOC', description: 'Meja SOC' },
    'concepts/url.md':
      '---\nid: url\ntitle: URL\nmode: soc\norder: 1\nsources: [BSSN]\n---\nIsi materi.',
    'rulebook.json': {
      chapters: [
        {
          id: 'ch-1',
          title: 'Bab 1',
          conceptId: 'url',
          unlockAtShift: 1,
          rules: [{ id: 'r-1', text: 'Aturan.' }],
        },
      ],
    },
    'cases/c-1.json': emailCase('c-1', 'safe'),
    'cases/c-2.json': emailCase('c-2', 'malicious'),
    'cases/c-3.json': emailCase('c-3', 'malicious'),
    'shifts/s-1.json': {
      id: 's-1',
      order: 1,
      title: 'Shift',
      durationGameMinutes: 10,
      realSecondsPerGameMinute: 1,
      unlocksChapters: ['ch-1'],
      introDialogue: 'd-in',
      outroDialogue: 'd-out',
      tutorial: false,
      queue: [
        { caseId: 'c-1', arriveAt: 0 },
        { caseId: 'c-2', arriveAt: 1 },
        { caseId: 'c-3', arriveAt: 2 },
      ],
      review: { count: 3, conceptIds: ['url'] },
      pay: { base: 100, perCorrect: 10 },
    },
    'review/url.json': {
      items: [1, 2, 3].map((n) => ({
        id: `q-${n}`,
        type: 'mcq',
        conceptId: 'url',
        difficulty: 1,
        prompt: 'Soal?',
        choices: ['a', 'b'],
        answerIndex: 0,
        explanation: 'Karena a.',
      })),
    },
    'dialogue/s-1.json': {
      dialogues: [
        { id: 'd-in', lines: [{ speaker: 'rani', text: 'Halo.' }] },
        { id: 'd-out', lines: [{ speaker: 'rani', text: 'Dadah.' }] },
      ],
    },
  };
}

function errorsFor(files: Record<string, unknown>): string[] {
  const { content, errors } = parseModeContent(files, socCaseSchemas);
  return [...errors, ...checkModeContent(content, policy)].map((e) => `${e.file}: ${e.message}`);
}

describe('content validation', () => {
  it('accepts a valid fixture', () => {
    expect(errorsFor(fixture())).toEqual([]);
  });

  const cases: [string, (f: Record<string, unknown>) => void, RegExp][] = [
    [
      'schema mismatch',
      (f) => ((f['cases/c-1.json'] as { severity: number }).severity = 9),
      /severity/,
    ],
    [
      'unknown case type',
      (f) => ((f['cases/c-1.json'] as { type: string }).type = 'fax'),
      /tipe kasus tidak dikenal/,
    ],
    [
      'id ≠ file name',
      (f) => (f['cases/c-1.json'] = emailCase('c-9', 'safe')),
      /harus sama dengan nama file/,
    ],
    [
      'missing concept',
      (f) => (f['cases/c-2.json'] = emailCase('c-2', 'malicious', { conceptIds: ['nope'] })),
      /konsep tidak ada: nope/,
    ],
    [
      'missing rule',
      (f) => (f['cases/c-2.json'] = emailCase('c-2', 'malicious', { ruleRefs: ['r-x'] })),
      /aturan tidak ada: r-x/,
    ],
    [
      'evidence not in data',
      (f) =>
        (f['cases/c-2.json'] = emailCase('c-2', 'malicious', {
          evidence: { required: ['ghost'], supporting: [] },
        })),
      /evidence "ghost" tidak ada di data/,
    ],
    [
      'missing shift case',
      (f) =>
        ((f['shifts/s-1.json'] as { queue: object[] }).queue[2] = { caseId: 'c-x', arriveAt: 3 }),
      /kasus tidak ada: c-x/,
    ],
    [
      'safe ratio out of range',
      (f) => (f['cases/c-2.json'] = emailCase('c-2', 'safe')),
      /rasio kasus aman 67%/,
    ],
    [
      'explanation too long',
      (f) =>
        (f['cases/c-2.json'] = emailCase('c-2', 'malicious', { explanation: 'Satu. Dua. Tiga.' })),
      /penjelasan 3 kalimat/,
    ],
    [
      'document too long',
      (f) => {
        const c = emailCase('c-2', 'malicious') as { data: { body: { text: string }[] } };
        c.data.body[0]!.text = 'kata '.repeat(130);
        f['cases/c-2.json'] = c;
      },
      /dokumen \d+ kata/,
    ],
    [
      'concept too long',
      (f) => (f['concepts/url.md'] = (f['concepts/url.md'] as string) + ' kata'.repeat(200)),
      /materi \d+ kata/,
    ],
    [
      'real brand in a case',
      (f) => {
        const c = emailCase('c-2', 'malicious') as { data: { from: { name: string } } };
        c.data.from.name = 'Tokopedia';
        f['cases/c-2.json'] = c;
      },
      /merek nyata: Tokopedia/,
    ],
    [
      'real domain in a case',
      (f) => {
        const c = emailCase('c-2', 'malicious') as { data: { from: { address: string } } };
        c.data.from.address = 'cs@bankasli.co.id';
        f['cases/c-2.json'] = c;
      },
      /domain bukan .*bankasli\.co\.id/,
    ],
    [
      'unknown chapter',
      (f) => ((f['shifts/s-1.json'] as { unlocksChapters: string[] }).unlocksChapters = ['ch-x']),
      /bab tidak ada: ch-x/,
    ],
    [
      'missing dialogue',
      (f) => ((f['shifts/s-1.json'] as { introDialogue: string }).introDialogue = 'd-x'),
      /dialog tidak ada: d-x/,
    ],
    ['bad frontmatter', (f) => (f['concepts/url.md'] = 'tanpa frontmatter'), /frontmatter/],
    ['missing mode.json', (f) => delete f['mode.json'], /mode.json: file wajib tidak ada/],
    [
      'answerIndex out of range',
      (f) =>
        ((f['review/url.json'] as { items: { answerIndex: number }[] }).items[0]!.answerIndex = 5),
      /answerIndex di luar pilihan/,
    ],
  ];

  it.each(cases)('rejects: %s', (_name, mutate, expected) => {
    const f = fixture();
    mutate(f);
    expect(errorsFor(f).join('\n')).toMatch(expected);
  });
});

describe('text helpers', () => {
  it('counts words', () => {
    expect(countWords('Halo,  dunia — ini   tes.')).toBe(4);
  });
  it('does not treat domain dots as sentence ends', () => {
    expect(countSentences('Buka banknusantara.co.id sekarang. Lalu cek lagi.')).toBe(2);
    expect(countSentences('Rp 5.000 saja.')).toBe(1);
  });
  it('finds brands as whole words, respecting case sensitivity', () => {
    expect(findBrands('Kirim dana ke rekening', policy.brandDenylist)).toEqual([]);
    expect(findBrands('Top up DANA sekarang', policy.brandDenylist)).toEqual(['DANA']);
    expect(findBrands('Promo tokopedia', policy.brandDenylist)).toEqual(['Tokopedia']);
  });
  it('allows .test/.example, fictional domains and file names', () => {
    const text =
      'a@x.test b.example login.banknusantara.co.id banknusantara.co.id.jahat.test resi.pdf.apk';
    expect(findNonFictionalDomains(text, policy.fictionalDomains)).toEqual([]);
    expect(findNonFictionalDomains('buka contoh-asli.com', policy.fictionalDomains)).toEqual([
      'contoh-asli.com',
    ]);
  });
});
