import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { openNextCase, startShift } from './helpers.ts';

const CSP = /Content-Security-Policy: (.+)/.exec(
  readFileSync(join(import.meta.dirname, '..', 'public', '_headers'), 'utf8'),
)?.[1];

async function startDevShift(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await startShift(page, 'Mulai Shift 1: Hari Pertama Ngoding', 'Shift 1 · Hari Pertama Ngoding');
}

async function approveFirstPr(page: Page) {
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-pr-001');
  // PR hanya punya keputusan review; tombol Kirim Solusi khusus tugas coding.
  await expect(page.locator('[data-decision="submit"]')).toHaveCount(0);
  await page.locator('[data-decision="approve"]').click();
  const feedback = page.getByRole('dialog');
  await expect(feedback.getByRole('heading', { name: 'Tepat!' })).toBeVisible();
  await feedback.getByRole('button', { name: 'Lanjut' }).click();
}

test('Developer desk: fix a real bug in Python until every test passes', async ({ page }) => {
  test.setTimeout(90_000);
  await startDevShift(page);
  await approveFirstPr(page);

  // Robot kurir: susun program dengan tombol perintah, jalankan, lihat robot mengantar paket.
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-robot-001');
  await page.getByTestId('code-editor').fill('');
  for (const cmd of [
    'maju()',
    'maju()',
    'ambil()',
    'maju()',
    'maju()',
    'belok_kanan()',
    'maju()',
    'maju()',
    'antar()',
  ])
    await page.locator(`[data-command="${cmd}"]`).click();
  await page.getByTestId('run-code').click();
  await expect(page.getByTestId('run-summary')).toContainText('SEMUA PAKET TERANTAR', {
    timeout: 15_000,
  });
  await expect(page.getByTestId('robot-map')).toHaveAttribute('data-delivered', '1', {
    timeout: 10_000,
  });
  await page.locator('[data-decision="submit"]').click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Tepat!' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Lanjut' }).click();

  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-fix-001');
  const submit = page.locator('[data-decision="submit"]');
  await expect(submit).toBeDisabled();

  // Kode awal yang salah: hanya 1 dari 3 tes yang lulus.
  await page.getByTestId('run-code').click();
  await expect(page.getByTestId('run-summary')).toHaveText('1 dari 3 tes lulus', {
    timeout: 15_000,
  });
  // Tes tampil sebagai pelanggan: yang gagal kecewa dan protes hasilnya.
  await expect(page.getByTestId('customer-scene').locator('li[data-mood="upset"]')).toHaveCount(2);
  await expect(page.getByTestId('customer-scene')).toContainText('hasil kodemu: 135.0');

  // Loop tak berujung dihentikan, game tetap jalan.
  const editor = page.getByTestId('code-editor');
  await editor.fill('while True:\n    pass\n');
  await page.getByTestId('run-code').click();
  await expect(page.getByText(/dihentikan/)).toBeVisible({ timeout: 10_000 });

  await editor.fill(
    'def rata_rata(nilai):\n    total = 0\n    for n in nilai:\n        total = total + n\n    return total / len(nilai)\n',
  );
  await page.getByTestId('run-code').click();
  await expect(page.getByTestId('run-summary')).toContainText('SEMUA TES LULUS', {
    timeout: 15_000,
  });
  await expect(submit).toBeEnabled();
  await submit.click();
  const feedback = page.getByRole('dialog');
  await expect(feedback.getByRole('heading', { name: 'Tepat!' })).toBeVisible();
  await expect(feedback.getByTestId('tests-passed')).toHaveText('Tes lulus: 3 dari 3');
  await feedback.getByRole('button', { name: 'Lanjut' }).click();

  // Insiden produksi: server terbakar, kesehatan turun sampai bug diperbaiki.
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-fix-002');
  const server = page.getByTestId('server-room');
  await expect(server).toBeVisible();
  // Rollback darurat baru terbuka di shift 3.
  await expect(page.getByTestId('incident-rollback')).toHaveCount(0);
  await expect
    .poll(async () => Number(await server.getAttribute('data-health')), { timeout: 10_000 })
    .toBeLessThan(100);
  // Indikator ringkas di dekat editor tetap terlihat saat pemain menggulir untuk mengetik.
  await expect(page.getByTestId('server-chip')).toContainText(/Server \d+%/);
  await page
    .getByTestId('code-editor')
    .fill('def label_harga(harga):\n    return "Rp " + str(harga)\n');
  await page.getByTestId('run-code').click();
  await expect(page.getByTestId('run-summary')).toContainText('SEMUA TES LULUS', {
    timeout: 15_000,
  });
  await expect(server).toHaveAttribute('data-state', 'fixed');
  await page.locator('[data-decision="submit"]').click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Tepat!' })).toBeVisible();
});

test('Python runs under the production Content-Security-Policy', async ({ page }) => {
  test.setTimeout(60_000);
  expect(CSP).toBeTruthy();
  await page.route('**/*', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': CSP ?? '' },
    });
  });
  await page.addInitScript({
    content: `window.__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__csp.push(e.violatedDirective + ' ' + e.blockedURI);
      });`,
  });
  await startDevShift(page);
  await approveFirstPr(page);
  await openNextCase(page);
  // Kode awal robot belum mengantar paket: 0 dari 1 peta.
  await page.getByTestId('run-code').click();
  await expect(page.getByTestId('run-summary')).toHaveText('0 dari 1 peta berhasil', {
    timeout: 15_000,
  });
  expect(await page.evaluate<string[]>('window.__csp')).toEqual([]);
});
