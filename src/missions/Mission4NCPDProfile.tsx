import { useState } from 'react';
import { motion } from 'framer-motion';
import { HudFrame } from '../components/HudFrame';
import { GlitchTitle } from '../components/GlitchTitle';
import { MissionHero } from '../components/MissionHero';
import { MissionResultPanel } from '../components/MissionResultPanel';
import { useGame } from '../store/gameStore';
import { playClick, playCorrect, playWrong, playMissionComplete } from '../utils/audio';
import type { Mission, ProfileField } from '../types';

interface Props {
  mission: Mission;
}

// Real-word check: contains both a vowel AND a consonant.
// Filters out junk like "aaaa", "xxxxx", "bcdf" etc.
const isRealWord = (w: string): boolean => {
  const lower = w.toLowerCase();
  return /[aeiouy]/.test(lower) && /[bcdfghjklmnpqrstvwxz]/.test(lower);
};

// Text field: must look like a name/word (Latin letters with allowed punctuation).
// Allows: "Bulat", "John", "Saint-Petersburg", "O'Connor"
// Rejects: "Bul4t", "12345", "!!!"
const isPlausibleTextField = (s: string): boolean => {
  const trimmed = s.trim();
  if (!/^[A-Za-z][A-Za-z\s\-']*$/.test(trimmed)) return false;
  // At least one of the space-separated tokens must be a real word.
  return trimmed.split(/\s+/).some(isRealWord);
};

const isFieldValid = (f: ProfileField, value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed.length < f.minLength) return false;
  if (f.kind === 'number') {
    const n = Number(trimmed);
    if (Number.isNaN(n)) return false;
    if (f.min !== undefined && n < f.min) return false;
    if (f.max !== undefined && n > f.max) return false;
    return true;
  }
  if (f.kind === 'sentence') {
    // sentence: ≥2 unique words, each ≥2 chars, each looks like a real word
    const words = trimmed.split(/\s+/).filter((w) => w.length >= 2);
    const realWords = words.filter(isRealWord);
    if (realWords.length < 2) return false;
    const unique = new Set(realWords.map((w) => w.toLowerCase()));
    return unique.size >= 2;
  }
  return isPlausibleTextField(trimmed);
};

export const Mission4NCPDProfile = ({ mission }: Props) => {
  const completeMission = useGame((s) => s.completeMission);
  const fields = (mission.fields ?? []) as ProfileField[];

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, ''])),
  );
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [shake, setShake] = useState(false);

  const setField = (id: string, value: string) => {
    if (submitted) return;
    setValues({ ...values, [id]: value });
  };

  const handleSubmit = () => {
    playClick();
    setShowErrors(true);
    let earned = 0;
    fields.forEach((f) => {
      if (isFieldValid(f, values[f.id])) earned += f.points;
    });
    setSubmitted(true);
    if (earned === mission.maxPoints) playMissionComplete();
    else if (earned >= Math.ceil(mission.maxPoints * 0.6)) playCorrect();
    else playWrong();
    if (earned < mission.maxPoints) {
      setShake(true);
      setTimeout(() => setShake(false), 220);
    }
    completeMission({
      missionId: mission.id,
      earned,
      max: mission.maxPoints,
      answers: values,
      completedAt: Date.now(),
    });
  };

  const earnedPreview = fields.reduce(
    (acc, f) => acc + (isFieldValid(f, values[f.id]) ? f.points : 0),
    0,
  );

  return (
    <div className={shake ? 'shake-screen' : ''}>
      <MissionHero skill={mission.skill} />
      <div className="mb-4">
        <div className="label-tag">// WRITING · 10 PTS · NCPD UPLINK</div>
        <GlitchTitle text={mission.title} className="text-3xl lg:text-5xl text-nc-magenta" />
      </div>

      <HudFrame label="NCPD DOSSIER · FORM" color="yellow" className="p-5 lg:p-6 bg-nc-dark/90 mb-5">
        <div className="font-mono text-xs text-nc-yellow mb-4">
          ▣ FIXER request: complete operative profile in English. Don't leave fields blank.
          <br />
          <span className="text-nc-muted">Заполняй на английском. Каждое поле — балл (или два).</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => {
            const v = values[f.id];
            const ok = isFieldValid(f, v);
            const showRed = showErrors && !ok;
            const cls = showRed
              ? 'border-nc-magenta'
              : ok
              ? 'border-nc-green/60'
              : 'border-nc-cyan/40';
            return (
              <motion.label
                key={f.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="block"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="label-tag">▸ {f.label}</span>
                  <span
                    className={`text-[0.65rem] font-mono ${
                      ok ? 'text-nc-green' : showRed ? 'text-nc-magenta' : 'text-nc-muted'
                    }`}
                  >
                    {ok ? `+${f.points} PTS` : `${f.points} PTS · empty`}
                  </span>
                </div>
                {f.kind === 'sentence' ? (
                  <textarea
                    rows={2}
                    className={`cyber-input w-full ${cls}`}
                    placeholder={f.placeholder}
                    value={v}
                    onChange={(e) => setField(f.id, e.target.value)}
                    disabled={submitted}
                    maxLength={120}
                  />
                ) : (
                  <input
                    type={f.kind === 'number' ? 'number' : 'text'}
                    className={`cyber-input w-full ${cls}`}
                    placeholder={f.placeholder}
                    value={v}
                    onChange={(e) => setField(f.id, e.target.value)}
                    disabled={submitted}
                    min={f.min}
                    max={f.max}
                    maxLength={40}
                  />
                )}
                {showRed && (
                  <div className="text-xs text-nc-magenta font-mono mt-1">
                    {f.kind === 'number'
                      ? `⚠ Возраст числом от ${f.min} до ${f.max}.`
                      : f.kind === 'sentence'
                      ? `⚠ Минимум 2 разных слова на английском, по 2+ буквы.`
                      : `⚠ Только английские буквы, без цифр. Минимум ${f.minLength} символа.`}
                  </div>
                )}
              </motion.label>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-nc-cyan/20 pt-3 font-mono text-sm">
          <span className="text-nc-muted">PROFILE COMPLETION</span>
          <span className="text-nc-yellow">
            {earnedPreview} / {mission.maxPoints} PTS
          </span>
        </div>
      </HudFrame>

      {!submitted && (
        <button type="button" onClick={handleSubmit} className="cyber-btn cyber-btn-yellow">
          ▶ UPLOAD TO NCPD · SUBMIT
        </button>
      )}

      {submitted && (
        <MissionResultPanel
          missionTitle={mission.title}
          earned={earnedPreview}
          max={mission.maxPoints}
          rows={fields.map((f) => {
            const v = values[f.id];
            const ok = isFieldValid(f, v);
            return {
              id: f.label,
              ok,
              user: v || '',
              correct: ok ? v : '(filled, valid)',
              explanation: ok
                ? `Принято. Это поле проверит родитель — главное, что ответ есть и осмысленный.`
                : `Не зачтено. На ВПР это потеря балла. ${
                    f.kind === 'sentence'
                      ? 'Нужно минимум 2 разных слова на английском (не одинаковые, по 2+ буквы).'
                      : f.kind === 'number'
                      ? `Возраст числом от ${f.min} до ${f.max}.`
                      : `Только английские буквы (a–z), без цифр и спецсимволов. Минимум ${f.minLength} символа.`
                  }`,
            };
          })}
        />
      )}
    </div>
  );
};
