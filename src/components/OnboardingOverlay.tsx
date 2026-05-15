import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick } from '../utils/audio';

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    code: '> NEURAL UPLINK ESTABLISHED',
    title: 'WELCOME, EDGERUNNER',
    body: 'Это тренажёр ВПР в обёртке Cyberpunk 2077. Каждый предмет — отдельная миссия в Night City.',
    hint: 'Math · Russian · Literature · English · CP2077 Lore',
  },
  {
    code: '> RUNTIME RULES',
    title: 'HOW IT WORKS',
    body: 'Выбираешь предмет → callsign → отвечаешь на 5 вопросов в multiple-choice. Сервер сам считает скор.',
    hint: '60% правильных = grade 4 · 85% = grade 5',
  },
  {
    code: '> STREET HALL · ACTIVE',
    title: 'LEADERBOARD',
    body: 'Твой callsign попадает в Street Hall of Fame. Несколько попыток — норма. При равных очках выше тот, кто прошёл быстрее.',
    hint: 'Сдай 4 школьных предмета на ≥4 → откроется секретный CP2077 LORE-трек.',
  },
];

export const OnboardingOverlay = ({ onDone }: Props) => {
  const [step, setStep] = useState(0);
  // If BootSequence already ran this session, skip OnboardingOverlay entirely
  // (it's redundant — both serve as cold-start hooks).
  useEffect(() => {
    try {
      const booted = sessionStorage.getItem('cybervpr-booted') === '1';
      const seen = localStorage.getItem('cybervpr-onboarding-seen') === '1';
      if (booted && seen) onDone();
    } catch {
      /* ignore */
    }
  }, [onDone]);
  const last = step >= STEPS.length - 1;

  const handleNext = () => {
    playClick();
    if (last) {
      try {
        localStorage.setItem('cybervpr-onboarding-seen', '1');
      } catch {
        /* ignore */
      }
      onDone();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    playClick();
    try {
      localStorage.setItem('cybervpr-onboarding-seen', '1');
    } catch {
      /* ignore */
    }
    onDone();
  };

  const s = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-nc-black/95 backdrop-blur-sm flex items-center justify-center px-4"
    >
      <div className="w-full max-w-xl">
        {/* Step pips */}
        <div className="flex items-center gap-2 mb-6 font-mono text-xs text-nc-yellow/70">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 transition-all ${
                i === step ? 'flex-1 bg-nc-yellow' : i < step ? 'flex-1 bg-nc-yellow/40' : 'flex-1 bg-nc-yellow/10'
              }`}
            />
          ))}
          <span className="ml-2 tabular-nums">
            0{step + 1}/0{STEPS.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="font-mono text-xs text-nc-yellow tracking-widest">{s.code}</div>
            <h2
              className="font-display text-3xl lg:text-5xl text-nc-yellow tracking-wider"
              style={{ textShadow: '0 0 24px rgba(252,238,10,0.45)' }}
            >
              {s.title}
            </h2>
            <p className="font-mono text-base text-nc-text/90 leading-relaxed">{s.body}</p>
            <div className="font-mono text-xs text-nc-cyan/80 border-l-2 border-nc-cyan/40 pl-3 py-1">
              ▣ {s.hint}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={handleNext}
            className="cyber-btn cyber-btn-yellow text-base flex-1 sm:flex-none"
          >
            {last ? '▶ JACK IN' : '> NEXT'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="font-mono text-xs text-nc-muted hover:text-nc-yellow tracking-widest"
          >
            ≫ SKIP
          </button>
        </div>
      </div>
    </motion.div>
  );
};
