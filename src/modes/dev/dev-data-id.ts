/** File konten Meja Developer (id) — dibundel terpisah per bahasa. */
export const PREFIX = '/content/id/modes/dev/';
export const json = import.meta.glob<unknown>('/content/id/modes/dev/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/id/modes/dev/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
