import { expect, test, type Page } from '@playwright/test';

async function startShift1(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await page.getByRole('button', { name: 'Mulai Shift 1: Hari Pertama' }).click();
  const briefing = page.getByRole('dialog');
  await expect(briefing.getByRole('heading', { name: 'Shift 1 · Hari Pertama' })).toBeVisible();
  while (await briefing.getByRole('button', { name: 'Lanjut' }).isVisible()) {
    await briefing.getByRole('button', { name: 'Lanjut' }).click();
  }
  await briefing.getByRole('button', { name: 'Mulai shift' }).click();
  await expect(briefing).toBeHidden();
}

/** Di HP, antrian ada di tab sendiri; di desktop selalu terlihat. */
async function openNextCase(page: Page) {
  const queueTab = page.getByRole('tab', { name: 'Antrian' });
  if (await queueTab.isVisible()) await queueTab.click();
  const next = page.locator('[data-case]:enabled').first();
  await expect(next).toBeVisible();
  await next.click();
  await expect(page.getByTestId('document')).toBeVisible();
}

test('Shift 1 can be played through to the report', async ({ page }) => {
  await startShift1(page);

  // Kasus pertama: tandai bukti yang benar lalu blokir → umpan balik "Tepat!".
  await openNextCase(page);
  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', 's01-email-001');
  const sender = page.locator('[data-evidence="sender"]');
  await sender.click();
  await expect(sender).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-evidence="link"]').click({ button: 'right' });
  await expect(page.getByTestId('real-address')).toContainText('akun-aman.test');
  await page.locator('[data-evidence="link"]').click();
  await expect(page.getByTestId('marks-count')).toHaveText('2 bukti ditandai');

  const block = page.locator('[data-decision="block"]');
  expect((await block.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await block.click();
  const feedback = page.getByRole('dialog');
  await expect(feedback.getByRole('heading', { name: 'Tepat!' })).toBeVisible();
  await feedback.getByRole('button', { name: 'Lanjut' }).click();

  // Sisa kasus: putuskan apa saja sampai shift selesai.
  for (let i = 1; i < 8; i++) {
    await openNextCase(page);
    await page.locator('[data-decision="allow"]').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lanjut' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Laporan Shift 1 · Hari Pertama' })).toBeVisible();
  await expect(page.getByText('Keputusan tepat: 4 dari 8')).toBeVisible();
  await expect(page.getByText(/Nusa Digital punya analis baru/)).toBeVisible();

  await page.getByRole('button', { name: 'Kembali ke kantor' }).click();
  await expect(page.getByText('Shift selesai: 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ulangi Shift 1: Hari Pertama' })).toBeVisible();
});

test('reloading mid-shift resumes the same case with its marks', async ({ page }) => {
  await startShift1(page);
  await openNextCase(page);
  const doc = page.getByTestId('document');
  const caseId = await doc.getAttribute('data-case-id');
  await page.locator('[data-evidence="sender"]').click();
  await expect(page.locator('[data-evidence="sender"]')).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
  await page.getByRole('button', { name: 'Lanjutkan Shift 1' }).click();

  await expect(page.getByTestId('document')).toHaveAttribute('data-case-id', caseId ?? '');
  await expect(page.locator('[data-evidence="sender"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('dialog')).toBeHidden();
});
