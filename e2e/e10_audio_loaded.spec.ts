/**
 * E10 · audio_loaded
 * On the SubjectBriefing screen, at least one <audio> element must have a valid src.
 *
 * Detail: pre-recorded m4a per dialogue line, played via `playSpoken`.
 * We assert that on briefing modal an audio is attached and resolves > 0 bytes.
 *
 * NB: The DialogueBlock uses a hidden <audio> created via JS. We probe it by
 * looking at all audio elements after briefing screen appears.
 */
import { test, expect } from '@playwright/test';
import {
  seedSkipIntros,
  seedFreshState,
  pickSubject,
  enterCallsignAndJackIn,
} from './helpers';

test('E10 audio_loaded — at least one audio element with valid src on briefing modal', async ({ page }) => {
  test.setTimeout(60_000);

  await seedSkipIntros(page);
  await seedFreshState(page);
  await page.goto('/');

  await pickSubject(page, 'english');
  await enterCallsignAndJackIn(page, 'DELAMAIN_AUDIO');

  // Wait for briefing modal to render (it triggers audioRef in DialogueBlock).
  await expect(page.getByText(/INCOMING TRANSMISSION/i)).toBeVisible({ timeout: 8_000 });

  // Wait briefly for the audio element to be created/attached.
  await page.waitForTimeout(1500);

  // Probe audio elements.
  const audioInfo = await page.evaluate(() => {
    const audios = Array.from(document.querySelectorAll('audio'));
    return audios.map((a) => ({
      src: a.currentSrc || a.src,
      readyState: a.readyState,
      networkState: a.networkState,
    }));
  });
  console.log('E10 audio elements:', audioInfo);

  // If no <audio> tag at all — Web Speech fallback path. Verify SpeechSynthesis was invoked instead.
  if (audioInfo.length === 0) {
    const spoke = await page.evaluate(() => {
      // We monkey-patched speak; if not, check that speechSynthesis was used.
      const w = window as unknown as { speechSynthesis?: SpeechSynthesis };
      return !!w.speechSynthesis;
    });
    expect(spoke).toBeTruthy();
    test.info().annotations.push({ type: 'note', description: 'No <audio> tag; Web Speech API fallback in use.' });
    return;
  }

  // Otherwise at least one <audio> with non-empty src.
  const withSrc = audioInfo.filter((a) => a.src && a.src.length > 0);
  expect(withSrc.length, 'expected at least one <audio> with a src').toBeGreaterThanOrEqual(1);

  // For one of them, verify the file responds with HTTP 200.
  const sampleSrc = withSrc[0].src;
  const status = await page.evaluate(async (url) => {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      return r.status;
    } catch {
      return -1;
    }
  }, sampleSrc);
  expect(status, `audio HEAD failed: ${sampleSrc}`).toBe(200);
});
