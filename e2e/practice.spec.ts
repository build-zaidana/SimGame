import { expect, test, type Page } from '@playwright/test';
import { answerReview, decideAll, openNextCase, startShift } from './helpers.ts';

/** Teks progres di kartu Meja SOC (shift selesai · gaji · kepercayaan). */
const progressLine = (page: Page) =>
  page.getByText(/^Shift selesai: \d+ · Gaji: Rp \d+ · Kepercayaan klien: \d+$/).first();

// PRD S5: Mode Latihan mengulang shift yang sudah selesai tanpa memengaruhi progres utama.
test('practice replays a finished shift without changing main progress', async ({ page }) => {
  test.slow();
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await expect(page.getByRole('heading', { name: 'Mode Latihan' })).toBeHidden();

  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'wrong');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();
  const before = await progressLine(page).textContent();
  expect(before).toContain('Shift selesai: 1');

  // Mulai latihan Shift 1, putuskan satu kasus, lalu reload di tengah latihan.
  await startShift(page, 'Latihan Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await expect(page.getByTestId('practice-badge')).toBeVisible();
  await decideAll(page, 1);
  await openNextCase(page);
  const caseId = await page.getByTestId('document').getAttribute('data-case-id');

  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
  await expect(
    page.getByRole('button', { name: 'Mulai Shift 2: Kotak Masuk Penuh' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Lanjutkan latihan Shift 1' }).click();
  await expect(page.getByTestId('practice-badge')).toBeVisible();
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', caseId ?? '');

  // Selesaikan latihan dengan menjawab benar sebanyak mungkin: progres utama tetap tidak berubah.
  await page.locator('[data-decision="block"]').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lanjut' }).click();
  await decideAll(page, 6, 'block');
  await expect(page.getByTestId('practice-banner')).toBeVisible();
  await expect(page.getByText('Gaji shift ini: tidak dibayar (latihan)')).toBeVisible();
  await expect(page.getByTestId('export-reminder')).toBeHidden();
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'wrong');
  await page.getByRole('button', { name: 'Selesai latihan & kembali ke kantor' }).click();

  await expect(progressLine(page)).toHaveText(before ?? '');
  await expect(
    page.getByRole('button', { name: 'Mulai Shift 2: Kotak Masuk Penuh' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Latihan Shift 1: Hari Pertama' })).toBeVisible();
});

test('a practice run can be cancelled from the hub', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'wrong');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();

  await startShift(page, 'Latihan Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
  await page.getByRole('button', { name: 'Batalkan latihan' }).click();
  await expect(page.getByRole('button', { name: 'Lanjutkan latihan Shift 1' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Latihan Shift 1: Hari Pertama' })).toBeVisible();
});
