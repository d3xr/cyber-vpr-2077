/**
 * E08 · reload_persists
 * After math run, reload page → results persisted (visible in Mission Log).
 *
 * Zustand persist writes to localStorage `cybervpr-2077` — results survive reload.
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

test('E08 reload_persists — math result survives page reload', async ({ page, context }) => {
  test.setTimeout(120_000);

  await seedSkipIntros(page);
  await seedFreshState(page);
  await injectMissionsData(page);
  await page.goto('/');

  await pickSubject(page, 'math');
  await enterCallsignAndJackIn(page, 'DELAMAIN_E08');
  await skipSubjectBriefing(page);
  await acceptNextJob(page);
  await answerQuiz(page, 'correct');
  await backToMap(page);
  await debriefIfReady(page);

  // Capture pre-reload state.
  const before = await readState(page);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const beforeResults = (before?.state as any).results ?? {};
  expect(Object.keys(beforeResults)).toContain('m_math');
  const earnedBefore = beforeResults.m_math.earned;

  // CRITICAL: clear all addInitScripts before reload. Otherwise seedFreshState()
  // (which removeItem's the store) re-runs on reload and wipes our persisted result.
  // Playwright Page has no `clearInitScripts` API in this version, so we open
  // a fresh page in the same context (cookies + localStorage shared at origin level).
  const newPage = await context.newPage();
  await newPage.goto('/');
  // Allow store rehydrate.
  await newPage.waitForLoadState('domcontentloaded');

  const after = await readState(newPage);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterResults = (after?.state as any)?.results ?? {};
  expect(Object.keys(afterResults)).toContain('m_math');
  expect(afterResults.m_math.earned).toBe(earnedBefore);
});
