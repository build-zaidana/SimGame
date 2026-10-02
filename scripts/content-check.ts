/**
 * Validator konten (ARCHITECTURE §5.6). Di M0 baru memeriksa struktur folder dan JSON yang valid;
 * skema zod, referensi silang, rasio kasus aman, batas kata, dan denylist merek menyusul di M1.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'content');
const errors: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(ROOT);
for (const file of files.filter((f) => f.endsWith('.json'))) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${relative(ROOT, file)}: JSON tidak valid (${(e as Error).message})`);
  }
}

if (errors.length > 0) {
  console.error(`content:check gagal (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`content:check OK (${files.length} file diperiksa)`);
