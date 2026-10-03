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

/**
 * Teks per bahasa. Urutan & jumlah skenario harus sama di semua bahasa (RNG memilih indeks),
 * dan path tautan tidak diterjemahkan, agar kasus identik selain teksnya (paritas, ADR 023).
 */
const TEXT = {
  id: {
    safeSubject: (code: string) => `Status pesanan ${code}`,
    hello: (name: string) => `Halo ${name},`,
    received: (code: string) => `Pesanan ${code} sudah kami terima dan sedang diproses.`,
    noRequest: 'Tidak ada yang perlu kamu bayar atau isi.',
    safeExplanation: (domain: string, brand: string) =>
      `Pengirim dan tautannya memakai domain resmi ${domain}, dan email ini tidak meminta data atau uang. Ini notifikasi biasa dari ${brand}.`,
    safeHint1: 'Cek domain pengirim dan alamat asli tautannya.',
    safeHint2: (brand: string, domain: string) => `Domain resmi ${brand} adalah ${domain}. Cocok?`,
    yearsAgo: (n: number) => `${n} tahun lalu`,
    daysAgo: (n: number) => `${n} hari lalu`,
    scenarios: (code: string) => [
      {
        subject: `Pesanan ${code} tertahan, konfirmasi dalam 2 jam`,
        claim: 'Pesanan Anda tertahan karena alamat tidak lengkap.',
        path: 'konfirmasi',
      },
      {
        subject: 'Akun Anda dinonaktifkan sementara',
        claim: 'Kami mendeteksi login tidak biasa di akun Anda.',
        path: 'aktivasi',
      },
      {
        subject: `Voucher Rp 200.000 untuk Anda (${code})`,
        claim: 'Selamat, Anda terpilih mendapat voucher belanja.',
        path: 'voucher',
      },
    ],
    genericGreeting: 'Yth. Pelanggan,',
    signature: (brand: string) => `Salam, Tim ${brand}`,
    fakeExplanation: (fake: string, domain: string, brand: string) =>
      `Domain ${fake} hanya mirip ${domain}, bukan milik ${brand}. Tautannya pun diam-diam menuju ${fake}.`,
    fakeHint1: (brand: string, domain: string) =>
      `Domain resmi ${brand} adalah ${domain}. Baca alamat pengirim huruf demi huruf.`,
    fakeHint2: 'Tahan tautannya: ke domain mana sebenarnya?',
  },
  en: {
    safeSubject: (code: string) => `Order status ${code}`,
    hello: (name: string) => `Hello ${name},`,
    received: (code: string) => `We have received order ${code} and it is being processed.`,
    noRequest: 'You do not need to pay or fill in anything.',
    safeExplanation: (domain: string, brand: string) =>
      `The sender and the link use the official domain ${domain}, and the email asks for no data or money. It is a normal notice from ${brand}.`,
    safeHint1: "Check the sender's domain and the link's real address.",
    safeHint2: (brand: string, domain: string) =>
      `The official domain of ${brand} is ${domain}. Does it match?`,
    yearsAgo: (n: number) => `${n} years ago`,
    daysAgo: (n: number) => `${n} days ago`,
    scenarios: (code: string) => [
      {
        subject: `Order ${code} on hold, confirm within 2 hours`,
        claim: 'Your order is on hold because the address is incomplete.',
        path: 'konfirmasi',
      },
      {
        subject: 'Your account has been temporarily disabled',
        claim: 'We detected an unusual login on your account.',
        path: 'aktivasi',
      },
      {
        subject: `A Rp 200.000 voucher for you (${code})`,
        claim: 'Congratulations, you have been chosen for a shopping voucher.',
        path: 'voucher',
      },
    ],
    genericGreeting: 'Dear Customer,',
    signature: (brand: string) => `Regards, the ${brand} Team`,
    fakeExplanation: (fake: string, domain: string, brand: string) =>
      `The domain ${fake} only looks like ${domain} and does not belong to ${brand}. The link also secretly goes to ${fake}.`,
    fakeHint1: (brand: string, domain: string) =>
      `The official domain of ${brand} is ${domain}. Read the sender address letter by letter.`,
    fakeHint2: 'Press and hold the link: which domain does it really go to?',
  },
} as const;

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
  ctx: { id: string; locale?: 'id' | 'en' },
): [BaseCase, RngState] {
  const tx = TEXT[ctx.locale ?? 'id'];
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
        subject: { text: tx.safeSubject(code), evidenceId: 'subject' },
        body: [
          { text: tx.hello(recipient), evidenceId: 'greeting' },
          { text: tx.received(code), evidenceId: 'body-info' },
          {
            link: { label: `${domain}/pesanan/${code}`, href: `https://${domain}/pesanan/${code}` },
            evidenceId: 'link',
          },
          { text: tx.noRequest, evidenceId: 'no-request' },
        ],
        attachments: [],
      },
      evidence: { required: [], supporting: ['sender', 'link', 'greeting'] },
      explanation: tx.safeExplanation(domain, brand),
      hints: [tx.safeHint1, tx.safeHint2(brand, domain)],
      intel: { whois: [{ domain, registered: tx.yearsAgo(12), evidenceId: 'whois-age' }] },
    };
    return [c, r.s];
  }

  const fake = `${mutate(label, r)}.test`;
  const ageDays = 1 + Math.floor(roll(r) * 6);
  const scenario = pick(r, tx.scenarios(code));
  const c: EmailCase = {
    ...base,
    verdict: 'malicious',
    correctDecision: 'block',
    acceptableDecisions: { escalate: 0.6 },
    data: {
      from: { name: brand, address: `info@${fake}`, evidenceId: 'sender' },
      subject: { text: scenario.subject, evidenceId: 'urgency' },
      body: [
        { text: tx.genericGreeting, evidenceId: 'generic-greeting' },
        { text: scenario.claim, evidenceId: 'body-claim' },
        {
          link: { label: `${domain}/${scenario.path}`, href: `https://${fake}/${scenario.path}` },
          evidenceId: 'link',
        },
        { text: tx.signature(brand), evidenceId: 'signature' },
      ],
      attachments: [],
    },
    evidence: {
      required: ['sender', 'link'],
      supporting: ['urgency', 'generic-greeting', 'whois-age'],
    },
    explanation: tx.fakeExplanation(fake, domain, brand),
    hints: [tx.fakeHint1(brand, domain), tx.fakeHint2],
    intel: {
      whois: [{ domain: fake, registered: tx.daysAgo(ageDays), evidenceId: 'whois-age' }],
    },
  };
  return [c, r.s];
}
