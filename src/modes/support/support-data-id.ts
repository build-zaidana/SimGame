/** File konten Bengkel IT (id) — dibundel terpisah per bahasa. */
export const PREFIX = '/content/id/modes/support/';
export const json = import.meta.glob<unknown>('/content/id/modes/support/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/id/modes/support/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
