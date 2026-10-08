/** File konten Meja Data (en) — dibundel terpisah per bahasa. */
export const PREFIX = '/content/en/modes/data/';
export const json = import.meta.glob<unknown>('/content/en/modes/data/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/en/modes/data/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
