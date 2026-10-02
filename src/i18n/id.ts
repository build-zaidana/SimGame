/** Semua string UI (Bahasa Indonesia). Komponen tidak boleh menulis teks langsung. */
export const id = {
  app: {
    name: 'ShiftIT',
    tagline: 'Satu shift. Satu meja. Kerja IT sungguhan.',
  },
  title: {
    play: 'Main',
    comingSoon: 'Sedang dibangun. Meja SOC segera dibuka.',
  },
} as const;

export type Strings = typeof id;
