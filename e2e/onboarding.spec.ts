import { expect, test } from '@playwright/test';
import { answerReview, decideAll, startShift } from './helpers.ts';

test('new players get one tip at a time, and tips can be skipped and restored', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  const tip = page.getByTestId('tip-card');
  await expect(tip).toHaveAttribute('data-tip', 'welcome');
  await tip.getByRole('button', { name: 'Mengerti' }).click();
  await expect(tip).toBeHidden();

  // Tips yang sudah dilihat tetap tersimpan setelah halaman dimuat ulang.
  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
  await expect(
    page.getByRole('button', { name: 'Mulai Shift 1: Hari Pertama', exact: true }),
  ).toBeVisible();
  await expect(tip).toBeHidden();

  // Setelah shift pertama: tips pangkat muncul, lalu tips berikutnya satu per satu.
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'right');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();
  await expect(tip).toHaveAttribute('data-tip', 'rank');
  await tip.getByRole('button', { name: 'Mengerti' }).click();
  await expect(tip).toHaveAttribute('data-tip', 'daily');
  await tip.getByRole('button', { name: 'Lewati semua tips' }).click();
  await expect(tip).toBeHidden();

  // Pengaturan bisa memunculkan tips lagi.
  await page.getByRole('button', { name: 'Pengaturan' }).click();
  await page.getByRole('button', { name: 'Tampilkan tips lagi' }).click();
  await expect(page.getByText('Tips akan muncul lagi di kantor.')).toBeVisible();
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(tip).toHaveAttribute('data-tip', 'welcome');
});
