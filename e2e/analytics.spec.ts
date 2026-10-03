import { expect, test, type Page, type Request } from '@playwright/test';
import { openNextCase, startShift } from './helpers.ts';

/** Build e2e diberi VITE_TELEMETRY_ENDPOINT=/__telemetry (playwright.config.ts). */
function captureAnalytics(page: Page): Request[] {
  const sent: Request[] = [];
  void page.route('**/__telemetry', async (route) => {
    sent.push(route.request());
    await route.fulfill({ status: 204 });
  });
  return sent;
}

/** Sama seperti menutup/menyembunyikan tab: memicu pengiriman antrean. */
async function hideTab(page: Page) {
  await page.evaluate(`
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  `);
}

async function playOneCase(page: Page) {
  await startShift(page, 'Mulai Shift 1: Hari Pertama', 'Shift 1 · Hari Pertama');
  await openNextCase(page);
  await page.locator('[data-evidence="sender"]').click();
  await page.locator('[data-decision="block"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('anonymous analytics stay off until the player opts in', async ({ page }) => {
  const sent = captureAnalytics(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await playOneCase(page);
  await hideTab(page);
  await page.waitForTimeout(500);
  expect(sent).toHaveLength(0);
});

test('after opting in, only the random install id and learning events are sent', async ({
  page,
}) => {
  const sent = captureAnalytics(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await page.getByRole('button', { name: 'Pengaturan' }).click();
  const optIn = page.getByRole('checkbox', { name: /Bagikan data belajar anonim/ });
  await expect(optIn).not.toBeChecked();
  await optIn.check();
  await page.getByRole('button', { name: 'Kembali' }).click();

  await playOneCase(page);
  await hideTab(page);
  await expect.poll(() => sent.length).toBe(1);

  const body = sent[0]?.postDataJSON() as {
    v: number;
    installId: string;
    events: Record<string, unknown>[];
  };
  expect(Object.keys(body).sort()).toEqual(['events', 'installId', 'v']);
  expect(body.installId).toMatch(/^[0-9a-f-]{36}$/);
  expect(body.events.map((e) => e['name'])).toEqual(['shift_started', 'case_decided']);
  for (const e of body.events) expect(e['at']).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\dZ$/);
});
