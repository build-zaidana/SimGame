/** File konten Meja Developer (en) — dibundel terpisah per bahasa. */
export const PREFIX = '/content/en/modes/dev/';
export const json = import.meta.glob<unknown>('/content/en/modes/dev/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/en/modes/dev/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
