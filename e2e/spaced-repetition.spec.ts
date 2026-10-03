import { expect, test } from '@playwright/test';
import { answerReview, decideAll, startShift } from './helpers.ts';

// M2 ✅: soal yang salah di review Shift 1 muncul lagi di review Shift 2.
test('review items answered wrong in Shift 1 come back in the Shift 2 review', async ({ page }) => {
  test.slow();
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();

  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  const wrongInShift1 = await answerReview(page, 'wrong');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();

  await startShift(page, 'Mulai Shift 2: Kotak Masuk Penuh', 'Shift 2 · Kotak Masuk Penuh');
  await decideAll(page, 10);
  await expect(
    page.getByRole('heading', { name: 'Laporan Shift 2 · Kotak Masuk Penuh' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  const shift2Items = await answerReview(page, 'wrong');

  expect(shift2Items.some((id) => wrongInShift1.includes(id))).toBe(true);
});
