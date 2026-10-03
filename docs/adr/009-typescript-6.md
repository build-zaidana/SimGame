# ADR 009 — TypeScript 6.x, bukan 7.x

- Status: diterima · 2 Oktober 2026 · M0

## Konteks

TypeScript 7.0 (kompiler native) sudah rilis, tetapi `typescript-eslint` 8.x menolak berjalan dengan TS 7.0
("typescript-eslint does not support TS 7.0"). Lint dengan aturan lapisan (ARCHITECTURE §1, §12) wajib di `pnpm check`.

## Keputusan

Pin `typescript@^6` di devDependencies. Semua opsi `tsconfig` (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`) tetap sama.

## Konsekuensi

- Typecheck sedikit lebih lambat dibanding TS 7; tidak berarti untuk ukuran repo ini.
- Naik ke TS 7 setelah `typescript-eslint` mendukungnya (lacak typescript-eslint/typescript-eslint#10940).
