/**
 * E04 · english_e2e — pass all 4 missions M1/M2/M3/M4
 *
 * English has 4 distinct mission components (listening, reading, grammar, writing).
 * Finale must aggregate total score across all 4 (max 25 pts).
 */
import { test, expect } from '@playwright/test';
import {
  seedSkipIntros,
  seedFreshState,
  injectMissionsData,
  runFullFlow,
  readState,
} from './helpers';

test('E04 english_e2e — all 4 missions complete, finale shows aggregate', async ({ page }) => {
  test.setTimeout(180_000); // 4 missions, listening audio can be slow

  await seedSkipIntros(page);
  await seedFreshState(page);
  await injectMissionsData(page);

  await page.goto('/');
  await runFullFlow(page, 'english', 'DELAMAIN_E04', 'correct');

  // Finale: total score / 25 visible.
  await expect(page.getByText(/TOTAL SCORE/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/\/\s*25/)).toBeVisible({ timeout: 5_000 });

  const state = await readState(page);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (state?.state as any).results ?? {};
  // All 4 english missions completed.
  expect(Object.keys(results)).toEqual(expect.arrayContaining(['m1', 'm2', 'm3', 'm4']));
});
