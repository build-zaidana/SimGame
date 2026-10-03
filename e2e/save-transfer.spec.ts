import { devices, expect, test, type Page } from '@playwright/test';
import { decodeSave } from '../src/persistence/transfer.ts';
import { answerReview, decideAll, openNextCase, startShift } from './helpers.ts';

async function finishShift1(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'wrong');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();
  await expect(page.getByText('Shift selesai: 1')).toBeVisible();
}

async function buyLinkChecker(page: Page) {
  await page.getByRole('button', { name: 'Toko Alat' }).click();
  await expect(page.getByTestId('wallet')).toHaveText('Gajimu: Rp 76');
  await page.getByRole('button', { name: 'Beli Pemeriksa Tautan (Rp 50)' }).click();
  await expect(page.getByTestId('wallet')).toHaveText('Gajimu: Rp 26');
  await expect(page.locator('[data-tool="link-checker"]')).toContainText('Sudah dimiliki');
  await page.getByRole('button', { name: 'Kembali' }).click();
}

async function readExportCode(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Pindah Save' }).click();
  const code = page.getByTestId('export-code');
  await expect(code).toHaveValue(/^SHIFTIT1\./);
  return code.inputValue();
}

test('the Link Checker tool shows the real owner of a link automatically', async ({ page }) => {
  await finishShift1(page);
  await buyLinkChecker(page);
  await startShift(page, 'Mulai Shift 2: Kotak Masuk Penuh', 'Shift 2 · Kotak Masuk Penuh');
  await decideAll(page, 1);
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's02-email-002');
  await expect(page.getByTestId('link-owner')).toContainText('nusadlgital.test');
});

// M3 ✅: ekspor di "HP" → impor di "desktop" mempertahankan semua progres.
test('export on a phone, import on a desktop keeps all progress', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'skenario dua perangkat cukup dijalankan sekali');
  test.slow();
  const baseURL = testInfo.project.use.baseURL;
  const contextOpts = baseURL ? { baseURL } : {};

  const phone = await browser.newContext({ ...devices['Pixel 5'], ...contextOpts });
  const phonePage = await phone.newPage();
  await finishShift1(phonePage);
  await buyLinkChecker(phonePage);
  const code = await readExportCode(phonePage);
  await phone.close();

  const desktop = await browser.newContext({ ...devices['Desktop Chrome'], ...contextOpts });
  const page = await desktop.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await expect(page.getByText('Shift selesai: 0')).toBeVisible();

  await page.getByRole('button', { name: 'Pindah Save' }).click();
  await page.getByTestId('import-code').fill(code);
  await page.getByRole('button', { name: 'Periksa kode' }).click();
  await expect(page.getByTestId('import-summary')).toContainText('1 shift selesai');
  await page.getByRole('button', { name: 'Ya, timpa' }).click();

  await expect(page.getByText('Shift selesai: 1')).toBeVisible();
  await expect(page.getByText('Gaji: Rp 26')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Mulai Shift 2: Kotak Masuk Penuh' }),
  ).toBeVisible();

  // Bandingkan seluruh isi save, bukan hanya yang tampil di layar. Reload dulu: data harus dari IndexedDB.
  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
  const desktopCode = await readExportCode(page);
  expect(await decodeSave(desktopCode)).toEqual(await decodeSave(code));
  await desktop.close();
});

test('a damaged code is rejected with a clear message', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  const code = await readExportCode(page);
  await page.getByTestId('import-code').fill(code.slice(0, -13) + code.slice(-9)); // potong 4 karakter payload, checksum tetap;
  await page.getByRole('button', { name: 'Periksa kode' }).click();
  await expect(page.getByRole('alert')).toContainText('salah salin');
});
