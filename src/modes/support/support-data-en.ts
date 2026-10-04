/** File konten Bengkel IT (en) — dibundel terpisah per bahasa. */
export const PREFIX = '/content/en/modes/support/';
export const json = import.meta.glob<unknown>('/content/en/modes/support/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/en/modes/support/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
