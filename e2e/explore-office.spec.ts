import { expect, test, type Page } from '@playwright/test';

/** Mengetuk titik di peta kantor (koordinat dunia 320×192). */
async function tapWorld(page: Page, x: number, y: number) {
  const box = await page.getByRole('application').boundingBox();
  if (!box) throw new Error('canvas not visible');
  await page.mouse.click(box.x + (x / 320) * box.width, box.y + (y / 192) * box.height);
}

async function openOffice(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await expect(page.getByTestId('explore-office')).toHaveAttribute('data-status', 'ready', {
    timeout: 15_000,
  });
}

test('walk to Rani by tapping her, and she shares a tip from the rulebook', async ({ page }) => {
  await openOffice(page);
  await tapWorld(page, 92, 72);
  const prompt = page.getByTestId('explore-prompt');
  await expect(prompt).toContainText('Mbak Rani:', { timeout: 10_000 });
  await expect(prompt).toContainText('Tips hari ini:');
});

test('tap the SOC desk to walk there and start the shift', async ({ page }) => {
  await openOffice(page);
  await tapWorld(page, 56, 56);
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Shift 1 · Hari Pertama' }),
  ).toBeVisible({ timeout: 10_000 });
});

test('keyboard: walk with the arrow keys and interact with Enter', async ({ page }) => {
  await openOffice(page);
  await page.getByRole('application').focus();
  // Naik lewat celah antar-meja sampai dinding, lalu ke kanan menuju papan lencana.
  const prompt = page.getByTestId('explore-prompt');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1_800);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await expect(prompt).toContainText('Papan Lencana', { timeout: 5_000 });
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Lencana' })).toBeVisible();
});

test('the explorable office can be turned off in Settings', async ({ page }) => {
  await openOffice(page);
  await page.getByRole('button', { name: 'Pengaturan' }).click();
  await page.getByRole('checkbox', { name: /Kantor yang bisa dijelajahi/ }).uncheck();
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(page.getByTestId('explore-office')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Meja SOC/ })).toBeVisible();
});
