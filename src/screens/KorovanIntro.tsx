import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// KOROVAN INTRO — the cyberpunk → fantasy glitch transition
// ============================================================================
// Plays once before entering the legacy-RPG level. Wraps a narrative around
// the tonal whiplash: V's deck picks up an OLD-NET archive from 2006, and
// the screen visibly degrades from neon back to medieval parchment.

const STAGES: { text: string; subtitle?: string; ms: number; cls?: string }[] = [
  { text: '> SCANNING OLD-NET...',                                            ms: 700  },
  { text: '> PACKET DETECTED · CHANNEL 077',                                  ms: 700  },
  { text: '> ARCHIVE FOUND',     subtitle: 'KOROVAN.SRV [LAST PING: 2006-08-15]', ms: 1100 },
  { text: '> AUTHOR: KIRILL',    subtitle: 'STATUS: ЖДЁТ ДЖВА ГОДА',          ms: 1100 },
  { text: '> ATTEMPTING LEGACY HANDSHAKE...',                                 ms: 800  },
  { text: '> HANDSHAKE OK · LOADING WORLD',                                   ms: 700, cls: 'text-nc-green' },
  { text: '!!! REALITY DRIFT DETECTED !!!',                                   ms: 600, cls: 'text-nc-magenta animate-pulse' },
];

interface Props {
  onDone: () => void;
}

export const KorovanIntro = ({ onDone }: Props) => {
  const [step, setStep] = useState(0);
  const [glitching, setGlitching] = useState(false);
  const [whiteFlash, setWhiteFlash] = useState(false);

  // Step through the boot lines, then fire the glitch + flash, then call onDone.
  useEffect(() => {
    if (step >= STAGES.length) {
      setGlitching(true);
      const t1 = setTimeout(() => setWhiteFlash(true), 600);
      const t2 = setTimeout(() => onDone(), 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    const t = setTimeout(() => setStep((s) => s + 1), STAGES[step].ms);
    return () => clearTimeout(t);
  }, [step, onDone]);

  // Allow Esc to skip the intro.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  return (
    <div className="kor-glitch-overlay">
      {/* Boot log — accumulating lines like a terminal */}
      <div className="space-y-3 max-w-2xl px-6 w-full">
        {STAGES.slice(0, step).map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`kor-glitch-text ${s.cls ?? ''}`}
            style={{ filter: glitching ? 'hue-rotate(90deg) blur(1px)' : 'none' }}
          >
            <div>{s.text}</div>
            {s.subtitle && (
              <div className="text-sm opacity-70 ml-4 mt-1">{s.subtitle}</div>
            )}
          </motion.div>
        ))}
        {step < STAGES.length && (
          <motion.div
            key={`active-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`kor-glitch-text ${STAGES[step].cls ?? ''}`}
          >
            <span className="glitch-text" data-text={STAGES[step].text}>
              {STAGES[step].text}
            </span>
            {STAGES[step].subtitle && (
              <div className="text-sm opacity-70 ml-4 mt-1">{STAGES[step].subtitle}</div>
            )}
          </motion.div>
        )}
      </div>

      {/* Skip hint */}
      <div className="absolute bottom-4 right-4 text-xs opacity-50 font-mono">
        ESC · SKIP
      </div>

      {/* Final glitch crescendo: shake the whole overlay and ramp up RGB split */}
      <AnimatePresence>
        {glitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, rgba(255,0,60,0.1) 0 2px, transparent 2px 4px), repeating-linear-gradient(90deg, rgba(0,240,255,0.1) 0 2px, transparent 2px 4px)',
              animation: 'shake 220ms infinite',
            }}
          />
        )}
      </AnimatePresence>

      {/* White flash that hides the body-class swap */}
      <AnimatePresence>
        {whiteFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-white"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
