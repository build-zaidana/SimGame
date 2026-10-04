import { expect, test, type Page } from '@playwright/test';
import { answerReview, decideAll } from './helpers.ts';

async function openBriefing(page: Page, button: string) {
  await page.getByRole('button', { name: button, exact: true }).click();
  const paper = page.getByTestId('newspaper');
  await expect(paper).toBeVisible();
  return paper;
}

async function startFromPaper(page: Page) {
  const dialog = page.getByRole('dialog');
  while (await dialog.getByRole('button', { name: 'Lanjut' }).isVisible()) {
    await dialog.getByRole('button', { name: 'Lanjut' }).click();
  }
  await dialog.getByRole('button', { name: 'Mulai shift' }).click();
  await expect(dialog).toBeHidden();
}

test('the morning paper opens each shift and reports the impact of yesterday', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();

  const first = await openBriefing(page, 'Mulai Shift 1: Hari Pertama');
  await expect(first).toContainText('KABAR NUSA');
  await expect(
    first.getByRole('heading', { name: 'PT Nusa Digital Buka Meja SOC Baru' }),
  ).toBeVisible();
  await expect(first).toContainText('Tips: Baca Domain dari Kanan');
  await expect(page.getByTestId('news-impact')).toHaveCount(0);

  // Mengizinkan semua kasus = ancaman lolos → koran besok membawa kabar buruk.
  await startFromPaper(page);
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'right');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();

  await openBriefing(page, 'Mulai Shift 2: Kotak Masuk Penuh');
  const impact = page.getByTestId('news-impact');
  await expect(impact).toHaveAttribute('data-tier', 'bad');
  await expect(impact).toContainText('kabar buruk');
  await expect(impact).toContainText('beberapa email palsu lolos');
});
