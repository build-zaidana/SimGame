/** File konten SOC Bahasa Indonesia (dibundel terpisah per bahasa). */
export const PREFIX = '/content/id/modes/soc/';
export const json = import.meta.glob<unknown>('/content/id/modes/soc/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/id/modes/soc/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
