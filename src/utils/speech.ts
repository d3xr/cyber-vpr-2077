import { isMuted, registerAudio, unregisterAudio } from './audio';

export const canSpeak = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

const PREFERRED_EN_VOICES = [
  /Samantha.*\(Premium\)/i,
  /Samantha.*\(Enhanced\)/i,
  /Ava.*\(Premium\)/i,
  /Karen.*\(Premium\)/i,
  /Daniel.*\(Premium\)/i,
  /Google US English/i,
  /Google UK English Female/i,
  /Google UK English Male/i,
  /Microsoft.*Aria.*Online/i,
  /Microsoft.*Jenny.*Online/i,
  /Microsoft.*Guy.*Online/i,
  /Daniel/i,
  /Samantha/i,
  /Karen/i,
];

const PREFERRED_RU_VOICES = [
  /Milena.*\(Premium\)/i,
  /Yuri.*\(Premium\)/i,
  /Milena.*\(Enhanced\)/i,
  /Yuri.*\(Enhanced\)/i,
  /Google русский/i,
  /Microsoft.*Russian/i,
  /Microsoft.*Dmitry/i,
  /Microsoft.*Svetlana/i,
  /Milena/i,
  /Yuri/i,
];

export const detectLang = (text: string): 'ru-RU' | 'en-US' =>
  /[а-яА-ЯёЁ]/.test(text) ? 'ru-RU' : 'en-US';

const pickVoice = (lang: 'ru-RU' | 'en-US' = 'en-US'): SpeechSynthesisVoice | null => {
  if (!canSpeak()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const list = lang === 'ru-RU' ? PREFERRED_RU_VOICES : PREFERRED_EN_VOICES;
  for (const re of list) {
    const v = voices.find((vv) => re.test(vv.name));
    if (v) return v;
  }
  // Fallback to any voice matching the language
  if (lang === 'ru-RU') {
    return (
      voices.find((v) => v.lang === 'ru-RU') ||
      voices.find((v) => v.lang.startsWith('ru')) ||
      null
    );
  }
  return (
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => v.lang.startsWith('en')) ||
    null
  );
};

let unlocked = false;

export const ensureVoices = (): Promise<void> =>
  new Promise((resolve) => {
    if (!canSpeak()) return resolve();
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) return resolve();
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(resolve, 1500);
  });

export const speak = async (
  text: string,
  opts?: { onEnd?: () => void; onStart?: () => void; rate?: number; lang?: 'ru-RU' | 'en-US' | 'auto' },
): Promise<void> => {
  if (!canSpeak()) {
    opts?.onEnd?.();
    return;
  }
  if (isMuted()) {
    opts?.onEnd?.();
    return;
  }
  await ensureVoices();
  window.speechSynthesis.cancel();
  if (!unlocked) {
    const warm = new SpeechSynthesisUtterance(' ');
    warm.volume = 0;
    window.speechSynthesis.speak(warm);
    unlocked = true;
  }
  const lang =
    opts?.lang === 'auto' || !opts?.lang ? detectLang(text) : opts.lang;
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.lang = v?.lang ?? lang;
  u.rate = opts?.rate ?? (lang === 'ru-RU' ? 1.0 : 0.9);
  u.pitch = 1;
  u.volume = 1;
  u.onstart = () => opts?.onStart?.();
  u.onend = () => opts?.onEnd?.();
  u.onerror = () => opts?.onEnd?.();
  window.speechSynthesis.speak(u);
};

export const cancelSpeech = () => {
  if (canSpeak()) window.speechSynthesis.cancel();
};

export interface AudioHandle {
  stop: () => void;
}

/**
 * Play a pre-recorded audio file (m4a/mp3) if it exists, else fall back to Web Speech.
 * Returns a handle that can stop playback.
 */
export const playSpoken = (
  audioPath: string | undefined,
  fallbackText: string,
  opts?: { onEnd?: () => void; onStart?: () => void; rate?: number },
): AudioHandle => {
  let stopped = false;
  let audio: HTMLAudioElement | null = null;

  const fallbackToTTS = () => {
    if (stopped) return;
    speak(fallbackText, opts);
  };

  if (isMuted()) {
    // no audio at all — call onEnd asynchronously so caller's state machine still advances
    setTimeout(() => opts?.onEnd?.(), 0);
    return { stop: () => { stopped = true; } };
  }

  if (audioPath) {
    audio = new Audio(audioPath);
    audio.preload = 'auto';
    audio.volume = 1;
    audio.onplay = () => opts?.onStart?.();
    audio.onended = () => {
      if (audio) unregisterAudio(audio);
      opts?.onEnd?.();
    };
    audio.onerror = () => {
      if (audio) unregisterAudio(audio);
      fallbackToTTS();
    };
    registerAudio(audio);
    audio.play().catch(() => fallbackToTTS());
  } else {
    speak(fallbackText, opts);
  }

  return {
    stop: () => {
      stopped = true;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        unregisterAudio(audio);
      }
      cancelSpeech();
    },
  };
};
