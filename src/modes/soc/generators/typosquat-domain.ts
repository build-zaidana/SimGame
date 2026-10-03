/**
 * Generator email dengan domain tiruan (typosquatting) dari merek FIKTIF di params.
 * Hanya memodifikasi domain `.test` yang diberikan, jadi hasilnya selalu domain dicadangkan.
 */
import { z } from 'zod';
import type { BaseCase } from '../../../content/schemas.ts';
import { nextFloat, nextInt, type RngState } from '../../../engine/rng.ts';
import type { EmailCase } from '../caseTypes/email/schema.ts';

const paramsSchema = z.strictObject({
  brand: z.string().trim().min(1),
  domain: z.string().regex(/^[a-z0-9-]+\.test$/, 'domain harus berakhiran .test'),
  verdict: z.enum(['malicious', 'safe']),
});

const RECIPIENTS = ['Rina', 'Andi', 'Sari', 'Budi', 'Maya', 'Yogi'];
const SUFFIXES = ['id', 'resmi', 'layanan', 'bantuan'];
const PREFIXES = ['akun', 'info', 'promo'];

type Rng = { s: RngState };
const pick = <T>(r: Rng, xs: readonly T[]): T => {
  const [i, s] = nextInt(r.s, 0, xs.length - 1);
  r.s = s;
  return xs[i] as T;
};
const roll = (r: Rng) => {
  const [f, s] = nextFloat(r.s);
  r.s = s;
  return f;
};

/** Teknik umum typosquatting: huruf mirip, huruf hilang/dobel, tambahan kata. */
function mutate(label: string, r: Rng): string {
  const techniques: ((l: string) => string | null)[] = [
    (l) => (l.includes('i') ? l.replace('i', 'l') : null),
    (l) => (l.includes('o') ? l.replace('o', '0') : null),
    (l) => (l.includes('m') ? l.replace('m', 'rn') : null),
    (l) => {
      if (l.length < 5) return null;
      const i = 1 + Math.floor(roll(r) * (l.length - 2));
      return l.slice(0, i) + l.slice(i + 1);
    },
    (l) => {
      const i = Math.floor(roll(r) * l.length);
      return l.slice(0, i + 1) + l[i] + l.slice(i + 1);
    },
    (l) => `${l}-${pick(r, SUFFIXES)}`,
    (l) => `${pick(r, PREFIXES)}-${l}`,
  ];
  for (let attempt = 0; attempt < 10; attempt++) {
    const out = pick(r, techniques)(label);
    if (out && out !== label && /^[a-z0-9-]+$/.test(out)) return out;
  }
  return `${label}-${pick(r, SUFFIXES)}`;
}

export function typosquatDomain(
  rawParams: Record<string, unknown>,
  rng: RngState,
  ctx: { id: string },
): [BaseCase, RngState] {
  const { brand, domain, verdict } = paramsSchema.parse(rawParams);
  const r: Rng = { s: rng };
  const label = domain.replace(/\.test$/, '');
  const code = `NC${1000 + Math.floor(roll(r) * 9000)}`;
  const recipient = pick(r, RECIPIENTS);
  const base = {
    id: ctx.id,
    type: 'email' as const,
    conceptIds: ['phishing-signs', 'url-anatomy'],
    difficulty: 2 as const,
    acceptableDecisions: {} as Record<string, number>,
    severity: 2 as const,
    ruleRefs: ['r-phish-1', 'r-url-3'],
  };

  if (verdict === 'safe') {
    const c: EmailCase = {
      ...base,
      verdict: 'safe',
      correctDecision: 'allow',
      data: {
        from: { name: brand, address: `info@${domain}`, evidenceId: 'sender' },
        subject: { text: `Status pesanan ${code}`, evidenceId: 'subject' },
        body: [
          { text: `Halo ${recipient},`, evidenceId: 'greeting' },
          {
            text: `Pesanan ${code} sudah kami terima dan sedang diproses.`,
            evidenceId: 'body-info',
          },
          {
            link: { label: `${domain}/pesanan/${code}`, href: `https://${domain}/pesanan/${code}` },
            evidenceId: 'link',
          },
          { text: 'Tidak ada yang perlu kamu bayar atau isi.', evidenceId: 'no-request' },
        ],
        attachments: [],
      },
      evidence: { required: [], supporting: ['sender', 'link', 'greeting'] },
      explanation: `Pengirim dan tautannya memakai domain resmi ${domain}, dan email ini tidak meminta data atau uang. Ini notifikasi biasa dari ${brand}.`,
      hints: [
        'Cek domain pengirim dan alamat asli tautannya.',
        `Domain resmi ${brand} adalah ${domain}. Cocok?`,
      ],
      intel: { whois: [{ domain, registered: '12 tahun lalu', evidenceId: 'whois-age' }] },
    };
    return [c, r.s];
  }

  const fake = `${mutate(label, r)}.test`;
  const ageDays = 1 + Math.floor(roll(r) * 6);
  const scenario = pick(r, [
    {
      subject: `Pesanan ${code} tertahan, konfirmasi dalam 2 jam`,
      claim: 'Pesanan Anda tertahan karena alamat tidak lengkap.',
      cta: 'Konfirmasi alamat',
      path: 'konfirmasi',
    },
    {
      subject: 'Akun Anda dinonaktifkan sementara',
      claim: 'Kami mendeteksi login tidak biasa di akun Anda.',
      cta: 'Aktifkan kembali',
      path: 'aktivasi',
    },
    {
      subject: `Voucher Rp 200.000 untuk Anda (${code})`,
      claim: 'Selamat, Anda terpilih mendapat voucher belanja.',
      cta: 'Klaim voucher',
      path: 'voucher',
    },
  ]);
  const c: EmailCase = {
    ...base,
    verdict: 'malicious',
    correctDecision: 'block',
    acceptableDecisions: { escalate: 0.6 },
    data: {
      from: { name: brand, address: `info@${fake}`, evidenceId: 'sender' },
      subject: { text: scenario.subject, evidenceId: 'urgency' },
      body: [
        { text: 'Yth. Pelanggan,', evidenceId: 'generic-greeting' },
        { text: scenario.claim, evidenceId: 'body-claim' },
        {
          link: { label: `${domain}/${scenario.path}`, href: `https://${fake}/${scenario.path}` },
          evidenceId: 'link',
        },
        { text: `Salam, Tim ${brand}`, evidenceId: 'signature' },
      ],
      attachments: [],
    },
    evidence: {
      required: ['sender', 'link'],
      supporting: ['urgency', 'generic-greeting', 'whois-age'],
    },
    explanation: `Domain ${fake} hanya mirip ${domain}, bukan milik ${brand}. Tautannya pun diam-diam menuju ${fake}.`,
    hints: [
      `Domain resmi ${brand} adalah ${domain}. Baca alamat pengirim huruf demi huruf.`,
      'Tahan tautannya: ke domain mana sebenarnya?',
    ],
    intel: {
      whois: [{ domain: fake, registered: `${ageDays} hari lalu`, evidenceId: 'whois-age' }],
    },
  };
  return [c, r.s];
}
