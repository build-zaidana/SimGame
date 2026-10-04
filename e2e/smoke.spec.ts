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
  await expect(page.getByText('Segera hadir')).toHaveCount(2);
});
