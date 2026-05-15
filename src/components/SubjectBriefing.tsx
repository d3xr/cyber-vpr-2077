import { motion } from 'framer-motion';
import { briefingBySubject } from '../data/dialogues';
import { DialogueBlock } from './DialogueBlock';
import type { Subject } from '../types';

interface Props {
  subject: Subject;
  onDone: () => void;
}

/**
 * Briefing intro shown AFTER JACK IN, BEFORE map.
 * Subject-specific narrative wrapper from V — gives narrative context for why
 * the player is solving English / Russian / Math / Literature / CP-lore.
 *
 * Required so `briefingBySubject` (defined in dialogues.ts) actually reaches
 * the user — without this it was dead code (~5 V-prologs never shown).
 */
export const SubjectBriefing = ({ subject, onDone }: Props) => {
  const lines = briefingBySubject[subject];
  if (!lines || lines.length === 0) {
    onDone();
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-nc-black/95 backdrop-blur-sm flex items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-2xl space-y-4">
        <div className="font-mono text-xs text-nc-yellow tracking-[0.3em]">
          // INCOMING TRANSMISSION · CHANNEL 077
        </div>
        <div className="border-l-2 border-nc-yellow pl-4 py-2 space-y-1 font-mono text-[0.7rem] text-nc-cyan/70">
          <div>▸ TARGET TRACK: <span className="text-nc-yellow">{subject.toUpperCase()}</span></div>
          <div>▸ FIXER: WAKAKO OKADA</div>
          <div>▸ ENCRYPTION: BD-SECURE</div>
        </div>
        <div className="border border-nc-yellow/30 bg-nc-black/80 p-5 lg:p-6">
          <DialogueBlock lines={lines} onComplete={onDone} />
        </div>
      </div>
    </motion.div>
  );
};
