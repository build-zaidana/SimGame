import { id as idStrings, type Strings as IdStrings } from './id.ts';

/**
 * Bahasa aktif (PRD C4, ADR 023). `t` adalah *live binding*: setelah `setLocale`, setiap modul yang
 * mengimpor `t` membaca kamus baru. Kamus selain bahasa Indonesia dimuat terpisah (lazy).
 */
export const LOCALES = ['id', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Bentuk kamus tanpa tipe literal, agar terjemahan lain bisa memenuhinya. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : T;
export type Strings = Widen<IdStrings>;

export let t: Strings = idStrings;
export let locale: Locale = 'id';

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/** Format tanggal sesuai bahasa aktif. */
export const intlLocale = () => (locale === 'en' ? 'en-GB' : 'id-ID');

export async function setLocale(next: Locale): Promise<void> {
  t = next === 'en' ? (await import('./en.ts')).en : idStrings;
  locale = next;
}
