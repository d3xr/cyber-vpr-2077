import { useCallback, useEffect, useRef } from 'react';

// ============================================================================
// SECRET ACTIVATION HOOKS
// ============================================================================
// Three independent triggers for the korovan-mode easter egg:
//   1. Konami code (window-level keyboard listener)
//   2. N rapid clicks on a target element within a time window
//   3. Magic string typed into any input (handled inline in Briefing)

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

/**
 * Listen window-wide for the Konami code. Fires `callback` once per full match.
 * The buffer resets on any non-matching key, so partial typing does not block normal input.
 */
export const useKonami = (callback: () => void): void => {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === KONAMI_SEQUENCE[pos]) {
        pos++;
        if (pos === KONAMI_SEQUENCE.length) {
          pos = 0;
          cb.current();
        }
      } else {
        // Allow re-starting from this key if it matches sequence[0].
        pos = e.code === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};

/**
 * Returns an onClick handler that fires `callback` when the user has clicked
 * `count` times within `windowMs`. The buffer rolls — old clicks expire.
 */
export const useSecretClicks = (
  count: number,
  windowMs: number,
  callback: () => void,
): (() => void) => {
  const clicks = useRef<number[]>([]);
  const cb = useRef(callback);
  cb.current = callback;

  return useCallback(() => {
    const now = Date.now();
    clicks.current = [...clicks.current, now].filter((t) => now - t <= windowMs);
    if (clicks.current.length >= count) {
      clicks.current = [];
      cb.current();
    }
  }, [count, windowMs]);
};

// ────────────────────────────────────────────────────────────────────────────
// Cross-component trigger for the korovan-mode prompt. Briefing fires it when
// the secret-clicks combo lands; App.tsx listens and opens the confirm dialog.
// Using a window event keeps the components decoupled — no prop drilling.
// ────────────────────────────────────────────────────────────────────────────

export const KOROVAN_TRIGGER_EVENT = 'korovan-prompt-open';

export const fireKorovanPrompt = (): void => {
  window.dispatchEvent(new CustomEvent(KOROVAN_TRIGGER_EVENT));
};

export const useKorovanPromptListener = (callback: () => void): void => {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    const onEvt = () => cb.current();
    window.addEventListener(KOROVAN_TRIGGER_EVENT, onEvt);
    return () => window.removeEventListener(KOROVAN_TRIGGER_EVENT, onEvt);
  }, []);
};
