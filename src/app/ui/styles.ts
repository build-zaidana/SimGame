/** Kelas Tailwind bersama. Target sentuh ≥ 44 px (min-h-11). */
export const btn =
  'inline-flex min-h-11 items-center justify-center gap-2 border-2 border-ink px-4 py-2 font-display ' +
  'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = `${btn} bg-accent text-bg`;
export const btnSecondary = `${btn} bg-panel text-ink`;
export const panel = 'border-2 border-ink/40 bg-panel';
