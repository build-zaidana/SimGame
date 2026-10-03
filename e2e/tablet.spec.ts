import { expect, test } from '@playwright/test';
import { startShift } from './helpers.ts';

// ARCHITECTURE §9.2: 768–1023 px → Dokumen + Panduan berdampingan, Antrian jadi laci.
test.use({ viewport: { width: 820, height: 1180 } });

test('tablet layout shows document and rulebook side by side with a queue drawer', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');

  await expect(page.getByRole('tablist')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Buku Panduan SOC' })).toBeVisible();
  const toggle = page.getByRole('button', { name: /^Antrian \(\d+ menunggu\)$/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await page.locator('[data-case]:enabled').first().click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('document')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Buku Panduan SOC' })).toBeVisible();
});
