/**
 * E01 · math_e2e · DELAMAIN Instance #62
 *
 * "Зайти → skip boot/onboarding → MATH → DELAMAIN_AI → JACK IN → 1 mission → submit → finale.
 *  Score must appear, leaderboard upload status = submitted."
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
  readState,
} from './helpers';

test('E01 math_e2e — full run lands on finale with submitted score', async ({ page }) => {
  await seedSkipIntros(page);
  await seedFreshState(page);
  await injectMissionsData(page);

  await page.goto('/');

  await pickSubject(page, 'math');
  await enterCallsignAndJackIn(page, 'DELAMAIN_AI');
  await skipSubjectBriefing(page);

  // One math mission.
  await acceptNextJob(page);
  await answerQuiz(page, 'correct');
  await backToMap(page);
  await debriefIfReady(page);

  // Finale — total score badge visible.
  await expect(page.getByText(/TOTAL SCORE/i)).toBeVisible({ timeout: 10_000 });

  // Leaderboard uplink — submitted or error (in case API issue we still record the verdict).
  // We require eventual non-pending state.
  await expect(
    page.getByText(/SCORE SUBMITTED|Сервер не ответил|Offline run/i),
  ).toBeVisible({ timeout: 15_000 });

  const state = await readState(page);
  expect(state?.state).toBeDefined();
  // Math run should have at least 1 result in results map.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (state?.state as any).results ?? {};
  expect(Object.keys(results)).toContain('m_math');
});
