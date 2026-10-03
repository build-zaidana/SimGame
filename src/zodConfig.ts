import { z } from 'zod';

/**
 * Tanpa JIT: zod tidak mencoba `new Function`, yang diblokir CSP produksi (`script-src 'self'`)
 * dan memicu laporan pelanggaran. Diimpor pertama di main.tsx, sebelum skema mana pun dipakai.
 */
z.config({ jitless: true });
