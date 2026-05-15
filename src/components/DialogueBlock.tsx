import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Line, Speaker } from '../data/dialogues';
import { Typewriter } from './Typewriter';
import { playSpoken, type AudioHandle } from '../utils/speech';
import { isMuted } from '../utils/audio';

const SPEAKER_META: Record<Speaker, { color: string; label: string }> = {
  V: { color: 'text-nc-yellow', label: 'V // MERC' },
  JOHNNY: { color: 'text-nc-magenta', label: 'JOHNNY // RELIC.dll' },
  DELAMAIN: { color: 'text-nc-cyan', label: 'DELAMAIN // AI TAXI' },
  WAKAKO: { color: 'text-nc-purple', label: 'WAKAKO // FIXER' },
  SYS: { color: 'text-nc-green', label: 'SYS' },
};

interface Props {
  lines: Line[];
  speed?: number;
  onComplete?: () => void;
}

export const DialogueBlock = ({ lines, speed = 26, onComplete }: Props) => {
  const [idx, setIdx] = useState(0);
  const [doneCurrent, setDoneCurrent] = useState(false);

  useEffect(() => {
    setIdx(0);
    setDoneCurrent(false);
  }, [lines]);

  // Voice-over: pre-recorded m4a per line (macOS Milena/Daniel via `say`).
  // Falls back to Web Speech if no audioFile present.
  const audioRef = useRef<AudioHandle | null>(null);
  useEffect(() => {
    const line = lines[idx];
    if (!line || isMuted()) return;
    if (line.speaker === 'SYS' && line.text.startsWith('>')) return;
    audioRef.current?.stop();
    audioRef.current = playSpoken(line.audioFile, line.text, { rate: 1.0 });
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
    };
  }, [idx, lines]);

  const advance = () => {
    if (!doneCurrent) return;
    if (idx + 1 < lines.length) {
      setIdx(idx + 1);
      setDoneCurrent(false);
    } else {
      onComplete?.();
    }
  };

  const handleSkipAll = () => {
    setDoneCurrent(true);
    if (idx + 1 < lines.length) {
      setIdx(lines.length - 1);
    } else {
      onComplete?.();
    }
  };

  const visible = lines.slice(0, idx + 1);

  return (
    <div className="space-y-3">
      {visible.map((line, i) => {
        const meta = SPEAKER_META[line.speaker];
        const isLast = i === visible.length - 1;
        return (
          <motion.div
            key={`${i}-${line.text}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-start"
          >
            <div className={`w-32 shrink-0 font-display text-xs tracking-widest ${meta.color}`}>
              ▸ {meta.label}
            </div>
            <div className="flex-1 font-mono text-nc-text leading-relaxed">
              {isLast ? (
                <Typewriter
                  text={line.text}
                  speed={speed}
                  onDone={() => setDoneCurrent(true)}
                />
              ) : (
                <span>{line.text}</span>
              )}
            </div>
          </motion.div>
        );
      })}

      <div className="flex gap-2 pt-2 items-center">
        {idx + 1 < lines.length ? (
          <>
            <button
              type="button"
              onClick={advance}
              disabled={!doneCurrent}
              className="cyber-btn text-sm"
            >
              &gt; NEXT
            </button>
            <button
              type="button"
              onClick={handleSkipAll}
              className="cyber-btn cyber-btn-purple text-sm"
            >
              ≫ SKIP
            </button>
          </>
        ) : onComplete ? (
          <button
            type="button"
            onClick={advance}
            disabled={!doneCurrent}
            className="cyber-btn cyber-btn-yellow text-sm"
          >
            &gt; CONTINUE
          </button>
        ) : (
          <span className="font-display text-xs tracking-[0.3em] text-nc-green/80">
            ▣ END OF TRANSMISSION
          </span>
        )}
      </div>
    </div>
  );
};
