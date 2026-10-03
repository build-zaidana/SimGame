import { describe, expect, it } from 'vitest';
import { collectEvidenceIds, findNonFictionalDomains } from '../../../content/checks.ts';
import { checkLocaleParity } from '../../../content/parity.ts';
import { createRng } from '../../../engine/rng.ts';
import { emailCaseSchema } from '../caseTypes/email/schema.ts';
import { typosquatDomain } from '../generators/typosquat-domain.ts';

const params = { brand: 'KirimCepat', domain: 'kirimcepat.test', verdict: 'malicious' };
const gen = (seed: number, p: Record<string, unknown> = params) =>
  typosquatDomain(p, createRng(seed), { id: 'gen-1' })[0];

describe('typosquat-domain generator', () => {
  it('is deterministic for the same seed', () => {
    expect(gen(5)).toEqual(gen(5));
  });

  it('varies across seeds', () => {
    const domains = new Set(
      Array.from({ length: 30 }, (_, i) => emailCaseSchema.parse(gen(i)).data.from.address),
    );
    expect(domains.size).toBeGreaterThan(5);
  });

  it('produces valid, fictional, self-consistent malicious cases', () => {
    for (let seed = 0; seed < 50; seed++) {
      const c = emailCaseSchema.parse(gen(seed));
      expect(c.id).toBe('gen-1');
      expect(c.verdict).toBe('malicious');
      const sender = c.data.from.address.split('@')[1] ?? '';
      expect(sender).not.toBe('kirimcepat.test');
      expect(sender.endsWith('.test')).toBe(true);
      const ids = new Set(collectEvidenceIds(c.data));
      for (const ev of c.evidence.required) expect(ids.has(ev)).toBe(true);
      expect(findNonFictionalDomains(JSON.stringify(c), [])).toEqual([]);
    }
  });

  it('safe variant uses the real domain', () => {
    const c = emailCaseSchema.parse(gen(3, { ...params, verdict: 'safe' }));
    expect(c.verdict).toBe('safe');
    expect(c.data.from.address.endsWith('@kirimcepat.test')).toBe(true);
    expect(c.evidence.required).toEqual([]);
  });

  it('rejects invalid params', () => {
    expect(() => gen(1, { brand: 'X', domain: 'asli.com', verdict: 'malicious' })).toThrow();
    expect(() => gen(1, { brand: 'X' })).toThrow();
  });
});

describe('typosquat-domain in English (PRD C4)', () => {
  const genIn = (seed: number, locale: 'id' | 'en', verdict = 'malicious') =>
    typosquatDomain({ ...params, verdict }, createRng(seed), { id: 'gen-1', locale })[0];

  it('only changes human text: same domains, evidence and answers as Indonesian', () => {
    for (const verdict of ['malicious', 'safe'])
      for (let seed = 0; seed < 20; seed++)
        expect(checkLocaleParity(genIn(seed, 'id', verdict), genIn(seed, 'en', verdict))).toEqual(
          [],
        );
  });

  it('writes the English text', () => {
    const c = emailCaseSchema.parse(genIn(1, 'en'));
    expect(c.data.body[0]).toMatchObject({ text: 'Dear Customer,' });
    expect(c.explanation).toMatch(/only looks like kirimcepat\.test/);
    expect(emailCaseSchema.parse(genIn(1, 'en', 'safe')).data.body[0]).toMatchObject({
      text: expect.stringMatching(/^Hello /),
    });
  });
});
