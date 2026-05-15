/**
 * DELAMAIN E2E helpers · Instance #62
 *
 * "I have observed that V's quest-flow benefits from deterministic state setup.
 * I have therefore prepared a series of helper subroutines. They are clean."
 */
import { type Page, expect } from '@playwright/test';

export type Subject = 'english' | 'russian' | 'literature' | 'math' | 'cyberpunk_history';

/**
 * Pre-set localStorage / sessionStorage to skip BootSequence + OnboardingOverlay.
 *
 * Also monkey-patches HTMLAudioElement and window.speechSynthesis so that
 * listening missions (m1 Braindance) auto-advance through audio in headless
 * chromium — there is no audio device, so real `audio.play()` may never fire
 * 'ended' and Web Speech voices.length is 0. We short-circuit by dispatching
 * the 'ended' event synchronously and calling utterance.onend ourselves.
 *
 * Must run BEFORE first navigation.
 */
export const seedSkipIntros = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cybervpr-onboarding-seen', '1');
      sessionStorage.setItem('cybervpr-booted', '1');
    } catch {
      /* ignore */
    }

    // --- HTMLAudioElement.prototype.play stub: instantly dispatch 'ended' ---
    try {
      const origPlay = HTMLAudioElement.prototype.play;
      HTMLAudioElement.prototype.play = function (this: HTMLAudioElement) {
        // Dispatch ended asynchronously to mimic real playback ordering.
        setTimeout(() => {
          try {
            this.dispatchEvent(new Event('ended'));
            // If app uses `audio.onended = ...` (assignment) instead of addEventListener,
            // call it directly. (DialogueBlock / playSpoken does `audio.onended = ...`.)
            // The Event dispatch above already calls onended handler in standard DOM.
          } catch {
            /* ignore */
          }
        }, 50);
        // Return a resolved promise so caller's .catch path is NOT hit.
        return Promise.resolve();
      } as typeof origPlay;
    } catch {
      /* ignore */
    }

    // --- speechSynthesis.speak stub: instantly call utterance.onend ---
    try {
      // Make canSpeak()===true (already true since speechSynthesis exists) AND
      // ensure each utterance "completes" right away.
      const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
        try {
          origSpeak(utterance);
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          try {
            utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
          } catch {
            /* ignore */
          }
          try {
            utterance.onend?.(new Event('end') as SpeechSynthesisEvent);
          } catch {
            /* ignore */
          }
        }, 30);
      };
      // ensureVoices() race: it listens for 'voiceschanged' OR resolves after 1500ms.
      // We don't need voices for our stubs to work — pickVoice() returns null,
      // u.voice stays null, then we speak; our stub fires onend regardless.
    } catch {
      /* ignore */
    }
  });
};

/**
 * Hard reset persisted Zustand state while keeping the mute flag (so listening
 * missions still auto-advance). Useful when running multiple specs that leave
 * gating-subject results behind.
 */
export const seedFreshState = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    try {
      // Wipe results/streetcred/etc, but keep `muted: true` for headless audio bypass.
      localStorage.setItem(
        'cybervpr-2077',
        JSON.stringify({ state: { muted: true }, version: 5 }),
      );
    } catch {
      /* ignore */
    }
  });
};

/**
 * Read current persisted state (returns null if not yet written).
 */
export const readState = async (page: Page) => {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('cybervpr-2077');
      return raw ? (JSON.parse(raw) as { state?: Record<string, unknown>; version?: number }) : null;
    } catch {
      return null;
    }
  });
};

/**
 * Pick a track on the Briefing screen (English / Russian / Math / Literature / CP-lore).
 * Buttons are vertical menu items with `0N` numeric prefix and LABEL text.
 * Uses ru: locator combo for resilience against minor copy churn.
 */
export const pickSubject = async (page: Page, subject: Subject): Promise<void> => {
  const labelMap: Record<Subject, string> = {
    english: 'ENGLISH',
    russian: 'RUSSIAN',
    literature: 'LITERATURE',
    math: 'MATH',
    cyberpunk_history: 'CP LORE',
  };
  const label = labelMap[subject];
  // Subject menu buttons are <button> with `<span>{LABEL}</span>` inside.
  await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click();
};

/**
 * Enter callsign and JACK IN. Waits for SubjectBriefing modal (or its absence).
 */
export const enterCallsignAndJackIn = async (page: Page, callsign: string): Promise<void> => {
  await page.getByPlaceholder('ENTER YOUR HANDLE').fill(callsign);
  await page.getByRole('button', { name: /JACK IN/i }).click();
};

/**
 * Skip through SubjectBriefing dialogue modal if present.
 * The modal contains a "≫ SKIP" button (visible when not on last line)
 * and a "> CONTINUE" button (visible on last line, disabled until typewriter done).
 */
export const skipSubjectBriefing = async (page: Page): Promise<void> => {
  // Modal may not exist if subject lacks briefing lines (defensive).
  const skipBtn = page.getByRole('button', { name: /≫\s*SKIP/i });
  const continueBtn = page.getByRole('button', { name: /CONTINUE/i });

  // Wait briefly for modal to appear.
  try {
    await skipBtn.first().waitFor({ state: 'visible', timeout: 5000 });
    await skipBtn.first().click();
  } catch {
    // Maybe single-line briefing — only CONTINUE.
  }

  // After skip, the last line is shown — wait for CONTINUE to become enabled.
  try {
    await continueBtn.first().waitFor({ state: 'visible', timeout: 5000 });
    // Typewriter must finish before button enables.
    await expect(continueBtn.first()).toBeEnabled({ timeout: 8000 });
    await continueBtn.first().click();
  } catch {
    // Briefing already dismissed itself.
  }
};

/**
 * On the map screen, accept the next available job.
 * Two routes: click the highlighted yellow map dot OR the "ACCEPT JOB" button.
 * We prefer the button — more stable than positional map dot clicks.
 */
export const acceptNextJob = async (page: Page): Promise<void> => {
  // Wait for either the map to load or the "ACCEPT JOB" button.
  const acceptBtn = page.getByRole('button', { name: /ACCEPT JOB/i });
  await acceptBtn.waitFor({ state: 'visible', timeout: 15_000 });
  await acceptBtn.click();
};

/**
 * For a generic quiz mission (math/russian/literature/cp-lore + english m2 reading,
 * english m1 listening, english m3 grammar):
 * Click the option matching question's `q.options[q.answer]`, for every question.
 * If `correct=false`, click index 0 for every question (deliberate wrong answers).
 *
 * Pulls per-question data straight from the page DOM rather than missions.json
 * (because variant rotation means we don't know which variant is active until runtime).
 *
 * For English listening (m1) it presses PLAY BRAINDANCE first and waits for "STREAM COMPLETE".
 */
export const answerQuiz = async (page: Page, mode: 'correct' | 'wrong'): Promise<void> => {
  // Detect if this is a listening mission — has PLAY BRAINDANCE button.
  // Wait a moment for the mission AnimatePresence enter animation to finish.
  await page.waitForTimeout(400);
  const playBtn = page.getByRole('button', { name: /PLAY BRAINDANCE/i });
  if (await playBtn.isVisible().catch(() => false)) {
    await playBtn.click({ force: false });

    // Poll up to 30s: either STREAM COMPLETE appears, or PLAY remains pressed for too long.
    // If audio doesn't auto-complete (some edge cases with our stub), click PLAY again
    // and then force option-button enable by injecting a state flip (last resort).
    const streamDone = await page
      .getByText(/STREAM COMPLETE/i)
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!streamDone) {
      // Audio path didn't fire onended. Click PLAY again — second time around the
      // Audio element may behave better — and if still no, fall back to dispatching
      // ended manually on every audio element in the page.
      await page.evaluate(() => {
        document.querySelectorAll('audio').forEach((a) => {
          try {
            a.dispatchEvent(new Event('ended'));
          } catch {
            /* ignore */
          }
        });
      });
      await page
        .getByText(/STREAM COMPLETE/i)
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 })
        .catch(() => null);
    }

    await expect(
      page.getByRole('button', { name: /^1\)/ }).first(),
    ).toBeEnabled({ timeout: 30_000 });
  }

  // For writing mission (Mission4NCPDProfile) — fields not options. Detect via "UPLOAD TO NCPD".
  const isWriting = await page
    .getByRole('button', { name: /UPLOAD TO NCPD/i })
    .isVisible()
    .catch(() => false);
  if (isWriting) {
    await fillWritingForm(page);
    return;
  }

  // For grammar (Mission3IceBreaker) — <select> dropdowns, not buttons.
  const selectCount = await page.locator('select.cyber-select').count();
  if (selectCount > 0) {
    await answerGrammarSelects(page, mode);
    return;
  }

  // For multiple-choice (Mission1, Mission2, MissionGenericQuiz):
  // Read variant data from store, then click the correct/wrong option per question.
  const variantData = await readActiveVariantQuestions(page);
  if (variantData.length === 0) {
    throw new Error('answerQuiz: no questions found in active variant — injection or state read failed');
  }

  // Click options scoped to each question's card.
  // Question cards are rendered as `<div class="border border-nc-cyan/20 p-3 ...">`
  // and contain a label `<span class="font-display ...">{q.id}.</span>` followed by
  // option buttons `<button>...{1) option text}...</button>`.
  //
  // Strategy: locate the option button using DOM evaluation that walks the
  // question card by its id text — robust against duplicate option texts.
  for (const q of variantData) {
    const targetIdx = mode === 'correct' ? q.answer : 0;
    const clicked = await page.evaluate(
      ({ qid, optIdx }) => {
        // Find a card whose first text starts with `qid.` (e.g. "A." or "Q1.").
        // Cards are direct descendants of the questions container.
        const cards = Array.from(document.querySelectorAll<HTMLElement>('div.border'));
        const card = cards.find((c) => {
          const span = c.querySelector('span.font-display');
          if (!span) return false;
          const t = (span.textContent || '').trim();
          return t === `${qid}.` || t.replace(/\s/g, '') === `${qid}.`;
        });
        if (!card) return false;
        const buttons = Array.from(card.querySelectorAll<HTMLButtonElement>('button'));
        // The option buttons are those whose text starts with "(idx+1))".
        const optButtons = buttons.filter((b) => /^\d\)/.test((b.textContent || '').trim()));
        const target = optButtons[optIdx];
        if (!target || target.disabled) return false;
        target.click();
        return true;
      },
      { qid: q.id, optIdx: targetIdx },
    );
    if (!clicked) {
      throw new Error(`answerQuiz: failed to click option ${targetIdx} for ${q.id}`);
    }
  }

  // Wait until SUBMIT becomes enabled (proof the store registered all answers).
  const submitBtn = page
    .getByRole('button', { name: /SUBMIT|DECRYPT|UPLOAD REPORT/i })
    .first();
  await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
  await submitBtn.click();
};

/**
 * Read current mission's active variant questions from the in-page store.
 * Returns `[{id, prompt, options, answer}]`.
 */
const readActiveVariantQuestions = async (
  page: Page,
): Promise<{ id: string; prompt: string; options: string[]; answer: number }[]> => {
  return page.evaluate(() => {
    // Mirror gameStore.useActiveVariant logic but in raw DOM/state read.
    const raw = localStorage.getItem('cybervpr-2077');
    if (!raw) return [];
    const persisted = JSON.parse(raw) as {
      state: {
        currentMissionIndex: number;
        selectedVariant: Record<string, number>;
        selectedSubject: string;
      };
    };
    // We need access to missions.json. It's bundled. Easiest: scrape questions from DOM.
    // Each question card has `font-display ... {q.id}.` prefix and option buttons.
    // We then read option text from the buttons. The "correct" answer cannot be inferred
    // from DOM (it's hidden until submit). So we look up missions data via a global hook.
    // Approach: read questions via DOM, then ask the page to expose missions data.
    // Simpler: emit data from a globally-injected map.
    const w = window as unknown as {
      __missionsData?: Array<{
        id: string;
        variants?: Array<{ id: string; questions?: Array<{ id: string; prompt: string; options: string[]; answer: number }> }>;
        questions?: Array<{ id: string; prompt: string; options: string[]; answer: number }>;
      }>;
    };
    const missions = w.__missionsData;
    if (!missions) return [];
    const mIdx = persisted.state.currentMissionIndex;
    const m = missions[mIdx];
    if (!m) return [];
    const vIdx = persisted.state.selectedVariant[m.id] ?? 0;
    const variant = m.variants?.[vIdx];
    const qs = variant?.questions ?? m.questions ?? [];
    return qs.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, answer: q.answer }));
  });
};

/**
 * Inject missions data into window so tests can know correct answers.
 * Loaded once per page via addInitScript that fetches /assets/*.js is overkill —
 * instead we read the static missions.json from local file and inject it.
 */
export const injectMissionsData = async (page: Page): Promise<void> => {
  // Read missions.json off disk (test runs from project root).
  // We can't use fs in browser; use Node side at config time and serialize.
  // Helpers run in test process (node) — we read file here.
  const fs = await import('fs/promises');
  const path = await import('path');
  const file = path.resolve(process.cwd(), 'src/data/missions.json');
  const raw = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(raw) as { missions: unknown[] };
  await page.addInitScript((data) => {
    (window as unknown as { __missionsData: unknown }).__missionsData = data;
  }, parsed.missions);
};

/**
 * For Mission3IceBreaker grammar — pick option from each <select>.
 * In "correct" mode we need to know the right answer index per blank.
 */
const answerGrammarSelects = async (page: Page, mode: 'correct' | 'wrong'): Promise<void> => {
  const blanks = await page.evaluate(() => {
    const raw = localStorage.getItem('cybervpr-2077');
    if (!raw) return [];
    const persisted = JSON.parse(raw) as {
      state: { currentMissionIndex: number; selectedVariant: Record<string, number> };
    };
    const w = window as unknown as {
      __missionsData?: Array<{
        id: string;
        variants?: Array<{ id: string; blanks?: Array<{ id: number; options: string[]; answer: number }> }>;
        blanks?: Array<{ id: number; options: string[]; answer: number }>;
      }>;
    };
    const missions = w.__missionsData;
    if (!missions) return [];
    const mIdx = persisted.state.currentMissionIndex;
    const m = missions[mIdx];
    if (!m) return [];
    const vIdx = persisted.state.selectedVariant[m.id] ?? 0;
    const variant = m.variants?.[vIdx];
    return (variant?.blanks ?? m.blanks ?? []).map((b) => ({
      id: b.id,
      answer: b.answer,
      options: b.options,
    }));
  });

  const selects = page.locator('select.cyber-select');
  const count = await selects.count();
  for (let i = 0; i < count; i++) {
    const b = blanks[i];
    if (!b) continue;
    const target = mode === 'correct' ? b.answer : 0;
    await selects.nth(i).selectOption({ index: target + 1 }); // +1 for leading "___" disabled option
  }
  await page.getByRole('button', { name: /INJECT|BREAK ICE|SUBMIT/i }).first().click();
};

/**
 * For Mission4NCPDProfile writing — fill all fields with plausible English values.
 */
const fillWritingForm = async (page: Page): Promise<void> => {
  // Field definitions come from missions.json m4.fields[]. We fetch via store.
  const fields = await page.evaluate(() => {
    const raw = localStorage.getItem('cybervpr-2077');
    if (!raw) return [];
    const persisted = JSON.parse(raw) as { state: { currentMissionIndex: number } };
    const w = window as unknown as {
      __missionsData?: Array<{
        id: string;
        fields?: Array<{ id: string; label: string; kind: string; min?: number; max?: number; minLength: number }>;
      }>;
    };
    const m = w.__missionsData?.[persisted.state.currentMissionIndex];
    return m?.fields ?? [];
  });

  for (const f of fields) {
    let value = 'Alex';
    if (f.kind === 'number') {
      const mid = f.min !== undefined && f.max !== undefined ? Math.floor((f.min + f.max) / 2) : 10;
      value = String(mid);
    } else if (f.kind === 'sentence') {
      value = 'I love football and music';
    } else {
      // Pick fitting English token based on label.
      const lower = (f.label || '').toLowerCase();
      if (lower.includes('city') || lower.includes('country')) value = 'London';
      else if (lower.includes('hobby') || lower.includes('like')) value = 'reading';
      else value = 'Alex';
    }
    // Find the input/textarea by label proximity.
    const label = page.locator('label').filter({ hasText: f.label }).first();
    const inputOrArea = label.locator('input, textarea').first();
    await inputOrArea.fill(value);
  }
  await page.getByRole('button', { name: /UPLOAD TO NCPD|SUBMIT/i }).first().click();
};

/**
 * After mission result panel — click BACK TO MAP to continue.
 */
export const backToMap = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: /BACK TO MAP/i }).first().click();
};

/**
 * On map after all jobs done — click DEBRIEF to enter finale.
 */
export const debriefIfReady = async (page: Page): Promise<void> => {
  const debrief = page.getByRole('button', { name: /DEBRIEF/i });
  await debrief.waitFor({ state: 'visible', timeout: 12_000 });
  await debrief.click();
};

/**
 * Pre-fill persisted results for all 4 school subjects with perfect scores.
 * This unlocks CP LORE.
 */
export const seedAllSubjectsPerfect = async (page: Page): Promise<void> => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const raw = await fs.readFile(path.resolve(process.cwd(), 'src/data/missions.json'), 'utf8');
  const parsed = JSON.parse(raw) as { missions: Array<{ id: string; subject?: string; maxPoints: number }> };
  const gatingSubjects = ['english', 'russian', 'literature', 'math'];
  const results: Record<string, { missionId: string; earned: number; max: number; answers: Record<string, string>; completedAt: number }> = {};
  for (const m of parsed.missions) {
    const subj = m.subject ?? 'english';
    if (!gatingSubjects.includes(subj)) continue;
    results[m.id] = {
      missionId: m.id,
      earned: m.maxPoints,
      max: m.maxPoints,
      answers: {},
      completedAt: Date.now(),
    };
  }
  await page.addInitScript((seededResults) => {
    try {
      const existing = localStorage.getItem('cybervpr-2077');
      const base = existing
        ? JSON.parse(existing)
        : { state: {}, version: 5 };
      base.state = {
        ...base.state,
        results: seededResults,
        stage: 'briefing',
        selectedSubject: 'english',
        muted: false,
      };
      base.version = 5;
      localStorage.setItem('cybervpr-2077', JSON.stringify(base));
    } catch {
      /* ignore */
    }
  }, results);
};

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Generic full-run flow: jack-in → all missions → finale.
 * Used by E01-E04. Returns the finale's persisted state for verification.
 */
export const runFullFlow = async (
  page: Page,
  subject: Subject,
  callsign: string,
  mode: 'correct' | 'wrong' = 'correct',
): Promise<void> => {
  await pickSubject(page, subject);
  await enterCallsignAndJackIn(page, callsign);
  await skipSubjectBriefing(page);

  // Number of missions depends on subject (english=4, others=1).
  // After backToMap() either ACCEPT JOB (more missions) or DEBRIEF (all done) appears.
  // Race the two locators each iteration.
  for (let i = 0; i < 6; i++) {
    // Wait briefly so the map fully re-renders after backToMap()/initial entry.
    const acceptBtn = page.getByRole('button', { name: /ACCEPT JOB/i });
    const debriefBtn = page.getByRole('button', { name: /DEBRIEF/i });
    await Promise.race([
      acceptBtn.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => null),
      debriefBtn.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => null),
    ]);
    const debriefVisible = await debriefBtn.isVisible().catch(() => false);
    if (debriefVisible) break;
    const acceptVisible = await acceptBtn.isVisible().catch(() => false);
    if (!acceptVisible) {
      throw new Error(`runFullFlow: neither ACCEPT JOB nor DEBRIEF visible at iteration ${i}`);
    }
    await acceptBtn.click();
    await answerQuiz(page, mode);
    await backToMap(page);
  }
  await debriefIfReady(page);
};
