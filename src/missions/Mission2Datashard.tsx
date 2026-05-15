import { useState } from 'react';
import { motion } from 'framer-motion';
import { HudFrame } from '../components/HudFrame';
import { GlitchTitle } from '../components/GlitchTitle';
import { MissionHero } from '../components/MissionHero';
import { MissionResultPanel } from '../components/MissionResultPanel';
import { useGame, useActiveVariant } from '../store/gameStore';
import { playClick, playCorrect, playWrong, playMissionComplete } from '../utils/audio';
import type { Mission, MCQuestion } from '../types';

interface Props {
  mission: Mission;
}

export const Mission2Datashard = ({ mission }: Props) => {
  const completeMission = useGame((s) => s.completeMission);
  const variant = useActiveVariant(mission);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(false);

  const questions = (variant.questions ?? []) as MCQuestion[];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const select = (qid: string, optIdx: number) => {
    if (submitted) return;
    playClick();
    setAnswers({ ...answers, [qid]: optIdx });
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    let earned = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) earned += 1;
    });
    setSubmitted(true);
    if (earned < questions.length) {
      setShake(true);
      setTimeout(() => setShake(false), 220);
    }
    if (earned === questions.length) playMissionComplete();
    else if (earned >= 3) playCorrect();
    else playWrong();
    const stringAnswers: Record<string, string> = {};
    questions.forEach((q) => {
      const a = answers[q.id];
      stringAnswers[q.id] = a !== undefined ? q.options[a] : '';
    });
    completeMission({
      missionId: mission.id,
      earned,
      max: mission.maxPoints,
      answers: stringAnswers,
      completedAt: Date.now(),
    });
  };

  const earned = questions.filter((q) => answers[q.id] === q.answer).length;

  return (
    <div className={shake ? 'shake-screen' : ''}>
      <MissionHero skill={mission.skill} />
      <div className="mb-4">
        <div className="label-tag">// READING · 5 PTS · DATAPAD</div>
        <GlitchTitle text={mission.title} className="text-3xl lg:text-5xl text-nc-cyan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <HudFrame label="STOLEN DATAPAD" color="green" className="p-5 bg-nc-dark/90">
          <div className="font-display text-nc-green text-sm tracking-widest mb-2">
            {variant.profile}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-nc-text leading-relaxed text-sm bg-nc-black/60 p-4 border border-nc-green/30 relative"
          >
            <div className="absolute top-1 right-2 text-[0.6rem] font-mono text-nc-green/70">
              ENCRYPT: AES-256 · STATUS: BROKEN
            </div>
            {variant.datapad}
            <span className="text-nc-green animate-cursor">▮</span>
          </motion.div>
        </HudFrame>

        <HudFrame label="VERIFY FACTS · A–E" color="cyan" className="p-5 bg-nc-dark/85">
          <div className="space-y-3">
            {questions.map((q) => {
              const userAnswer = answers[q.id];
              return (
                <div key={q.id} className="border border-nc-cyan/20 p-3 bg-nc-black/40">
                  <div className="font-mono mb-2">
                    <span className="font-display text-nc-cyan tracking-widest mr-2">{q.id}.</span>
                    {q.prompt}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, i) => {
                      const selected = userAnswer === i;
                      const isCorrect = i === q.answer;
                      let cls = 'border-nc-cyan/30 hover:border-nc-cyan';
                      if (submitted) {
                        if (isCorrect) cls = 'border-nc-green text-nc-green bg-nc-green/10';
                        else if (selected) cls = 'border-nc-magenta text-nc-magenta bg-nc-magenta/10';
                        else cls = 'border-nc-muted/20 text-nc-muted';
                      } else if (selected) {
                        cls = 'border-nc-yellow text-nc-yellow bg-nc-yellow/5';
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => select(q.id, i)}
                          disabled={submitted}
                          className={`text-left border ${cls} px-3 py-2 font-mono text-sm flex items-center gap-2 transition-colors`}
                        >
                          <span
                            className={`inline-block w-3 h-3 border ${
                              selected ? 'border-nc-yellow bg-nc-yellow/40' : 'border-nc-cyan/40'
                            }`}
                          />
                          <span className="text-nc-muted">{i + 1})</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </HudFrame>
      </div>

      {!submitted && (
        <div className="mt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="cyber-btn cyber-btn-yellow"
          >
            ▶ UPLOAD REPORT · SUBMIT
          </button>
        </div>
      )}

      {submitted && (
        <div className="mt-5">
          <MissionResultPanel
            missionTitle={mission.title}
            earned={earned}
            max={mission.maxPoints}
            rows={questions.map((q) => {
              const a = answers[q.id];
              return {
                id: q.id,
                ok: a === q.answer,
                user: a !== undefined ? q.options[a] : '',
                correct: q.options[q.answer],
                explanation: q.explanation,
              };
            })}
          />
        </div>
      )}
    </div>
  );
};
