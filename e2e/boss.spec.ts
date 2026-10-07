import { expect, test } from '@playwright/test';
import { decideAll, openNextCase, startShift } from './helpers.ts';

test('the end-of-shift boss arrives as one wave and is beaten by deciding every boss case right', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 5);

  // Boss datang: banner, bar HP, dan tiga kasus bertanda BOSS di antrian.
  const banner = page.getByTestId('boss-banner');
  await expect(banner).toHaveAttribute('data-status', 'active');
  await expect(banner).toContainText('BOSS DATANG!');
  await expect(banner).toContainText('Gelombang Pancingan');
  // Cerita boss tetap terbaca di atas antrian setelah banner hilang.
  await expect(page.getByTestId('boss-brief')).toContainText('Tiga pesan masuk bersamaan');
  await banner.getByRole('button', { name: 'Tutup' }).click();
  const bar = page.getByTestId('boss-bar');
  await expect(bar).toHaveAttribute('data-hp', '3');
  // Mode Santai: tanpa hitung mundur.
  await expect(page.getByTestId('boss-time')).toHaveCount(0);

  for (const [caseId, decision] of [
    ['s01-email-004', 'block'],
    ['s01-url-003', 'block'],
    ['s01-email-005', 'allow'],
  ] as const) {
    await openNextCase(page);
    await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', caseId);
    await page.locator(`[data-decision="${decision}"]`).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lanjut' }).click();
  }

  await expect(page.getByTestId('boss-result')).toHaveAttribute('data-status', 'defeated');
  await expect(page.getByTestId('boss-result')).toContainText('Bonus +Rp 30');
  await expect(page.getByText(/\+ bonus boss Rp 30\)/)).toBeVisible();
});
