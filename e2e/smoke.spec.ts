import { expect, test } from '@playwright/test';

test('title screen loads and Main opens the hub', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ShiftIT' })).toBeVisible();

  const play = page.getByRole('button', { name: 'Main' });
  await expect(play).toBeEnabled();
  const box = await play.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  await play.click();
  await expect(page.getByRole('heading', { name: 'Kantor PT Nusa Digital' })).toBeVisible();
  // Keempat meja di PRD bisa dimainkan (ADR 031): tidak ada lagi kartu "Segera hadir".
  await expect(page.getByText('Segera hadir')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Mulai Shift 1: Hari Pertama di Meja Data', exact: true }),
  ).toBeVisible();
});
