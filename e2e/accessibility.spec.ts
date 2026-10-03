import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openNextCase, startShift } from './helpers.ts';

/** WCAG 2.1 AA (PRD §9) diperiksa otomatis di layar-layar utama, di HP dan desktop. */
async function expectNoViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary, `${label}\n${summary.join('\n')}`).toEqual([]);
}

test('main screens have no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Main' })).toBeEnabled();
  await expectNoViolations(page, 'title');

  await page.getByRole('button', { name: 'Main' }).click();
  await expect(page.getByRole('heading', { name: 'Kantor PT Nusa Digital' })).toBeVisible();
  await expectNoViolations(page, 'hub');

  for (const [button, heading] of [
    ['Pengaturan', 'Pengaturan'],
    ['Toko Alat', 'Toko Alat'],
    ['Pindah Save', 'Pindah Save'],
    ['Buku Panduan', 'Buku Panduan SOC'],
  ] as const) {
    await page.getByRole('button', { name: button, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    await expectNoViolations(page, button);
    await page.getByRole('button', { name: 'Kembali' }).click();
  }

  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await openNextCase(page);
  await page.locator('[data-evidence="sender"]').click();
  await expectNoViolations(page, 'desk');

  await page.locator('[data-decision="block"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoViolations(page, 'feedback');
});
