/**
 * Ekspor/impor save (ARCHITECTURE §7.3):
 *   SaveData → JSON → gzip → base64url → "SHIFTIT1." + jenis + payload + "." + sha256(payload)[0..8]
 * Jenis "z" = gzip, "j" = JSON tanpa kompresi (fallback bila CompressionStream tidak ada).
 * Checksum hanya mendeteksi kode terpotong/salah salin, bukan anti-cheat.
 */
import { migrate, SaveFormatError } from './migrations.ts';
import type { SaveData } from './saveSchema.ts';

const PREFIX = 'SHIFTIT1';
export const MAX_IMPORT_BYTES = 512 * 1024;
export const FILE_EXTENSION = '.shiftit';

export type TransferErrorCode =
  'too-large' | 'bad-format' | 'bad-checksum' | 'corrupt' | 'invalid-save' | 'newer-version';

export class TransferError extends Error {
  readonly code: TransferErrorCode;
  constructor(code: TransferErrorCode, message: string = code) {
    super(message);
    this.name = 'TransferError';
    this.code = code;
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new TransferError('bad-format');
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(stream as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

async function checksum(payload: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest).slice(0, 4), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

const canCompress = () =>
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export async function encodeSave(
  data: SaveData,
  opts: { compress?: boolean } = {},
): Promise<string> {
  return encodeJson(data, opts);
}

/** Mengodekan nilai JSON apa pun (dipakai encodeSave; diekspor untuk test format & migrasi). */
export async function encodeJson(
  value: unknown,
  opts: { compress?: boolean } = {},
): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value));
  const compress = (opts.compress ?? true) && canCompress();
  const payload = compress
    ? 'z' + toBase64Url(await pipe(json, new CompressionStream('gzip')))
    : 'j' + toBase64Url(json);
  return `${PREFIX}.${payload}.${await checksum(payload)}`;
}

/** Validasi bertahap: ukuran → format → checksum → dekompresi → JSON → migrasi → zod. */
export async function decodeSave(input: string): Promise<SaveData> {
  if (input.length > MAX_IMPORT_BYTES) throw new TransferError('too-large');
  const text = input.replace(/\s+/g, '');
  const parts = text.split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) throw new TransferError('bad-format');
  const [, payload = '', sum = ''] = parts;
  const kind = payload[0];
  if ((kind !== 'z' && kind !== 'j') || !/^[0-9a-f]{8}$/.test(sum))
    throw new TransferError('bad-format');
  if ((await checksum(payload)) !== sum) throw new TransferError('bad-checksum');

  let raw: unknown;
  try {
    let bytes = fromBase64Url(payload.slice(1));
    if (kind === 'z') {
      if (!canCompress()) throw new TransferError('corrupt', 'browser tidak mendukung dekompresi');
      bytes = await pipe(bytes, new DecompressionStream('gzip'));
    }
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    if (e instanceof TransferError) throw e;
    throw new TransferError('corrupt');
  }
  try {
    return migrate(raw);
  } catch (e) {
    if (e instanceof SaveFormatError && e.code === 'newer-version')
      throw new TransferError('newer-version');
    throw new TransferError('invalid-save', e instanceof Error ? e.message : String(e));
  }
}

export interface SaveSummary {
  shiftsCompleted: number;
  stars: number;
  wallet: number;
  updatedAt: string;
}

export function summarizeSave(data: SaveData): SaveSummary {
  const modes = Object.values(data.modes);
  const shifts = modes.flatMap((m) => Object.values(m.shifts));
  return {
    shiftsCompleted: shifts.length,
    stars: shifts.reduce((a, s) => a + s.stars, 0),
    wallet: modes.reduce((a, m) => a + m.wallet, 0),
    updatedAt: data.updatedAt,
  };
}
