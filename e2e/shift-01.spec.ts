import { expect, test } from '@playwright/test';
import { answerReview, decideAll, openNextCase, startShift } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
});

test('Shift 1 can be played through the report and review', async ({ page }) => {
  // Kasus pertama: tandai bukti yang benar lalu blokir → umpan balik "Tepat!".
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-email-001');
  const sender = page.locator('[data-evidence="sender"]');
  await sender.click();
  await expect(sender).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-evidence="link"]').click({ button: 'right' });
  await expect(page.getByTestId('real-address')).toContainText('akun-aman.test');
  await page.locator('[data-evidence="link"]').click();
  await expect(page.getByTestId('marks-count')).toHaveText('2 bukti ditandai');

  const block = page.locator('[data-decision="block"]');
  expect((await block.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await block.click();
  const feedback = page.getByRole('dialog');
  await expect(feedback.getByRole('heading', { name: 'Tepat!' })).toBeVisible();
  await feedback.getByRole('button', { name: 'Lanjut' }).click();

  await decideAll(page, 7);

  await expect(page.getByRole('heading', { name: 'Laporan Shift 1 · Hari Pertama' })).toBeVisible();
  await expect(page.getByText('Keputusan tepat: 4 dari 8')).toBeVisible();
  await expect(page.getByText(/Nusa Digital punya analis baru/)).toBeVisible();

  // Tautan "Baca lagi" membuka bab terkait, lalu kembali ke laporan.
  await page.getByRole('button', { name: 'Baca lagi: Bab 1 · Tautan' }).first().click();
  await expect(page.getByRole('heading', { name: 'Buku Panduan SOC' })).toBeVisible();
  await expect(page.locator('[data-chapter="ch-url"] details')).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Kembali' }).click();

  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  const ids = await answerReview(page, 'wrong');
  expect(ids).toHaveLength(3);
  await expect(page.getByTestId('review-score')).toHaveText('0 dari 3 benar');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();

  await expect(page.getByText('Shift selesai: 1')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Mulai Shift 2: Kotak Masuk Penuh' }),
  ).toBeVisible();
});

test('mentor hints are tiered and shown in the document pane', async ({ page }) => {
  await openNextCase(page);
  const ask = page.getByTestId('ask-mentor');
  await expect(page.getByText('Petunjuk pertama gratis.')).toBeVisible();
  await ask.click();
  await expect(page.getByText(/Petunjuk 1 dari 2/)).toBeVisible();
  await ask.click();
  await expect(page.getByText(/Petunjuk 2 dari 2/)).toBeVisible();
  await expect(ask).toBeDisabled();
});

test('reloading mid-shift resumes the same case with its marks', async ({ page }) => {
  await openNextCase(page);
  const caseId = await page.getByTestId('document').getAttribute('data-case-id');
  await page.locator('[data-evidence="sender"]').click();
  await expect(page.locator('[data-evidence="sender"]')).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
  await page.getByRole('button', { name: 'Lanjutkan Shift 1' }).click();

  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', caseId ?? '');
  await expect(page.locator('[data-evidence="sender"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('dialog')).toBeHidden();
});
