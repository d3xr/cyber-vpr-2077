/**
 * E09 · offline_graceful
 * Block /api/* with route interception (return 500). Flow should still let player play,
 * show offline/error message, but NOT crash.
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

test('E09 offline_graceful — blocked /api/* surfaces friendly error, no crash', async ({ page }) => {
  test.setTimeout(120_000);

  // Block all /api/* calls.
  await page.route('**/api/**', (route) => route.fulfill({ status: 500, body: 'offline' }));

  // Listen for uncaught page errors.
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await seedSkipIntros(page);
  await seedFreshState(page);
  await injectMissionsData(page);
  await page.goto('/');

  await pickSubject(page, 'math');
  await enterCallsignAndJackIn(page, 'DELAMAIN_OFFLINE');

  // Briefing screen should surface OFFLINE_MODE warning (since startRun failed).
  await expect(page.getByText(/OFFLINE_MODE|leaderboard|⚠/i).first()).toBeVisible({ timeout: 8_000 });

  // Flow must still proceed — startGame is called in `finally`.
  await skipSubjectBriefing(page);
  await acceptNextJob(page);
  await answerQuiz(page, 'correct');
  await backToMap(page);
  await debriefIfReady(page);

  // Finale must render even with API down.
  await expect(page.getByText(/TOTAL SCORE/i)).toBeVisible({ timeout: 10_000 });
  // Leaderboard uplink panel should show "Offline run · score not submitted" (idle state, since runId is null).
  await expect(page.getByText(/Offline run|not submitted/i)).toBeVisible({ timeout: 8_000 });

  expect(pageErrors, `page must not throw, but got: ${pageErrors.join(' | ')}`).toEqual([]);
});
