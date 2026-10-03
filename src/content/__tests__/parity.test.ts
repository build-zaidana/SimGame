import { describe, expect, it } from 'vitest';
import { checkLocaleParity } from '../parity.ts';

const base = {
  id: 'c-1',
  verdict: 'malicious',
  severity: 2,
  data: { from: { name: 'Bank Nusantara', address: 'a@b.test', evidenceId: 'sender' } },
  explanation: 'Penjelasan.',
  evidence: { required: ['sender'], supporting: [] },
};

describe('checkLocaleParity', () => {
  it('accepts a translation that only changes human text', () => {
    const en = {
      ...base,
      explanation: 'Explanation.',
      data: { from: { ...base.data.from, name: 'Bank Nusantara Team' } },
    };
    expect(checkLocaleParity(base, en)).toEqual([]);
  });

  it('rejects changed answers, evidence ids, addresses and numbers', () => {
    const en = {
      ...base,
      verdict: 'safe',
      severity: 3,
      data: { from: { name: 'x', address: 'a@c.test', evidenceId: 'from' } },
      evidence: { required: ['from'], supporting: [] },
    };
    expect(checkLocaleParity(base, en)).toEqual([
      'data.from.address: "a@b.test" ≠ "a@c.test"',
      'data.from.evidenceId: "sender" ≠ "from"',
      'evidence.required[0]: "sender" ≠ "from"',
      'severity: 2 ≠ 3',
      'verdict: "malicious" ≠ "safe"',
    ]);
  });

  it('rejects missing or extra keys and different array lengths', () => {
    const en = { ...base, extra: 1, evidence: { required: [], supporting: [] } } as Record<
      string,
      unknown
    >;
    delete en['explanation'];
    expect(checkLocaleParity(base, en)).toEqual([
      'evidence.required: panjang 1 ≠ 0',
      'explanation: tidak ada di terjemahan',
      'extra: tidak ada di bahasa dasar',
    ]);
  });
});
