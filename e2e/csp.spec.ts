import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { openNextCase, startShift } from './helpers.ts';

/** CSP produksi diambil dari public/_headers supaya test & deploy tidak bisa berbeda. */
const CSP = /Content-Security-Policy: (.+)/.exec(
  readFileSync(join(import.meta.dirname, '..', 'public', '_headers'), 'utf8'),
)?.[1];

test('the game works under the production Content-Security-Policy', async ({ page }) => {
  expect(CSP).toBeTruthy();
  await page.route('**/*', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': CSP ?? '' },
    });
  });
  await page.addInitScript({
    content: `window.__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__csp.push(e.violatedDirective + ' ' + e.blockedURI);
      });`,
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await openNextCase(page);
  await page.locator('[data-evidence="sender"]').click();
  await page.locator('[data-decision="block"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const violations = await page.evaluate<string[]>('window.__csp');
  expect(violations).toEqual([]);
});
