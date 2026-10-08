import { expect, test, type Page } from '@playwright/test';
import { openNextCase, startShift } from './helpers.ts';

async function startDataShift(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(
    page,
    'Mulai Shift 1: Hari Pertama di Meja Data',
    'Shift 1 · Hari Pertama di Meja Data',
  );
}

async function submitAndContinue(page: Page, decision: string, heading: string | RegExp) {
  await page.locator(`[data-decision="${decision}"]`).click();
  const feedback = page.getByRole('dialog');
  await expect(feedback.getByRole('heading', { name: heading })).toBeVisible();
  await feedback.getByRole('button', { name: 'Lanjut' }).click();
}

test('Data desk: write real SQL checked on hidden data, and catch a misleading chart', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await startDataShift(page);

  // Tugas SQL pertama: hasil dicek di data contoh dan data uji tersembunyi.
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-q-001');
  const submit = page.locator('[data-decision="submit"]');
  await expect(submit).toBeDisabled();
  const editor = page.getByTestId('sql-editor');

  // Error SQLite tampil dengan petunjuk ramah, game tetap jalan.
  await editor.fill('SELEC nama FROM pelanggan');
  await page.getByTestId('run-query').click();
  await expect(page.getByTestId('sql-error')).toContainText('syntax error', { timeout: 15_000 });

  // Menghafal hasil data contoh lulus di data contoh, tapi gagal di data tersembunyi.
  await editor.fill(
    "SELECT nama FROM pelanggan WHERE nama IN ('Ayu Lestari', 'Citra Dewi', 'Fajar Nugroho')",
  );
  await page.getByTestId('run-query').click();
  await expect(page.getByTestId('query-summary')).toHaveText('1 dari 2 set data cocok');
  await expect(page.locator('[data-hidden-passed="false"]')).toHaveCount(1);

  // Query yang benar: semua set data cocok, tombol kirim aktif.
  await editor.fill('');
  await editor.fill("SELECT nama FROM pelanggan WHERE kota = 'Bandung'");
  await page.getByTestId('run-query').click();
  await expect(page.getByTestId('query-summary')).toContainText('SEMUA DATA COCOK');
  await expect(page.getByTestId('query-expected')).toContainText('Citra Dewi');
  await expect(submit).toBeEnabled();
  await submitAndContinue(page, 'submit', /Tepat|Hampir/);

  // Grafik dengan sumbu terpotong: tandai bukti lalu minta revisi.
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-chart-001');
  await expect(page.getByTestId('chart')).toBeVisible();
  await expect(page.locator('[data-decision="submit"]')).toHaveCount(0);
  for (const ev of ['axis', 'claim-jump']) {
    const el = page.locator(`[data-evidence="${ev}"]`);
    await el.click();
    await expect(el).toHaveAttribute('aria-pressed', 'true');
  }
  await submitAndContinue(page, 'revise', 'Tepat!');
});
