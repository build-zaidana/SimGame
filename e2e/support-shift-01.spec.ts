import { expect, test } from '@playwright/test';
import { answerReview, decideAll, openNextCase, startShift } from './helpers.ts';

test('Bengkel IT shift 1 can be played through the report and review', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(
    page,
    'Mulai Shift 1: Hari Pertama di Bengkel',
    'Shift 1 · Hari Pertama di Bengkel',
  );

  // Kasus pertama: Caps Lock menyala → cukup arahkan pengguna.
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-ticket-001');
  const capsLock = page.locator('[data-evidence="desc-capslock"]');
  await capsLock.click();
  await expect(capsLock).toHaveAttribute('aria-pressed', 'true');
  // Ganti Komponen baru terbuka di shift 2.
  await expect(page.locator('[data-decision="replace"]')).toHaveCount(0);
  await page.locator('[data-decision="guide"]').click();
  const feedback = page.getByRole('dialog');
  await expect(feedback.getByRole('heading', { name: 'Tepat!' })).toBeVisible();
  await expect(feedback.getByText('SLIP BENGKEL IT', { exact: false })).toBeVisible();
  await feedback.getByRole('button', { name: 'Lanjut' }).click();

  await decideAll(page, 7, 'fix');

  await expect(
    page.getByRole('heading', { name: 'Laporan Shift 1 · Hari Pertama di Bengkel' }),
  ).toBeVisible();
  await expect(page.getByText('Keputusan tepat: 5 dari 8')).toBeVisible();

  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  const ids = await answerReview(page, 'wrong');
  expect(ids).toHaveLength(3);
  await expect(page.getByTestId('review-score')).toHaveText('0 dari 3 benar');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();
  await expect(page.getByRole('button', { name: 'Mulai Shift 2: Hari Obeng' })).toBeVisible();
});
