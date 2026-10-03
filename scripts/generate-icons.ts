/**
 * Membuat ikon PNG PWA dari public/icons/icon.svg dengan Chromium milik Playwright.
 * Jalankan manual setelah mengubah ikon: `node --experimental-strip-types scripts/generate-icons.ts`.
 * Hasilnya di-commit (tidak dijalankan saat build).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const dir = join(import.meta.dirname, '..', 'public', 'icons');
const svg = readFileSync(join(dir, 'icon.svg'), 'utf8');
const targets = [
  { file: 'icon-192.png', size: 192, padding: 0 },
  { file: 'icon-512.png', size: 512, padding: 0 },
  // Maskable: logo di zona aman 80% tengah.
  { file: 'icon-maskable-512.png', size: 512, padding: 0.1 },
  { file: 'apple-touch-icon.png', size: 180, padding: 0 },
];

const executablePath = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'];
const browser = await chromium.launch(executablePath ? { executablePath } : {});
for (const { file, size, padding } of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - 2 * padding));
  await page.setContent(
    `<body style="margin:0;background:#161a24;display:grid;place-items:center;height:100vh">
       <div style="width:${inner}px;height:${inner}px;image-rendering:pixelated">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
     </body>`,
  );
  await page.screenshot({ path: join(dir, file), omitBackground: false });
  await page.close();
  console.log(`✓ ${file}`);
}
await browser.close();
