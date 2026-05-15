import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HudFrame } from '../components/HudFrame';
import { GlitchTitle } from '../components/GlitchTitle';
import { MissionHero } from '../components/MissionHero';
import { MissionResultPanel } from '../components/MissionResultPanel';
import { useGame, useActiveVariant } from '../store/gameStore';
import { playClick, playCorrect, playWrong, playMissionComplete } from '../utils/audio';
import type { Mission, BlankOption } from '../types';

interface Props {
  mission: Mission;
}

const renderTemplate = (
  template: string,
  blanks: BlankOption[],
  selections: Record<number, number>,
  submitted: boolean,
  onSelect: (id: number, idx: number) => void,
) => {
  const parts = template.split(/(\{\d+\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{(\d+)\}$/);
    if (!m) return <span key={i}>{p}</span>;
    const id = Number(m[1]);
    const blank = blanks.find((b) => b.id === id);
    if (!blank) return <span key={i}>{p}</span>;
    const sel = selections[id];
    const isCorrect = sel === blank.answer;
    let extra = 'border-nc-cyan/60';
    if (submitted) {
      extra = isCorrect ? 'border-nc-green text-nc-green' : 'border-nc-magenta text-nc-magenta';
    } else if (sel !== undefined) {
      extra = 'border-nc-yellow text-nc-yellow';
    }
    return (
      <select
        key={i}
        value={sel ?? ''}
        onChange={(e) => onSelect(id, Number(e.target.value))}
        disabled={submitted}
        className={`cyber-select mx-1 my-1 ${extra}`}
      >
        <option value="" disabled>
          ___
        </option>
        {blank.options.map((opt, k) => (
          <option key={k} value={k}>
            {opt}
          </option>
        ))}
      </select>
    );
  });
};

export const Mission3IceBreaker = ({ mission }: Props) => {
  const completeMission = useGame((s) => s.completeMission);
  const variant = useActiveVariant(mission);

  const blanks = (variant.blanks ?? []) as BlankOption[];
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(false);

  const correctCount = useMemo(
    () => blanks.filter((b) => selections[b.id] === b.answer).length,
    [selections, blanks],
  );
  const answeredCount = useMemo(
    () => blanks.filter((b) => selections[b.id] !== undefined).length,
    [selections, blanks],
  );
  const allAnswered = blanks.every((b) => selections[b.id] !== undefined);
  // Progress shows ANSWERED count before submit, CORRECT count after.
  // Showing correct count before submit would leak which answer is right (kid could
  // brute-force by watching the bar light up).
  const progressCount = submitted ? correctCount : answeredCount;
  const progress = Math.round((progressCount / blanks.length) * 100);
  const filled = Math.round(progress / 10);

  const onSelect = (id: number, idx: number) => {
    if (submitted) return;
    playClick();
    setSelections({ ...selections, [id]: idx });
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
    if (correctCount === blanks.length) playMissionComplete();
    else if (correctCount >= 3) playCorrect();
    else playWrong();
    if (correctCount < blanks.length) {
      setShake(true);
      setTimeout(() => setShake(false), 220);
    }
    const stringAnswers: Record<string, string> = {};
    blanks.forEach((b) => {
      const a = selections[b.id];
      stringAnswers[`${b.id}`] = a !== undefined ? b.options[a] : '';
    });
    completeMission({
      missionId: mission.id,
      earned: correctCount,
      max: mission.maxPoints,
      answers: stringAnswers,
      completedAt: Date.now(),
    });
  };

  return (
    <div className={shake ? 'shake-screen' : ''}>
      <MissionHero skill={mission.skill} />
      <div className="mb-4">
        <div className="label-tag">// GRAMMAR · 5 PTS · ICE BYPASS</div>
        <GlitchTitle text={mission.title} className="text-3xl lg:text-5xl text-nc-green" />
      </div>

      <HudFrame label="CORP TERMINAL" color="green" className="p-5 lg:p-6 bg-nc-dark/90 mb-5">
        <div className="font-mono text-xs text-nc-green mb-3">
          {`> intrusion//inject "self_intro.exe" --target=AraSAKA-Net`}
          <br />
          {`> ${variant.intro}`}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-nc-black/70 border border-nc-green/30 p-4 font-mono text-base lg:text-lg leading-loose text-nc-text"
        >
          {renderTemplate(variant.template ?? '', blanks, selections, submitted, onSelect)}
        </motion.div>

        <div className="mt-4 font-mono text-sm text-nc-muted">
          <div className="flex items-center justify-between mb-1">
            <span className="text-nc-green tracking-widest">
              {submitted ? 'ICE BYPASS · RESULT' : 'TOKENS INJECTED'}
            </span>
            <span className="text-nc-green">{progressCount}/{blanks.length}</span>
          </div>
          <div className="font-mono text-base">
            <span className="text-nc-green">[</span>
            <span className="text-nc-green">{'█'.repeat(filled)}</span>
            <span className="text-nc-muted">{'░'.repeat(10 - filled)}</span>
            <span className="text-nc-green">] </span>
            {submitted ? (
              progress === 100 ? (
                <span className="text-nc-green animate-flicker">ACCESS GRANTED</span>
              ) : (
                <span className="text-nc-magenta">PARTIAL BYPASS</span>
              )
            ) : (
              <span className="text-nc-yellow">SLOTS FILLED · {answeredCount === blanks.length ? 'READY TO INJECT' : 'AWAITING TOKENS'}</span>
            )}
          </div>
        </div>
      </HudFrame>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="cyber-btn cyber-btn-yellow mb-5"
        >
          ▶ INJECT · BREAK ICE
        </button>
      )}

      {submitted && (
        <MissionResultPanel
          missionTitle={mission.title}
          earned={correctCount}
          max={mission.maxPoints}
          rows={blanks.map((b) => {
            const a = selections[b.id];
            return {
              id: `(${b.id})`,
              ok: a === b.answer,
              user: a !== undefined ? b.options[a] : '',
              correct: b.options[b.answer],
              explanation: b.explanation,
            };
          })}
        />
      )}
    </div>
  );
};
