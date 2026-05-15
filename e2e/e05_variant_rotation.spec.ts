/**
 * E05 · variant_rotation
 * Run math 3 times (reset state between runs). Compare selectedVariant.m_math.
 * Need ≥ 2 distinct variant_ids out of 17.
 */
import { test, expect } from '@playwright/test';
import {
  seedSkipIntros,
  seedFreshState,
  injectMissionsData,
  pickSubject,
  enterCallsignAndJackIn,
  skipSubjectBriefing,
  acceptNextJob,
  readState,
} from './helpers';

test('E05 variant_rotation — math picks ≥ 2 distinct variants over 5 runs', async ({ page }) => {
  test.setTimeout(120_000);
  const variantIndices: number[] = [];
  const ATTEMPTS = 5; // 17 variants — 5 attempts gives ~98% chance of ≥2 distinct

  for (let i = 0; i < ATTEMPTS; i++) {
    await seedSkipIntros(page);
    await seedFreshState(page);
    await injectMissionsData(page);
    await page.goto('/');
    await pickSubject(page, 'math');
    await enterCallsignAndJackIn(page, `DELAMAIN_ROT_${i}`);
    await skipSubjectBriefing(page);
    await acceptNextJob(page); // this triggers Math.random() variant selection
    const st = await readState(page);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sv = (st?.state as any)?.selectedVariant?.m_math;
    if (typeof sv === 'number') variantIndices.push(sv);

    // hard reset for next iteration
    await page.evaluate(() => localStorage.removeItem('cybervpr-2077'));
  }

  const unique = new Set(variantIndices);
  console.log('E05 variant indices observed:', variantIndices, 'unique:', [...unique]);
  expect(variantIndices.length).toBeGreaterThanOrEqual(ATTEMPTS - 1);
  expect(unique.size).toBeGreaterThanOrEqual(2);
  // Index range sanity check — 17 variants present in missions.json.
  for (const v of variantIndices) {
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(17);
  }
});
