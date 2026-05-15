/**
 * E07 · leaderboard_appears
 * After a math run with callsign "DELAMAIN_AI", open leaderboard (MATH tab) — entry must be there.
 *
 * NB: depends on the server actually accepting the submission. If E01 ran successfully,
 * the row should be findable. We also do an independent run here to be self-contained.
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
  answerQuiz,
  backToMap,
  debriefIfReady,
} from './helpers';

test('E07 leaderboard_appears — callsign visible in MATH leaderboard after run', async ({ page }) => {
  test.setTimeout(120_000);
  // Briefing input maxLength=16. Server may reject some patterns — keep simple letters.
  // We add a few random letters at the end for uniqueness across runs.
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const callsign = `DELAMAIN_${suffix}`;

  await seedSkipIntros(page);
  await seedFreshState(page);
  await injectMissionsData(page);
  await page.goto('/');

  await pickSubject(page, 'math');
  await enterCallsignAndJackIn(page, callsign);
  await skipSubjectBriefing(page);
  await acceptNextJob(page);
  await answerQuiz(page, 'correct');
  await backToMap(page);
  await debriefIfReady(page);

  // Wait for upload to finish — require SUBMITTED specifically (not offline).
  await expect(
    page.getByText(/SCORE SUBMITTED/i),
  ).toBeVisible({ timeout: 25_000 });

  // Click VIEW LEADERBOARD button.
  await page.getByRole('button', { name: /VIEW LEADERBOARD/i }).click();

  // Switch to MATH tab.
  await page.getByRole('button', { name: /^MATH$/i }).click();

  // Wait for individual-runs table header to render.
  await expect(page.getByText(/BEST RUNS|INDIVIDUAL RUNS/i).first()).toBeVisible({
    timeout: 10_000,
  });

  // Look for callsign in any <td>. Server may have uppercased the value.
  const matches = page.locator('td', { hasText: new RegExp(callsign, 'i') });
  await expect(matches.first()).toBeVisible({ timeout: 15_000 });
});
