import { expect, test } from '@playwright/test';
import { openNextCase } from './helpers.ts';

test('the whole game can be played in English, and the choice survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Play' }).click();

  await expect(page.getByRole('heading', { name: 'PT Nusa Digital Office' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Shift 1: First Day' }).click();

  // Morning paper and mentor briefing in English.
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Shift 1 · First Day' })).toBeVisible();
  await expect(page.getByTestId('newspaper')).toContainText('PT Nusa Digital Opens a New SOC Desk');
  while (await dialog.getByRole('button', { name: 'Next' }).isVisible()) {
    await dialog.getByRole('button', { name: 'Next' }).click();
  }
  await dialog.getByRole('button', { name: 'Start shift' }).click();

  await openNextCase(page);
  await expect(page.getByTestId('document')).toContainText('Dear Customer');
  await page.locator('[data-evidence="sender"]').click();
  await page.getByRole('button', { name: /Block/ }).click();
  await expect(page.getByRole('dialog')).toContainText('SOC SLIP');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Continue' })).toBeVisible();

  // Reload: still English, and the shift resumes where it was.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('radio', { name: 'English' })).toBeChecked();

  // Switch back to Indonesian from Settings.
  await page.getByRole('radio', { name: 'Bahasa Indonesia' }).check();
  await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
});
