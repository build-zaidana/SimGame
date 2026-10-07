import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { answerReview, decideAll, openNextCase, startShift } from './helpers.ts';

const correctDecision = (caseId: string): string =>
  (
    JSON.parse(
      readFileSync(
        join(import.meta.dirname, '..', 'content/id/modes/soc/cases', `${caseId}.json`),
        'utf8',
      ),
    ) as { correctDecision: string }
  ).correctDecision;

test('the daily challenge pays a reward, starts a streak and is done for the day', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  const daily = page.getByTestId('daily-soc');
  await expect(daily).toContainText('Selesaikan Shift 1 dulu');

  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await decideAll(page, 8);
  await page.getByRole('button', { name: 'Lanjut ke Review Cepat' }).click();
  await answerReview(page, 'right');
  await page.getByRole('button', { name: 'Simpan & kembali ke kantor' }).click();

  await daily.getByRole('button', { name: 'Mulai tantangan harian Meja SOC' }).click();
  const briefing = page.getByRole('dialog');
  await expect(
    briefing.getByRole('heading', { name: /Tantangan Harian · \d{4}-\d{2}-\d{2}/ }),
  ).toBeVisible();
  await briefing.getByRole('button', { name: 'Mulai shift' }).click();
  await expect(page.getByTestId('daily-badge')).toBeVisible();

  // Tiga kasus pilihan hari ini; jawab semuanya dengan benar.
  for (let i = 0; i < 3; i++) {
    await openNextCase(page);
    const caseId = (await page.getByTestId('document').getAttribute('data-case-id')) ?? '';
    await page.locator(`[data-decision="${correctDecision(caseId)}"]`).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lanjut' }).click();
  }

  // 3 × Rp 10 + bonus beruntun 1 hari × Rp 5.
  await expect(page.getByTestId('daily-reward')).toHaveText('🔥 Hadiah +Rp 35 · beruntun 1 hari');
  await page.getByRole('button', { name: 'Ambil hadiah & kembali ke kantor' }).click();
  await expect(daily).toContainText('Selesai hari ini');
  await expect(daily.getByTestId('daily-streak')).toHaveText('🔥 Beruntun 1 hari');
});
