import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { HudFrame } from '../components/HudFrame';
import { GlitchTitle } from '../components/GlitchTitle';
import { MissionResultPanel } from '../components/MissionResultPanel';
import { Typewriter } from '../components/Typewriter';
import { useGame, useActiveVariant } from '../store/gameStore';
import { playClick, playCorrect, playWrong, playMissionComplete } from '../utils/audio';
import { playSpoken, cancelSpeech, type AudioHandle } from '../utils/speech';
import type { Mission, MCQuestion, ThemeColor } from '../types';

interface Props {
  mission: Mission;
}

const SUBJECT_LABELS: Record<string, { skillLabel: string; cyberLabel: string }> = {
  russian:           { skillLabel: 'РУССКИЙ ЯЗЫК · 5 PTS',     cyberLabel: '// LANG MATRIX' },
  literature:        { skillLabel: 'ЛИТЕРАТУРА · 5 PTS',        cyberLabel: '// STORYWEAVER' },
  math:              { skillLabel: 'МАТЕМАТИКА · 5 PTS',        cyberLabel: '// CRYPTO BREAK' },
  english:           { skillLabel: 'ENGLISH · 5 PTS',           cyberLabel: '// NEURAL UPLINK' },
  cyberpunk_history: { skillLabel: 'CP2077 LORE · 5 PTS',       cyberLabel: '// WAKAKO-NET' },
};

export const MissionGenericQuiz = ({ mission }: Props) => {
  const completeMission = useGame((s) => s.completeMission);
  const variant = useActiveVariant(mission);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(false);

  const questions = (variant.questions ?? []) as MCQuestion[];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const subject = mission.subject ?? 'english';
  const labels = SUBJECT_LABELS[subject] ?? SUBJECT_LABELS.english;
  const themeColor: ThemeColor = mission.themeColor ?? 'cyan';

  const titleColorClass = (
    {
      cyan: 'text-nc-cyan',
      yellow: 'text-nc-yellow',
      magenta: 'text-nc-magenta',
      purple: 'text-nc-purple',
      green: 'text-nc-green',
    } as Record<ThemeColor, string>
  )[themeColor];

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
    else if (earned >= Math.ceil(questions.length * 0.6)) playCorrect();
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

  // Pre-rendered Edge TTS mp3s live at /sounds/missions/<mid>__<vid>__<key>.mp3.
  // playSpoken first tries the file; if 404/load-error, it falls back to Web Speech.
  const audioRef = useRef<AudioHandle | null>(null);
  const stopCurrentAudio = () => {
    audioRef.current?.stop();
    audioRef.current = null;
    cancelSpeech();
  };

  const handleSpeakDatapad = () => {
    if (!variant.datapad) return;
    stopCurrentAudio();
    const path = `/sounds/missions/${mission.id}__${variant.id}__datapad.mp3`;
    audioRef.current = playSpoken(path, variant.datapad, { rate: 1.0 });
  };

  const handleSpeakQuestion = (qid: string, text: string) => {
    stopCurrentAudio();
    const path = `/sounds/missions/${mission.id}__${variant.id}__${qid}.mp3`;
    audioRef.current = playSpoken(path, text, { rate: 1.0 });
  };

  const earned = questions.filter((q) => answers[q.id] === q.answer).length;

  return (
    <div className={shake ? 'shake-screen' : ''}>
      <div className="mb-4">
        <div className="label-tag">{labels.cyberLabel} · {labels.skillLabel}</div>
        <GlitchTitle text={mission.title} className={`text-3xl lg:text-5xl ${titleColorClass}`} />
        <div className="font-mono text-nc-muted text-sm mt-1">
          ▣ {mission.districtTag} · variant <span className="text-nc-cyan">{variant.id}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* DATAPAD / PROBLEM TEXT */}
        <HudFrame label="DATAPAD · INPUT" color={themeColor} className="p-5 bg-nc-dark/90">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className={`font-display text-sm tracking-widest ${titleColorClass}`}>
              {mission.code}
            </div>
            {variant.datapad && (
              <button
                type="button"
                onClick={handleSpeakDatapad}
                className="font-mono text-[0.65rem] text-nc-cyan border border-nc-cyan/30 px-2 py-0.5 hover:bg-nc-cyan/10"
                title="Озвучить текст"
              >
                ▶ ОЗВУЧИТЬ
              </button>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-nc-text leading-relaxed text-sm bg-nc-black/60 p-4 border border-nc-cyan/20 relative whitespace-pre-line min-h-[120px]"
          >
            {variant.datapad ? (
              <Typewriter text={variant.datapad} speed={8} />
            ) : null}
            <span className={`${titleColorClass} animate-cursor`}>▮</span>
          </motion.div>
        </HudFrame>

        {/* QUESTIONS */}
        <HudFrame label="VERIFY · A–E" color="cyan" className="p-5 bg-nc-dark/85">
          <div className="space-y-3">
            {questions.map((q) => {
              const userAnswer = answers[q.id];
              return (
                <div key={q.id} className="border border-nc-cyan/20 p-3 bg-nc-black/40">
                  <div className="font-mono mb-2 flex items-baseline gap-2">
                    <span className={`font-display tracking-widest mr-1 ${titleColorClass}`}>{q.id}.</span>
                    <span className="flex-1">{q.prompt}</span>
                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(q.id, q.prompt)}
                      className="font-mono text-[0.6rem] text-nc-cyan/70 border border-nc-cyan/20 px-1.5 py-0.5 hover:bg-nc-cyan/10 shrink-0"
                      title="Озвучить вопрос"
                    >
                      ▶
                    </button>
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
            ▶ SUBMIT · DECRYPT
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
