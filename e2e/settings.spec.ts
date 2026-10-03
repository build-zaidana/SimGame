import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
});

test('settings change text size and motion, and persist after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Pengaturan' }).click();
  await page.getByRole('radio', { name: 'Sangat besar' }).check();
  await page.getByRole('checkbox', { name: 'Kurangi animasi' }).check();
  await page.getByRole('radio', { name: /^Normal: kasus/ }).check();

  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-reduce-motion', 'true');
  await expect(html).toHaveAttribute('style', /--text-scale: 1.3/);

  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
  await page.getByRole('button', { name: 'Pengaturan' }).click();
  await expect(page.getByRole('radio', { name: 'Sangat besar' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Kurangi animasi' })).toBeChecked();
  await expect(page.getByRole('radio', { name: /^Normal: kasus/ })).toBeChecked();
});

test('the hidden learning report opens after tapping the logo 5 times', async ({ page }) => {
  await page.getByRole('button', { name: 'Pindah Save' }).click(); // mencatat event save_exported
  await page.getByRole('button', { name: 'Kembali' }).click();
  await page.goto('/');
  const logo = page.getByTestId('logo');
  await expect(page.getByRole('button', { name: 'Main' })).toBeEnabled();
  for (let i = 0; i < 5; i++) await logo.click();
  await expect(page.getByRole('heading', { name: 'Laporan Belajar (uji main)' })).toBeVisible();
  await expect(page.getByTestId('learning-summary')).toContainText(/event tercatat/);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor JSON' }).click();
  expect((await download).suggestedFilename()).toMatch(/^shiftit-laporan-belajar-.*\.json$/);
});
