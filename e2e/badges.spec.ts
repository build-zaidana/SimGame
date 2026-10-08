import { expect, test } from '@playwright/test';
import { answerReview, decideAll, startShift } from './helpers.ts';

test('finishing Shift 1 earns badges, shown in the office and the badge screen', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await expect(page.getByRole('button', { name: 'Lencana (0/38)' })).toBeVisible();

  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'right');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();

  const banner = page.getByTestId('new-badges');
  await expect(banner).toContainText('Lencana baru!');
  await expect(banner).toContainText('Hari Pertama');
  await expect(banner).toContainText('Murid Teladan');
  // Semua kasus diizinkan → ancaman lolos, jadi "Tanpa Celah" tidak didapat.
  await expect(banner).not.toContainText('Tanpa Celah');

  await banner.getByRole('button', { name: 'Lihat lencana' }).click();
  await expect(page.getByTestId('badge-count')).toHaveText('2 dari 11 lencana');
  await expect(page.locator('[data-badge="hari-pertama"]')).toHaveAttribute('data-earned', 'true');
  await expect(page.locator('[data-badge="tanpa-celah"]')).toHaveAttribute('data-earned', 'false');
  await expect(page.locator('[data-badge="tanpa-celah"]')).toContainText('Belum didapat');

  // Kembali ke kantor: banner masih ada sampai ditutup.
  await page.getByRole('button', { name: 'Kembali' }).click();
  await page.getByTestId('new-badges').getByRole('button', { name: 'Tutup' }).click();
  await expect(page.getByTestId('new-badges')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lencana (2/38)' })).toBeVisible();
});
