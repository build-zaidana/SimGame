import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';

const REVIEW_DIR = join(import.meta.dirname, '..', 'content/id/modes/soc/review');

interface ReviewKey {
  id: string;
  type: 'mcq' | 'tap-evidence' | 'order-steps';
  answerIndex?: number;
  answer?: string[];
  parts?: { evidenceId?: string }[];
}

/** Kunci jawaban dibaca dari konten di disk (tidak pernah dikirim ke UI). */
export const reviewKeys: Map<string, ReviewKey> = new Map(
  readdirSync(REVIEW_DIR).flatMap((f) =>
    (JSON.parse(readFileSync(join(REVIEW_DIR, f), 'utf8')) as { items: ReviewKey[] }).items.map(
      (i) => [i.id, i] as const,
    ),
  ),
);

export async function startShift(page: Page, buttonName: string | RegExp, heading: string) {
  await page.getByRole('button', { name: buttonName }).click();
  const briefing = page.getByRole('dialog');
  await expect(briefing.getByRole('heading', { name: heading })).toBeVisible();
  while (await briefing.getByRole('button', { name: 'Lanjut' }).isVisible()) {
    await briefing.getByRole('button', { name: 'Lanjut' }).click();
  }
  await briefing.getByRole('button', { name: 'Mulai shift' }).click();
  await expect(briefing).toBeHidden();
}

/** Di HP, antrian ada di tab sendiri; di desktop selalu terlihat. */
export async function openNextCase(page: Page) {
  const queueTab = page.getByRole('tab', { name: 'Antrian' });
  if (await queueTab.isVisible()) await queueTab.click();
  const next = page.locator('[data-case]:enabled').first();
  await expect(next).toBeVisible();
  await next.click();
  await expect(page.getByTestId('document')).toBeVisible();
}

export async function decideAll(page: Page, count: number, decision = 'allow') {
  for (let i = 0; i < count; i++) {
    await openNextCase(page);
    await page.locator(`[data-decision="${decision}"]`).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lanjut' }).click();
  }
}

/** Menjawab semua soal Review Cepat; `wrong` = sengaja salah. Mengembalikan ID soal. */
export async function answerReview(page: Page, mode: 'right' | 'wrong'): Promise<string[]> {
  await expect(page.getByRole('heading', { name: 'Review Cepat' })).toBeVisible();
  const ids: string[] = [];
  for (;;) {
    const section = page.locator('[data-review-item]');
    const finish = page.getByRole('button', { name: 'Simpan & kembali ke kantor' });
    await expect(section.or(finish)).toBeVisible();
    if (await finish.isVisible()) return ids;

    const itemId = (await section.getAttribute('data-review-item')) ?? '';
    const key = reviewKeys.get(itemId);
    if (!key) throw new Error(`unknown review item ${itemId}`);
    ids.push(itemId);
    const check = section.getByRole('button', { name: 'Periksa', exact: true });

    if (key.type === 'mcq') {
      const options = section.locator('button[aria-pressed]');
      const right = key.answerIndex ?? 0;
      await options.nth(mode === 'right' ? right : right === 0 ? 1 : 0).click();
    } else if (key.type === 'tap-evidence') {
      const answer = key.answer ?? [];
      const targets =
        mode === 'right'
          ? answer
          : [
              (key.parts ?? []).find((p) => p.evidenceId && !answer.includes(p.evidenceId))
                ?.evidenceId ?? '',
            ];
      for (const ev of targets) await section.locator(`[data-evidence="${ev}"]`).click();
    } else if (mode === 'right') {
      throw new Error('order-steps "right" answering is not needed in these tests');
    }
    // order-steps dimulai dalam urutan acak yang tidak pernah benar → Periksa = salah.
    await check.click();
    await expect(section.getByRole('status')).toContainText(
      mode === 'right' ? 'Benar!' : 'Belum tepat',
    );
    await section.getByRole('button', { name: 'Soal berikutnya' }).click();
  }
}
