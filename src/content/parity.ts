/**
 * Paritas antarbahasa (ADR 023): terjemahan hanya boleh mengubah teks manusia. Struktur, angka,
 * dan nilai di kunci "terkunci" (ID, jawaban, bukti, alamat) harus identik dengan bahasa dasar.
 */
const LOCKED_KEYS = new Set([
  'id',
  'type',
  'mode',
  'verdict',
  'correctDecision',
  'conceptId',
  'conceptIds',
  'ruleRefs',
  'evidenceId',
  'evidenceTags',
  'required',
  'supporting',
  'answer',
  'caseId',
  'generator',
  'brand',
  'domain',
  'href',
  'address',
  'ip',
  'time',
  'receivedAt',
  'speaker',
  'introDialogue',
  'outroDialogue',
  'unlocksChapters',
  'shiftId',
  'tier',
  'icon',
  'pre',
  'post',
]);

const show = (v: unknown) => JSON.stringify(v);

export function checkLocaleParity(base: unknown, other: unknown): string[] {
  const out: string[] = [];
  const walk = (a: unknown, b: unknown, path: string, locked: boolean) => {
    const at = path || '(akar)';
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return void out.push(`${at}: bukan array`);
      if (a.length !== b.length) return void out.push(`${at}: panjang ${a.length} ≠ ${b.length}`);
      a.forEach((x, i) => walk(x, b[i], `${path}[${i}]`, locked));
      return;
    }
    if (a && typeof a === 'object') {
      if (!b || typeof b !== 'object' || Array.isArray(b))
        return void out.push(`${at}: bukan objek`);
      const ao = a as Record<string, unknown>;
      const bo = b as Record<string, unknown>;
      const keys = [...new Set([...Object.keys(ao), ...Object.keys(bo)])].sort();
      for (const k of keys) {
        const p = path ? `${path}.${k}` : k;
        if (!(k in bo)) out.push(`${p}: tidak ada di terjemahan`);
        else if (!(k in ao)) out.push(`${p}: tidak ada di bahasa dasar`);
        else walk(ao[k], bo[k], p, locked || LOCKED_KEYS.has(k));
      }
      return;
    }
    if (typeof a === 'string' && typeof b === 'string' && !locked) return;
    if (a !== b) out.push(`${at}: ${show(a)} ≠ ${show(b)}`);
  };
  walk(base, other, '', false);
  return out;
}
