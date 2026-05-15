// audio.ts — real CC0 SFX from Kenney's Interface Sounds (via Calinou's GitHub mirror).
// Files in /public/sounds/sfx/. Loaded once into HTMLAudioElement pool, replayed on demand.
// Mute kills everything: SFX, m4a (M1 braindance), TTS.

let muted = false;
const audioElements = new Set<HTMLAudioElement>();

export const isMuted = () => muted;

export const registerAudio = (el: HTMLAudioElement) => {
  audioElements.add(el);
  el.addEventListener('ended', () => audioElements.delete(el), { once: true });
};

export const unregisterAudio = (el: HTMLAudioElement) => {
  audioElements.delete(el);
};

const stopAllPlayingAudio = () => {
  audioElements.forEach((el) => {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
  });
  audioElements.clear();
};

const cancelTTS = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const setMuted = (m: boolean) => {
  muted = m;
  if (!m) return;
  stopAllPlayingAudio();
  cancelTTS();
};

// ============ SFX POOL — real Kenney CC0 WAVs ============

interface SfxEntry {
  src: string;
  volume: number;
}

const SFX: Record<string, SfxEntry> = {
  click: { src: '/sounds/sfx/click.wav', volume: 0.45 },
  hover: { src: '/sounds/sfx/hover.wav', volume: 0.25 },
  select: { src: '/sounds/sfx/select.wav', volume: 0.55 },
  back: { src: '/sounds/sfx/back.wav', volume: 0.45 },
  correct: { src: '/sounds/sfx/correct.wav', volume: 0.6 },
  wrong: { src: '/sounds/sfx/wrong.wav', volume: 0.55 },
  confirm: { src: '/sounds/sfx/confirm.wav', volume: 0.65 },
};

// Lazy preload — first call clones a single Audio element so concurrent plays
// don't cut each other off (HTMLAudioElement = single playback per instance).
const preloaded: Record<string, HTMLAudioElement> = {};
const preload = (key: string): HTMLAudioElement | null => {
  const cfg = SFX[key];
  if (!cfg) return null;
  if (!preloaded[key]) {
    if (typeof window === 'undefined') return null;
    const a = new Audio(cfg.src);
    a.volume = cfg.volume;
    a.preload = 'auto';
    preloaded[key] = a;
  }
  return preloaded[key];
};

const play = (key: string) => {
  if (muted) return;
  const base = preload(key);
  if (!base) return;
  // Clone for overlap-safe playback
  const inst = base.cloneNode(true) as HTMLAudioElement;
  inst.volume = SFX[key].volume;
  registerAudio(inst);
  inst.play().catch(() => {
    /* user-gesture block — silent fail */
  });
};

// ============ Public SFX API ============

export const playClick = () => play('click');
export const playHover = () => play('hover');
export const playSelect = () => play('select');
export const playBack = () => play('back');
export const playCorrect = () => play('correct');
export const playWrong = () => play('wrong');
export const playMissionComplete = () => play('confirm');

// ============ MUSIC (no-op — kid feedback: «Музыка не нужна») ============
export const startAmbient = () => {
  /* intentionally no-op */
};

export const stopAmbient = () => {
  /* nothing to stop */
};
