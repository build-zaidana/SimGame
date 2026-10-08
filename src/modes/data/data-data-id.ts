/** File konten Meja Data (id) — dibundel terpisah per bahasa. */
export const PREFIX = '/content/id/modes/data/';
export const json = import.meta.glob<unknown>('/content/id/modes/data/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/id/modes/data/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
