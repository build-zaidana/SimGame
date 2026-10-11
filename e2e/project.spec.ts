import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { openNextCase } from './helpers.ts';

const DEV = join(import.meta.dirname, '..', 'content/id/modes/dev');
const read = <T>(path: string): T => JSON.parse(readFileSync(join(DEV, path), 'utf8')) as T;
const project = read<{
  brief: { items: { id: string; kind: string }[] };
  cards: { id: string; caseId: string }[];
}>('projects/kopi-senja.json');

/** Save yang sudah menyelesaikan 2 shift Meja Developer (proyek terbuka setelah shift 2). */
async function unlockProject(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Main' }).click();
  await page.getByTestId('tip-card').getByRole('button', { name: 'Lewati semua tips' }).click();
  await page.evaluate(() => {
    const key = 'shiftit:save:journal';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}');
    const done = { bestScore: 80, stars: 2, completedAt: '2026-10-10T10:00:00.000Z' };
    save.modes = {
      ...save.modes,
      dev: {
        unlockedShift: 3,
        shifts: { 'dev-01': done, 'dev-02': done },
        wallet: 0,
        trust: 75,
        toolsOwned: [],
        upgradesOwned: [],
        chaptersUnlocked: [],
        badges: {},
        projects: {},
      },
    };
    save.updatedAt = '2099-01-01T00:00:00.000Z';
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Main' }).click();
}

async function solve(page: Page) {
  const caseId = (await page.getByTestId('document').getAttribute('data-case-id')) ?? '';
  const c = read<{ data: { solution: string } }>(`cases/${caseId}.json`);
  await page.getByTestId('code-editor').fill(c.data.solution);
  await page.getByTestId('run-code').click();
  await expect(page.getByTestId('run-summary')).toContainText('SEMUA TES LULUS', {
    timeout: 20_000,
  });
  await page.locator('[data-decision="submit"]').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lanjut' }).click();
}

test('client project: sort the PRD, plan a sprint on the board, build it, then see the retro', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await unlockProject(page);

  const section = page.getByTestId('projects-dev');
  await section.getByRole('button', { name: /Aplikasi Antrean Kopi Senja/ }).click();

  // Langkah 1: pilah kebutuhan PRD.
  const submit = page.getByRole('button', { name: 'Kirim pilahan' });
  await expect(submit).toBeDisabled();
  for (const item of project.brief.items)
    await page.locator(`[data-brief-item="${item.id}"] [data-kind="${item.kind}"]`).click();
  await submit.click();
  await expect(page.getByTestId('brief-score')).toHaveText('8 dari 8 tepat');
  await page.getByRole('button', { name: 'Lanjut ke perencanaan' }).click();

  // Langkah 2: rencana sprint sesuai kapasitas (5 poin), kartu WAJIB dulu.
  const capacity = page.getByTestId('capacity');
  await expect(capacity).toHaveAttribute('data-capacity', '5');
  await page.locator('[data-card="k-nomor"]').getByRole('button').click();
  await page.locator('[data-card="k-total"]').getByRole('button').click();
  await expect(capacity).toHaveAttribute('data-used', '5');
  // Kapasitas penuh: kartu lain tidak muat.
  await expect(page.locator('[data-card="k-tunggu"]').getByRole('button')).toBeDisabled();
  await page.getByRole('button', { name: 'Mulai Sprint 1' }).click();

  // Langkah 3: sprint di meja, antrian tampil sebagai papan kerja.
  const briefing = page.getByRole('dialog');
  await expect(
    briefing.getByRole('heading', { name: /Sprint 1 · Aplikasi Antrean/ }),
  ).toBeVisible();
  await briefing.getByRole('button', { name: 'Mulai shift' }).click();
  await expect(page.getByTestId('project-badge')).toContainText('Sprint 1');
  const queueTab = page.getByRole('tab', { name: 'Antrian' });
  if (await queueTab.isVisible()) await queueTab.click();
  await expect(page.locator('[data-board-column="todo"] [data-case]')).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await openNextCase(page);
    await solve(page);
  }

  // Laporan sprint → retro di layar Proyek, lalu rencana sprint 2.
  await expect(page.getByTestId('sprint-cards').locator('[data-card-done="true"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tutup Sprint & lihat retro' }).click();
  const retro = page.getByTestId('retro');
  await expect(retro).toContainText('Selesai: 5 dari 5 poin');
  await expect(retro).toContainText('Gaji: +Rp 60');
  await expect(page.getByRole('heading', { name: 'Rencana Sprint 2' })).toBeVisible();
  // Kartu yang sudah selesai tidak muncul lagi di backlog.
  await expect(page.locator('[data-card="k-nomor"]')).toHaveCount(0);
});
