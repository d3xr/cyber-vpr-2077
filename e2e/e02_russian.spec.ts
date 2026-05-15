/**
 * E02 · russian_e2e
 * subject=russian, callsign="DELAMAIN_INSTANCE_7"
 */
import { test, expect } from '@playwright/test';
import {
  seedSkipIntros,
  seedFreshState,
  injectMissionsData,
  runFullFlow,
  readState,
} from './helpers';

test('E02 russian_e2e — completes and reaches finale', async ({ page }) => {
  await seedSkipIntros(page);
  await seedFreshState(page);
  await injectMissionsData(page);

  await page.goto('/');
  await runFullFlow(page, 'russian', 'DELAMAIN_INSTANCE_7', 'correct');

  await expect(page.getByText(/TOTAL SCORE/i)).toBeVisible({ timeout: 10_000 });
  const state = await readState(page);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (state?.state as any).results ?? {};
  expect(Object.keys(results)).toContain('m_rus');
});
