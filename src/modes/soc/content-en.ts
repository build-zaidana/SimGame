/** File konten SOC bahasa Inggris (dibundel terpisah per bahasa). */
export const PREFIX = '/content/en/modes/soc/';
export const json = import.meta.glob<unknown>('/content/en/modes/soc/**/*.json', {
  eager: true,
  import: 'default',
});
export const md = import.meta.glob<string>('/content/en/modes/soc/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});
