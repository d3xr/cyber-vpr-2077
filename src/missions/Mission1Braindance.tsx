import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HudFrame } from '../components/HudFrame';
import { GlitchTitle } from '../components/GlitchTitle';
import { MissionHero } from '../components/MissionHero';
import { MissionResultPanel } from '../components/MissionResultPanel';
import { useGame, useActiveVariant } from '../store/gameStore';
import { canSpeak, ensureVoices, playSpoken, type AudioHandle } from '../utils/speech';
import { playClick, playCorrect, playWrong, playMissionComplete } from '../utils/audio';
import type { Mission, MCQuestion } from '../types';

interface Props {
  mission: Mission;
}

export const Mission1Braindance = ({ mission }: Props) => {
  const completeMission = useGame((s) => s.completeMission);
  const replayUsed = useGame((s) => s.replayUsed[mission.id] ?? false);
  const setReplayUsed = useGame((s) => s.setReplayUsed);
  const variant = useActiveVariant(mission);

  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [shake, setShake] = useState(false);
  const handleRef = useRef<AudioHandle | null>(null);

  const questions = (variant.questions ?? []) as MCQuestion[];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  useEffect(() => {
    ensureVoices();
    return () => {
      handleRef.current?.stop();
    };
  }, []);

  const handlePlay = () => {
    playClick();
    setPlaying(true);
    handleRef.current?.stop();
    handleRef.current = playSpoken(variant.audioFile, variant.audioScript ?? '', {
      onEnd: () => {
        setPlaying(false);
        setPlayed(true);
      },
    });
  };

  const handleReplay = () => {
    playClick();
    setReplayUsed(mission.id);
    setPlaying(true);
    handleRef.current?.stop();
    handleRef.current = playSpoken(variant.audioFile, variant.audioScript ?? '', {
      onEnd: () => setPlaying(false),
    });
  };

  const select = (qid: string, optIdx: number) => {
    if (submitted) return;
    playClick();
    setAnswers({ ...answers, [qid]: optIdx });
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
    setDecoding(true);
    let earned = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) earned += 1;
    });
    if (earned < questions.length) {
      setShake(true);
      setTimeout(() => setShake(false), 220);
    }
    setTimeout(() => {
      setDecoding(false);
      const allGood = earned === questions.length;
      if (allGood) playMissionComplete();
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
    }, 1800);
  };

  const earned = questions.filter((q) => answers[q.id] === q.answer).length;
  const showSummary = submitted && !decoding;

  return (
    <div className={shake ? 'shake-screen' : ''}>
      <MissionHero skill={mission.skill} />
      <div className="mb-4">
        <div className="label-tag">// LISTENING · 5 PTS · BD INTERCEPT</div>
        <GlitchTitle text={mission.title} className="text-3xl lg:text-5xl text-nc-purple" />
      </div>

      <HudFrame label="BRAINDANCE PLAYER" color="purple" className="p-5 lg:p-6 bg-nc-dark/90 mb-5">
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3 font-mono text-sm text-nc-muted">
              <span className="inline-block w-2 h-2 bg-nc-purple animate-flicker" />
              <span>BD-FILE: NIGHT_CITY_KIDS_LOG.bin</span>
            </div>
            <div className="border border-nc-purple/30 bg-nc-black/70 p-3 min-h-[110px] font-mono text-sm relative overflow-hidden">
              <AnimatePresence>
                {playing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-nc-purple text-center">
                      <div className="font-display text-2xl tracking-widest animate-flicker">▶ STREAMING</div>
                      <div className="text-xs text-nc-muted mt-2">Listen carefully · слушай внимательно</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!playing && !played && (
                <div className="text-nc-muted">
                  ⌨ press <span className="text-nc-cyan">PLAY</span> to start the braindance.
                  <br />Можно прослушать ещё раз — но только один раз (как на ВПР).
                </div>
              )}
              {!playing && played && (
                <div className="text-nc-text">
                  <div className="text-nc-green">▣ STREAM COMPLETE</div>
                  <div className="text-nc-muted text-xs mt-1">
                    Replay {replayUsed ? 'used 1/1' : 'available 1/1'}
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 right-2 font-mono text-[0.6rem] text-nc-purple/60">
                BD::00:00:32 · LATENCY 14ms
              </div>
            </div>
            {!canSpeak() && (
              <div className="text-xs text-nc-magenta font-mono">
                ⚠ Браузер не поддерживает Web Speech API — текст показан ниже.
              </div>
            )}
            {(!canSpeak() || (played && !playing)) && (
              <details className="text-xs font-mono text-nc-muted">
                <summary className="cursor-pointer text-nc-cyan">▣ Show transcript (debug)</summary>
                <div className="mt-1 text-nc-text/70">{variant.audioScript}</div>
              </details>
            )}
          </div>
          <div className="flex lg:flex-col gap-2">
            <button
              type="button"
              onClick={handlePlay}
              disabled={playing || submitted}
              className="cyber-btn cyber-btn-purple"
            >
              ▶ PLAY BRAINDANCE
            </button>
            <button
              type="button"
              onClick={handleReplay}
              disabled={!played || replayUsed || playing || submitted}
              className="cyber-btn"
            >
              ↻ REPLAY {replayUsed ? '(used)' : '(1×)'}
            </button>
          </div>
        </div>
      </HudFrame>

      <HudFrame label="DECODE TASKS · A–E" color="cyan" className="p-5 bg-nc-dark/85 mb-5">
        <div className="space-y-4">
          {questions.map((q) => {
            const userAnswer = answers[q.id];
            return (
              <div key={q.id} className="border border-nc-cyan/20 p-3 bg-nc-black/40">
                <div className="font-mono mb-2">
                  <span className="font-display text-nc-cyan tracking-widest mr-2">{q.id}.</span>
                  {q.prompt}
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
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
                        disabled={!played || submitted}
                        className={`text-left border ${cls} px-3 py-2 font-mono text-sm transition-colors`}
                      >
                        <span className="text-nc-muted mr-1">{i + 1})</span>
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

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="cyber-btn cyber-btn-yellow"
        >
          ▶ DECRYPT · SUBMIT
        </button>
      )}

      <AnimatePresence>
        {decoding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-nc-black/95 flex items-center justify-center"
          >
            <div className="matrix-rain text-sm leading-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="opacity-80" style={{ animation: `flicker ${0.3 + (i % 5) * 0.1}s linear infinite` }}>
                  {Array.from({ length: 60 })
                    .map(() => Math.random().toString(36).charAt(2))
                    .join(' ')}
                </div>
              ))}
              <div className="text-center text-nc-yellow font-display tracking-widest text-2xl mt-6 animate-flicker">
                DECRYPTING · {Math.min(100, Math.round(Object.keys(answers).length * 20))}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSummary && (
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
      )}
    </div>
  );
};
