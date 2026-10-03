// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/** Mode yang dikenal. Mode tidak boleh saling import (ARCHITECTURE §1). */
const MODES = ['soc', 'support', 'dev', 'data'];

/** Import yang hanya boleh di lapisan tertentu, berlaku di semua file src/. */
const GLOBAL_RESTRICTIONS = [
  {
    group: ['phaser', 'phaser/*'],
    message: 'Phaser hanya boleh di src/hub/phaser/ dan di-import dinamis (ARCHITECTURE §10).',
  },
  {
    group: ['idb-keyval'],
    message: 'Akses penyimpanan hanya lewat SaveRepository di src/persistence/.',
  },
];

/** no-restricted-imports tidak memeriksa import() dinamis, jadi ditangkap lewat syntax. */
const dynamicImportBan = (pattern, message) => ({
  selector: `ImportExpression > Literal[value=/${pattern}/]`,
  message,
});
const GLOBAL_SYNTAX = [
  dynamicImportBan('^phaser(\\/|$)', GLOBAL_RESTRICTIONS[0].message),
  dynamicImportBan('^idb-keyval$', GLOBAL_RESTRICTIONS[1].message),
];

const ENGINE_RESTRICTIONS = [
  {
    group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'zustand', 'zustand/*'],
    message: 'engine/ harus TypeScript murni: tanpa React/Zustand.',
  },
  {
    regex: '^(\\.\\./)+(app|modes|hub|persistence|telemetry)(/|$)',
    message: 'engine/ tidak boleh import app/, modes/, hub/, persistence/, atau telemetry/.',
  },
];

const DOM_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'location',
  'fetch',
  'requestAnimationFrame',
  'setTimeout',
  'setInterval',
].map((name) => ({ name, message: 'engine/ tidak boleh memakai DOM/API browser.' }));

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'test-results', 'playwright-report', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'no-restricted-imports': ['error', { patterns: GLOBAL_RESTRICTIONS }],
      'no-restricted-syntax': ['error', ...GLOBAL_SYNTAX],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ['src/hub/phaser/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: GLOBAL_RESTRICTIONS.filter((r) => !r.group.includes('phaser')) },
      ],
      'no-restricted-syntax': ['error', GLOBAL_SYNTAX[1]],
    },
  },
  {
    files: ['src/persistence/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: GLOBAL_RESTRICTIONS.filter((r) => !r.group.includes('idb-keyval')) },
      ],
      'no-restricted-syntax': ['error', GLOBAL_SYNTAX[0]],
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [...GLOBAL_RESTRICTIONS, ...ENGINE_RESTRICTIONS] },
      ],
      'no-restricted-globals': ['error', ...DOM_GLOBALS],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Pakai engine/rng.ts (deterministik).' },
        {
          object: 'Date',
          property: 'now',
          message: 'Waktu masuk lewat action (TICK), bukan Date.now().',
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_SYNTAX,
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'engine/ tidak boleh membaca jam sistem.',
        },
      ],
    },
  },
  ...MODES.map((mode) => ({
    files: [`src/modes/${mode}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...GLOBAL_RESTRICTIONS,
            {
              regex: `(^|/)(${MODES.filter((m) => m !== mode).join('|')})(/|$)`,
              message: `modes/${mode} tidak boleh import mode lain.`,
            },
          ],
        },
      ],
    },
  })),
  {
    files: ['*.{js,ts}', 'scripts/**/*.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
);
