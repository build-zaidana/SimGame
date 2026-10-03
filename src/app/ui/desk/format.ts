const SHIFT_START_MINUTES = 9 * 60;

/** Jam in-game, mulai 09:00. */
export function formatClock(elapsedMs: number, msPerGameMinute: number): string {
  const total = SHIFT_START_MINUTES + Math.floor(elapsedMs / msPerGameMinute);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Teks yang tampil untuk sebuah bukti (untuk umpan balik). */
export function evidenceText(data: unknown, evidenceId: string): string | null {
  if (Array.isArray(data)) {
    for (const x of data) {
      const found = evidenceText(x, evidenceId);
      if (found) return found;
    }
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o['evidenceId'] === evidenceId) {
    const link = o['link'] as { label?: unknown } | undefined;
    for (const v of [o['text'], link?.label, o['address'], o['name']]) {
      if (typeof v === 'string') return v;
    }
  }
  for (const v of Object.values(o)) {
    const found = evidenceText(v, evidenceId);
    if (found) return found;
  }
  return null;
}
