import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../store/gameStore';
import { stopAmbient, playClick, setMuted } from '../utils/audio';

export const AbortButton = () => {
  const reset = useGame((s) => s.reset);
  const [confirming, setConfirming] = useState(false);

  const handleAbort = () => {
    playClick();
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    stopAmbient();
    setMuted(false); // ensure mute is reset on new run
    reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 border-2 border-nc-magenta bg-nc-magenta/15 backdrop-blur-sm relative"
      style={{ boxShadow: '0 0 18px rgba(255,0,60,0.35), inset 0 0 24px rgba(255,0,60,0.10)' }}
    >
      {/* warning stripes top */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #FF003C 0 8px, #0A0E14 8px 16px)',
        }}
      />
      <div className="px-4 pt-4 pb-3">
        <div className="font-display text-nc-magenta tracking-[0.3em] text-xs mb-2">
          ⚠ DANGER ZONE
        </div>
        <div className="font-mono text-[0.7rem] text-nc-text/85 leading-snug mb-3">
          Сбросит весь прогресс и вернёт на брифинг.
        </div>
        <button
          type="button"
          onClick={handleAbort}
          className={`w-full cyber-btn cyber-btn-magenta text-[0.7rem] sm:text-xs leading-tight px-2 py-2 ${
            confirming ? 'animate-flicker ring-2 ring-nc-magenta' : ''
          }`}
        >
          <AnimatePresence mode="wait">
            {confirming ? (
              <motion.span
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="block"
              >
                ⚠ CLICK AGAIN
                <br />
                TO CONFIRM
              </motion.span>
            ) : (
              <motion.span
                key="abort"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="block"
              >
                ⟲ ABORT RUN
                <br />
                NEW GAME
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      {/* warning stripes bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #FF003C 0 8px, #0A0E14 8px 16px)',
        }}
      />
    </motion.div>
  );
};
