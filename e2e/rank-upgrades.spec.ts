import { expect, test } from '@playwright/test';
import { answerReview, decideAll, openNextCase, startShift } from './helpers.ts';

test('finishing a shift promotes the player, and desk upgrades can be bought by rank', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await expect(page.getByTestId('rank').first()).toContainText('Pangkat: Analis SOC Magang');

  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  // Laporan shift merayakan kenaikan pangkat pertama.
  await expect(page.getByTestId('rank-up')).toContainText(
    'Naik pangkat! Kamu sekarang Analis SOC Junior',
  );
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'right');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();
  await expect(page.getByTestId('rank').first()).toContainText(
    'Pangkat: Analis SOC Junior · 2 shift lagi menuju Analis SOC',
  );

  await page.getByRole('button', { name: 'Toko & Upgrade' }).click();
  await expect(page.getByTestId('wallet')).toHaveText('Gajimu: Rp 76');
  // Monitor kedua butuh pangkat yang lebih tinggi.
  await expect(page.locator('[data-upgrade="monitor"]')).toContainText(
    'Terbuka di pangkat Analis SOC',
  );
  await page.getByRole('button', { name: 'Beli Tanaman meja (Rp 30)' }).click();
  await expect(page.getByTestId('wallet')).toHaveText('Gajimu: Rp 46');
  await expect(page.locator('[data-upgrade="plant"]')).toContainText('Sudah dimiliki');
  await page.getByRole('button', { name: 'Kembali' }).click();

  // Barang yang dibeli dipajang di meja.
  await startShift(page, 'Mulai Shift 2: Kotak Masuk Penuh', 'Shift 2 · Kotak Masuk Penuh');
  await openNextCase(page);
  await expect(page.getByTestId('desk-items')).toContainText('Tanaman meja');
});
