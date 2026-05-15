import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skyline } from '../components/Skyline';
import { GlitchTitle } from '../components/GlitchTitle';
import { HudFrame } from '../components/HudFrame';
import { TopBar } from '../components/TopBar';
import { useGame, getMissionsForSubject } from '../store/gameStore';
import type { MCQuestion, BlankOption, ProfileField, Mission } from '../types';
import { endingWinBySubject, endingLoseBySubject } from '../data/dialogues';
import { DialogueBlock } from '../components/DialogueBlock';
import { playClick, stopAmbient } from '../utils/audio';
import { submitRun } from '../api/leaderboard';

/**
 * Grade is calibrated against actual subject max.
 * For 25-point English: ≥22 = 5, ≥15 = 4, ≥10 = 3, else 2.
 * For smaller-max subjects (5-point quiz): ≥5 = 5, ≥4 = 4, ≥3 = 3, else 2.
 * Threshold proportional to max.
 */
const grade = (total: number, max: number): { mark: number; verdict: string; tone: 'win' | 'mid' | 'lose' } => {
  const ratio = max > 0 ? total / max : 0;
  if (ratio >= 0.85) return { mark: 5, verdict: 'EDGERUNNER · S-TIER', tone: 'win' };
  if (ratio >= 0.6) return { mark: 4, verdict: 'NETRUNNER · A-TIER', tone: 'win' };
  if (ratio >= 0.4) return { mark: 3, verdict: 'STREET KID · B-TIER', tone: 'mid' };
  return { mark: 2, verdict: 'CHIP IT · RETRY', tone: 'lose' };
};

/**
 * Convert per-mission results (which store option TEXT in answers) back to
 * option INDEX form expected by the backend submitRun API.
 */
const buildSubmitAnswers = (
  missions: Mission[],
  results: ReturnType<typeof useGame.getState>['results'],
  selectedVariant: Record<string, number>,
): Record<string, Record<string, number>> => {
  const out: Record<string, Record<string, number>> = {};
  for (const m of missions) {
    const r = results[m.id];
    if (!r) continue;
    if (m.skill === 'writing') continue;

    const variantIdx = selectedVariant[m.id] ?? 0;
    const variant = m.variants?.[variantIdx];
    const questions = variant?.questions ?? m.questions ?? [];
    const blanks = variant?.blanks ?? m.blanks ?? [];
    const map: Record<string, number> = {};

    for (const q of questions) {
      const text = r.answers[q.id] as string;
      const idx = q.options.indexOf(text);
      if (idx >= 0) map[q.id] = idx;
    }
    for (const b of blanks) {
      const text = r.answers[String(b.id)] as string;
      const idx = b.options.indexOf(text);
      if (idx >= 0) map[String(b.id)] = idx;
    }
    out[m.id] = map;
  }
  return out;
};

export const Finale = () => {
  const { results, player, reset, setStage, selectedSubject, selectedVariant, runId } = useGame();
  const setRunId = useGame((s) => s.setRunId);
  const setServerScore = useGame((s) => s.setServerScore);
  const [mode, setMode] = useState<'summary' | 'mistakes'>('summary');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const submittedRef = useRef(false);

  const missions = getMissionsForSubject(selectedSubject);

  // Submit run to leaderboard backend exactly once on mount.
  useEffect(() => {
    if (submittedRef.current) return;
    if (!runId) {
      // Played offline — no run id, nothing to submit.
      setSubmitState('idle');
      submittedRef.current = true;
      return;
    }
    submittedRef.current = true;
    setSubmitState('submitting');
    const answers = buildSubmitAnswers(missions, results, selectedVariant);
    submitRun(runId, answers)
      .then((r) => {
        setServerScore(r.score);
        setSubmitState('submitted');
      })
      .catch(() => {
        setSubmitState('error');
      })
      .finally(() => {
        // Clear the run id so a retry doesn't re-submit the same one.
        setRunId(null);
      });
  }, [runId, missions, results, selectedVariant, setRunId, setServerScore]);

  const total = useMemo(
    () =>
      missions
        .map((m) => results[m.id])
        .filter(Boolean)
        .reduce((a, x) => a + x.earned, 0),
    [results, missions],
  );
  const max = missions.reduce((a, m) => a + m.maxPoints, 0);
  const g = grade(total, max);
  const win = total / Math.max(1, max) >= 0.6;

  const handleReplay = () => {
    playClick();
    stopAmbient();
    reset();
  };

  const handleBackToMap = () => {
    playClick();
    setStage('map');
  };

  const handleLeaderboard = () => {
    playClick();
    setStage('leaderboard');
  };

  return (
    <div className="bg-grid min-h-screen relative overflow-hidden">
      <Skyline variant={g.tone === 'win' ? 'sunrise' : g.tone === 'lose' ? 'rain' : 'night'} />
      <div className="relative z-10">
        <TopBar />
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-5">
          <div>
            <div className="label-tag">{win ? '// EOM · MISSION COMPLETE' : '// EOM · RETRY ADVISED'}</div>
            <GlitchTitle
              text={win ? 'MISSION COMPLETE' : 'MISSION FAILED — RETRY?'}
              className={`text-3xl lg:text-6xl ${win ? 'text-nc-yellow' : 'text-nc-magenta'}`}
            />
            <div className="font-display tracking-[0.3em] text-nc-cyan mt-2 text-sm">
              OPERATIVE: <span className="text-nc-text">{player.nickname || '—'}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <HudFrame
                  label="SCORECARD"
                  color={win ? 'green' : 'yellow'}
                  className="p-5 lg:p-6 bg-nc-dark/85"
                >
                  <div className="grid lg:grid-cols-[1fr_auto] items-center gap-5">
                    <div>
                      <div className="label-tag mb-1">TOTAL SCORE</div>
                      <div className="font-display text-5xl lg:text-6xl">
                        <span className={win ? 'text-nc-green' : 'text-nc-magenta'}>{total}</span>
                        <span className="text-nc-muted text-3xl"> / {max}</span>
                      </div>
                      <div className="font-display text-nc-yellow tracking-widest mt-2">{g.verdict}</div>
                      <div className="font-mono text-sm text-nc-muted mt-1">
                        Школьная оценка ВПР: <span className="text-nc-cyan font-display">{g.mark}</span>
                        <span className="ml-2 text-xs">
                          (по соотношению к max: ≥40% = 3 · ≥60% = 4 · ≥85% = 5)
                        </span>
                      </div>
                      <div className="font-mono text-xs text-nc-muted mt-1">
                        Трек: <span className="text-nc-cyan uppercase">{selectedSubject}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {missions.map((m) => {
                        const r = results[m.id];
                        const pct = r ? r.earned / m.maxPoints : 0;
                        const cls =
                          pct >= 0.8 ? 'border-nc-green text-nc-green'
                          : pct >= 0.5 ? 'border-nc-yellow text-nc-yellow'
                          : 'border-nc-magenta text-nc-magenta';
                        return (
                          <div key={m.id} className={`border ${cls} p-2 bg-nc-black/40 min-w-[140px]`}>
                            <div className="font-display text-[0.65rem] tracking-widest text-nc-muted">
                              {m.code}
                            </div>
                            <div className="font-display text-2xl">
                              {r ? r.earned : 0}
                              <span className="text-nc-muted text-sm"> / {m.maxPoints}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </HudFrame>


                <HudFrame
                  label={win ? 'TRANSMISSION' : 'JOHNNY · INCOMING'}
                  color={win ? 'cyan' : 'magenta'}
                  className="p-5 bg-nc-dark/85"
                >
                  <DialogueBlock lines={win ? endingWinBySubject[selectedSubject] : endingLoseBySubject[selectedSubject]} />
                </HudFrame>

                {selectedSubject === 'english' && (
                  <HudFrame label="WRITING REVIEW · FOR PARENT" color="purple" className="p-5 bg-nc-dark/80">
                    <WritingReview />
                  </HudFrame>
                )}

                {/* Leaderboard submission status */}
                <HudFrame
                  label="// LEADERBOARD UPLINK"
                  color={submitState === 'submitted' ? 'green' : submitState === 'error' ? 'magenta' : 'cyan'}
                  className="p-4 bg-nc-dark/85"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="font-mono text-sm">
                      {submitState === 'submitting' && (
                        <span className="text-nc-cyan animate-flicker">▣ UPLOADING SCORE TO STREET HALL...</span>
                      )}
                      {submitState === 'submitted' && (
                        <span className="text-nc-green">✓ SCORE SUBMITTED · ты в leaderboard'е</span>
                      )}
                      {submitState === 'error' && (
                        <span className="text-nc-magenta">⚠ Сервер не ответил — забег записан только локально</span>
                      )}
                      {submitState === 'idle' && (
                        <span className="text-nc-muted">▣ Offline run · score not submitted</span>
                      )}
                    </div>
                    <button type="button" onClick={handleLeaderboard} className="cyber-btn cyber-btn-purple text-sm">
                      ▣ VIEW LEADERBOARD
                    </button>
                  </div>
                </HudFrame>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setMode('mistakes');
                    }}
                    className="cyber-btn cyber-btn-purple"
                  >
                    [ SHOW MISTAKES ]
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMap}
                    className="cyber-btn"
                  >
                    [ BACK TO MAP ]
                  </button>
                  <button
                    type="button"
                    onClick={handleReplay}
                    className="cyber-btn cyber-btn-yellow"
                  >
                    [ NEW RUN ]
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'mistakes' && (
              <motion.div
                key="mistakes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <MistakesView />
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setMode('summary');
                  }}
                  className="cyber-btn"
                >
                  ◂ BACK
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="scanline-roll" />
    </div>
  );
};

const WritingReview = () => {
  const results = useGame((s) => s.results);
  const selectedSubject = useGame((s) => s.selectedSubject);
  const subjectMissions = getMissionsForSubject(selectedSubject);
  const writing = subjectMissions.find((m) => m.skill === 'writing');
  if (!writing) return null;
  const r = results[writing.id];
  if (!r) return <div className="font-mono text-nc-muted text-sm">Анкета не заполнена.</div>;

  const fields = (writing.fields ?? []) as ProfileField[];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {fields.map((f) => {
        const v = (r.answers[f.id] as string) || '';
        return (
          <div key={f.id} className="border border-nc-purple/30 p-3 bg-nc-black/40">
            <div className="label-tag mb-1">{f.label}</div>
            <div className="font-mono text-sm text-nc-text break-words min-h-[1.2em]">
              {v || <span className="text-nc-muted">— empty —</span>}
            </div>
          </div>
        );
      })}
      <div className="sm:col-span-2 border border-nc-yellow/30 p-3 bg-nc-yellow/5 text-xs font-mono text-nc-yellow">
        ▣ Родителю: проверь орфографию и осмысленность ответов. Игра принимает любой ввод нужной длины,
        чтобы не наказывать ребёнка — но реальный ВПР проверяет грамотность. Возьми пять минут и пройдись
        по этому списку с ребёнком.
      </div>
    </div>
  );
};

const MistakesView = () => {
  const results = useGame((s) => s.results);
  const selectedVariant = useGame((s) => s.selectedVariant);
  const selectedSubject = useGame((s) => s.selectedSubject);
  const subjectMissions = getMissionsForSubject(selectedSubject);

  return (
    <>
      {subjectMissions.map((m) => {
        const r = results[m.id];
        if (!r) return null;

        // Resolve active variant for variant-based missions
        const variantIdx = selectedVariant[m.id] ?? 0;
        const variant = m.variants?.[variantIdx];
        const variantBlanks = (variant?.blanks ?? m.blanks ?? []) as BlankOption[];
        const variantQuestions = (variant?.questions ?? m.questions ?? []) as MCQuestion[];

        if (m.skill === 'writing') {
          const fields = (m.fields ?? []) as ProfileField[];
          return (
            <HudFrame key={m.id} label={`SHOW MISTAKES · ${m.code}`} color="magenta" className="p-5 bg-nc-dark/85">
              <div className="font-display text-nc-yellow text-lg mb-3">{m.title}</div>
              <div className="font-mono text-sm space-y-1.5 text-nc-text/90">
                {fields.map((f) => (
                  <div key={f.id}>
                    <span className="text-nc-cyan">{f.label}:</span>{' '}
                    <span className="text-nc-text">{(r.answers[f.id] as string) || '—'}</span>
                  </div>
                ))}
                <div className="mt-2 text-xs text-nc-muted">
                  В письме нет «правильных ответов» — все эти поля персональные. Главное — заполнить
                  все строки полным предложением там, где просят.
                </div>
              </div>
            </HudFrame>
          );
        }

        if (m.skill === 'grammar') {
          const blanks = variantBlanks;
          return (
            <HudFrame key={m.id} label={`SHOW MISTAKES · ${m.code}`} color="magenta" className="p-5 bg-nc-dark/85">
              <div className="font-display text-nc-yellow text-lg mb-3">{m.title}</div>
              <div className="space-y-3">
                {blanks.map((b) => {
                  const userValue = r.answers[`${b.id}`] as string;
                  const correct = b.options[b.answer];
                  const ok = userValue === correct;
                  return (
                    <div
                      key={b.id}
                      className={`border p-3 ${ok ? 'border-nc-green/40' : 'border-nc-magenta/40'} bg-nc-black/40`}
                    >
                      <div className="font-mono text-sm">
                        <span className="text-nc-cyan">({b.id})</span> {ok ? '✓' : '✗'} ответ:{' '}
                        <span className={ok ? 'text-nc-green' : 'text-nc-magenta'}>{userValue || '—'}</span>
                        {!ok && (
                          <>
                            {' '}· правильно:{' '}
                            <span className="text-nc-green">{correct}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-nc-muted mt-1 leading-relaxed">{b.explanation}</div>
                    </div>
                  );
                })}
              </div>
            </HudFrame>
          );
        }

        const questions = variantQuestions;
        return (
          <HudFrame key={m.id} label={`SHOW MISTAKES · ${m.code}`} color="magenta" className="p-5 bg-nc-dark/85">
            <div className="font-display text-nc-yellow text-lg mb-3">{m.title}</div>
            <div className="space-y-3">
              {questions.map((q) => {
                const userValue = r.answers[q.id] as string;
                const correct = q.options[q.answer];
                const ok = userValue === correct;
                return (
                  <div
                    key={q.id}
                    className={`border p-3 ${ok ? 'border-nc-green/40' : 'border-nc-magenta/40'} bg-nc-black/40`}
                  >
                    <div className="font-mono text-sm">
                      <span className="text-nc-cyan">{q.id}.</span> {q.prompt}
                    </div>
                    <div className="font-mono text-sm mt-1">
                      {ok ? '✓' : '✗'} твой ответ:{' '}
                      <span className={ok ? 'text-nc-green' : 'text-nc-magenta'}>{userValue || '—'}</span>
                      {!ok && (
                        <>
                          {' '}· правильно:{' '}
                          <span className="text-nc-green">{correct}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-nc-muted mt-1 leading-relaxed">{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          </HudFrame>
        );
      })}
    </>
  );
};
