import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onDone: () => void;
}

const STEPS = [
  '> NEURAL UPLINK INITIATED ...',
  '> SYNC: ARASAKA NCDP-NET',
  '> LOADING WAKAKO CHANNEL ...',
  '> WAKE UP, NETRUNNER',
];

/**
 * 2-second glitch boot screen on session start.
 * Persists `cybervpr-boot-seen` so it shows once per real reload, not on every render.
 */
export const BootSequence = ({ onDone }: Props) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          window.clearInterval(id);
          window.setTimeout(onDone, 350);
          return s;
        }
        return s + 1;
      });
    }, 380);
    return () => window.clearInterval(id);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-nc-black flex items-center justify-center px-6"
    >
      <div className="w-full max-w-xl space-y-3 font-mono text-sm">
        <div
          className="font-display text-3xl lg:text-5xl text-nc-yellow tracking-widest"
          style={{ textShadow: '0 0 24px rgba(252,238,10,0.55)' }}
        >
          <motion.span
            animate={{ opacity: [1, 0.7, 1, 0.85, 1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            WAKE UP, NETRUNNER
          </motion.span>
        </div>
        <div className="h-px w-32 bg-nc-yellow" />
        <div className="space-y-1.5">
          <AnimatePresence>
            {STEPS.slice(0, step + 1).map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`${i === step ? 'text-nc-yellow animate-flicker' : 'text-nc-yellow/50'}`}
              >
                {s}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
