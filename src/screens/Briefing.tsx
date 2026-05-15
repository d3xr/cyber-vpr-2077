import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skyline } from '../components/Skyline';
import { OnboardingOverlay } from '../components/OnboardingOverlay';
import { SubjectBriefing } from '../components/SubjectBriefing';
import { useGame, getMissionsForSubject, SUBJECTS, isSubjectUnlocked, isSubjectPassed } from '../store/gameStore';
import { playClick } from '../utils/audio';
import { startRun } from '../api/leaderboard';
import { useSecretClicks, fireKorovanPrompt } from '../utils/useKonami';
import type { Subject } from '../types';

/**
 * Briefing — main menu in CP2077 style.
 *
 * Layout (desktop):
 *   ┌──────────────────────┬─────────────────┐
 *   │ LOGO                 │                 │
 *   │ ━━━━━━━━━━━━━        │                 │
 *   │ 01  ENGLISH       ▶  │   hero image    │
 *   │ 02  RUSSIAN       ▶  │   (city1.jpg    │
 *   │ 03  LITERATURE    ▶  │   blurred)      │
 *   │ 04  МАТЕМАТИКА    ▶  │                 │
 *   │ 05  CP2077 LORE   🔒 │                 │
 *   │ ━━━━━━━━━━━━━        │                 │
 *   │ CALLSIGN [____]       │                 │
 *   │ ▶ JACK IN             │                 │
 *   │ ▣ STREET HALL         │                 │
 *   │ v.2077                │                 │
 *   └──────────────────────┴─────────────────┘
 *
 * Visual rules (anti-clutter):
 *   - One primary accent: yellow #FCEE0A
 *   - Secondary: cyan only for muted info
 *   - Danger: magenta only for errors
 *   - No magenta/purple/green decorations
 *   - No scanlines/glitch on briefing — single backdrop only
 */
export const Briefing = () => {
  const [name, setName] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSubjectBriefing, setShowSubjectBriefing] = useState(false);

  const startGame = useGame((s) => s.startGame);
  const selectedSubject = useGame((s) => s.selectedSubject);
  const setSubject = useGame((s) => s.setSubject);
  const setRunId = useGame((s) => s.setRunId);
  const setStage = useGame((s) => s.setStage);
  const results = useGame((s) => s.results);
  const lastVariants = useGame((s) => s.lastVariants);
  const setVariantsFromServer = useGame((s) => s.setVariantsFromServer);

  // 7 rapid clicks on the logo within 3 seconds → opens the OLD-NET prompt.
  // The cb is wired to fireKorovanPrompt so App.tsx (which owns the modal)
  // gets notified via window event without prop drilling.
  const handleLogoClick = useSecretClicks(7, 3000, fireKorovanPrompt);

  // Magic-string cheat: if the operative types "korovan" into the callsign,
  // open the prompt and clear the field so name validation isn't stuck.
  const handleCallsignChange = (raw: string) => {
    if (raw.trim().toLowerCase() === 'korovan') {
      setName('');
      fireKorovanPrompt();
      return;
    }
    setName(raw);
  };

  // Mirror server-side CALLSIGN_RE so frontend rejects bad chars BEFORE the API trip.
  // No `<`, `>`, `&`, etc. — closes XSS surface and gives instant visual feedback.
  const CALLSIGN_RE = /^[A-Za-zА-Яа-яЁё0-9 \-_'.]{2,16}$/;
  const trimmedName = name.trim();
  const nameLen = trimmedName.length;
  const nameTooShort = nameLen > 0 && nameLen < 2;
  const nameTooLong = nameLen > 16;
  const nameBadChars = nameLen >= 2 && nameLen <= 16 && !CALLSIGN_RE.test(trimmedName);
  const nameValid = nameLen >= 2 && nameLen <= 16 && CALLSIGN_RE.test(trimmedName);
  const cpUnlocked = isSubjectUnlocked('cyberpunk_history', results);
  const passedCount = (['english', 'russian', 'literature', 'math'] as const).filter((g) =>
    isSubjectPassed(g, results),
  ).length;

  // Show onboarding on first visit only
  useEffect(() => {
    try {
      const seen = localStorage.getItem('cybervpr-onboarding-seen');
      if (!seen) setShowOnboarding(true);
    } catch {
      /* ignore */
    }
  }, []);

  const handleStart = async () => {
    if (!nameValid || starting) return;
    playClick();
    setStarting(true);
    setStartError(null);
    let aborted = false;
    try {
      // Ask server to NOT re-pick the variants the player just played for this subject.
      const exclude = lastVariants[selectedSubject];
      const r = await startRun(trimmedName, selectedSubject, exclude);
      setRunId(r.run_id);
      // Sync server-picked variants → client store so UI renders the same
      // questions the server will score against.
      setVariantsFromServer(selectedSubject, r.variants);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Try to parse server error JSON from message tail ("API 400: {...}")
      let reason: string | null = null;
      const match = msg.match(/\{.+\}$/);
      if (match) {
        try {
          const j = JSON.parse(match[0]) as { error?: string; reason?: string; max?: number };
          if (j.error === 'callsign_not_allowed') {
            setStartError('CALLSIGN: не пропустят в leaderboard, возьми другой.');
            aborted = true;
          } else if (j.error === 'bad_callsign') {
            const reasonMap: Record<string, string> = {
              too_short: 'CALLSIGN: минимум 2 символа.',
              too_long: `CALLSIGN: максимум ${j.max ?? 16} символов.`,
              invalid_chars: 'CALLSIGN: только буквы/цифры/пробел/-_.\'',
            };
            setStartError(reasonMap[j.reason ?? ''] ?? 'CALLSIGN: невалидный формат.');
            aborted = true;
          }
          reason = j.error ?? null;
        } catch {
          /* not JSON, fall through */
        }
      }
      if (!aborted && !reason) {
        // True network failure / 5xx — play offline.
        setStartError('OFFLINE_MODE · сервер недоступен, забег не попадёт в leaderboard.');
        setRunId(null);
      }
      if (aborted) {
        setStarting(false);
        return; // don't proceed to subject briefing — let user fix callsign
      }
    } finally {
      if (!aborted) {
        setStarting(false);
        // Subject-specific briefing → then map.
        setShowSubjectBriefing(true);
      }
    }
  };

  const handleBriefingDone = () => {
    setShowSubjectBriefing(false);
    startGame(trimmedName);
  };

  const handlePickSubject = (s: Subject) => {
    if (s === 'cyberpunk_history' && !cpUnlocked) return;
    playClick();
    setSubject(s);
  };

  const handleViewLeaderboard = () => {
    playClick();
    setStage('leaderboard');
  };

  return (
    <div className="bg-nc-black min-h-screen relative overflow-hidden text-nc-text">
      {/* Hero backdrop — full bleed on right, fades into menu on left */}
      <div className="absolute inset-0 pointer-events-none">
        <Skyline variant="night" />
        {/* Solid black gradient on left so menu stays readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(5,8,16,0.96) 0%, rgba(5,8,16,0.85) 40%, rgba(5,8,16,0.55) 70%, rgba(5,8,16,0.2) 100%)',
          }}
        />
      </div>

      {/* Top corner brackets — subtle CP2077 frame */}
      <div className="pointer-events-none absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-nc-yellow/60" />
      <div className="pointer-events-none absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-nc-yellow/60" />
      <div className="pointer-events-none absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-nc-yellow/60" />
      <div className="pointer-events-none absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-nc-yellow/60" />

      {/* Top channel info line */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-3 font-mono text-[0.65rem] text-nc-yellow/70 tracking-widest">
        <span className="inline-block w-1.5 h-1.5 bg-nc-magenta animate-flicker" />
        <span>CHANNEL 077 · ARASAKA NCDP-NET</span>
        <span className="ml-auto hidden sm:inline">{new Date().toISOString().slice(0, 10)}</span>
      </div>

      {/* MAIN GRID */}
      <div className="relative z-10 px-6 lg:px-16 pb-8 grid lg:grid-cols-[minmax(380px,1fr)_1fr] gap-12 items-center min-h-[calc(100vh-50px)]">
        {/* LEFT: Logo + menu */}
        <div className="space-y-8 max-w-lg">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="font-mono text-xs text-nc-yellow/70 tracking-[0.3em] mb-2">// MAIN MENU</div>
            <div
              className="font-display font-black text-nc-yellow leading-[0.9] tracking-tight whitespace-nowrap select-none"
              style={{
                fontSize: 'clamp(2.25rem, 5.2vw, 4.25rem)',
                textShadow: '0 0 32px rgba(252,238,10,0.55)',
                cursor: 'default',
              }}
              onClick={handleLogoClick}
              title="// CYBER VPR 2077"
            >
              CYBER VPR
              <br />
              <span className="text-white">2077</span>
            </div>
            <div className="h-0.5 w-32 bg-nc-yellow mt-3" />
          </motion.div>

          {/* Subject menu — vertical list, CP2077 style */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="space-y-1"
          >
            <div className="font-mono text-xs text-nc-yellow/70 tracking-[0.3em] mb-2">// SELECT TRACK</div>
            {SUBJECTS.map((s, i) => {
              const active = selectedSubject === s.id;
              const locked = s.id === 'cyberpunk_history' && !cpUnlocked;
              const passed = isSubjectPassed(s.id, results);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handlePickSubject(s.id)}
                  disabled={locked}
                  className={`group w-full text-left flex items-center gap-4 px-3 py-2.5 transition-all relative ${
                    locked
                      ? 'opacity-40 cursor-not-allowed'
                      : active
                      ? 'bg-nc-yellow/10'
                      : 'hover:bg-nc-yellow/5'
                  }`}
                >
                  {/* L-bracket on active item */}
                  {active && !locked && (
                    <>
                      <span className="absolute left-0 top-0 w-2 h-2 border-t-2 border-l-2 border-nc-yellow" />
                      <span className="absolute left-0 bottom-0 w-2 h-2 border-b-2 border-l-2 border-nc-yellow" />
                    </>
                  )}
                  <span
                    className={`font-mono text-sm tabular-nums w-8 ${
                      active ? 'text-nc-yellow' : 'text-nc-yellow/50'
                    }`}
                  >
                    0{i + 1}
                  </span>
                  <span
                    className={`font-display tracking-widest text-lg lg:text-xl flex-1 ${
                      locked ? 'text-nc-muted' : active ? 'text-nc-yellow' : 'text-white group-hover:text-nc-yellow'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="font-mono text-[0.65rem] text-nc-cyan/70 hidden sm:inline">
                    {s.ru}
                  </span>
                  <span
                    className={`font-mono text-sm w-6 text-right ${
                      locked
                        ? 'text-nc-muted'
                        : passed
                        ? 'text-nc-green'
                        : active
                        ? 'text-nc-yellow'
                        : 'text-nc-yellow/30 group-hover:text-nc-yellow'
                    }`}
                  >
                    {locked ? '🔒' : passed ? '✓' : active ? '▶' : '›'}
                  </span>
                </button>
              );
            })}
            {!cpUnlocked && (
              <div className="font-mono text-[0.65rem] text-nc-muted/80 mt-2 pl-12">
                ▣ CP2077 LORE locked · {passedCount}/4 cleared (need ≥4 grade)
              </div>
            )}
          </motion.div>

          {/* Callsign + JACK IN */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-3 pt-2 border-t border-nc-yellow/30"
          >
            <div>
              <label className="block">
                <div className="font-mono text-xs text-nc-yellow/70 tracking-[0.3em] mb-1.5">
                  // CALLSIGN
                </div>
                <input
                  className="w-full bg-transparent border-b-2 border-nc-yellow/40 focus:border-nc-yellow focus:outline-none px-1 py-2 font-display text-xl tracking-wider text-white placeholder-nc-yellow/30"
                  placeholder="ENTER YOUR HANDLE"
                  value={name}
                  onChange={(e) => handleCallsignChange(e.target.value)}
                  maxLength={16}
                  spellCheck={false}
                />
              </label>
              {/* Live client-side validation (instant feedback before API trip) */}
              {nameBadChars && !startError && (
                <div className="font-mono text-xs text-nc-magenta mt-2">
                  ⚠ Только буквы, цифры и <span className="text-nc-yellow">- _ . ' пробел</span>. Никаких &lt; &gt; / * &amp; и т.п.
                </div>
              )}
              {nameTooShort && !startError && (
                <div className="font-mono text-xs text-nc-yellow/70 mt-2">
                  ▣ Минимум 2 символа.
                </div>
              )}
              {nameTooLong && !startError && (
                <div className="font-mono text-xs text-nc-magenta mt-2">
                  ⚠ Максимум 16 символов (введено {nameLen}).
                </div>
              )}
              {startError && (
                <div className="font-mono text-xs text-nc-magenta mt-2 animate-flicker">
                  ⚠ {startError}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleStart}
                disabled={!nameValid || starting}
                className={`font-display text-base tracking-widest px-7 py-3 transition-all disabled:cursor-not-allowed ${
                  nameValid && !starting
                    ? 'bg-nc-yellow text-nc-black hover:brightness-110'
                    : 'bg-nc-black/60 text-nc-yellow/50 outline outline-2 outline-nc-yellow/40'
                }`}
                style={{
                  // Reliable clipped corners via clip-path — no augmented-ui pseudo-element
                  // dance that broke when CSS-vars switched on state change.
                  clipPath:
                    'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
                  boxShadow: nameValid && !starting ? '0 0 24px rgba(252,238,10,0.5)' : 'none',
                }}
              >
                {starting ? 'CONNECTING...' : '▶ JACK IN'}
              </button>
              <button
                type="button"
                onClick={handleViewLeaderboard}
                className="font-display text-xs tracking-[0.3em] text-nc-yellow/70 hover:text-nc-yellow transition-colors px-2 py-1"
              >
                ▣ STREET HALL
              </button>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="font-mono text-[0.6rem] text-nc-yellow/40 tracking-widest pt-4">
            v.2077.0428 · WAKAKO OKADA · NCDP UPLINK
          </div>
        </div>

        {/* RIGHT: Hero column with selected track info */}
        <motion.div
          key={selectedSubject}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:flex flex-col justify-end h-full pb-8 pl-8 border-l border-nc-yellow/20"
        >
          <SelectedTrackPanel
            subject={selectedSubject}
            missionCount={getMissionsForSubject(selectedSubject).length}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {showOnboarding && <OnboardingOverlay onDone={() => setShowOnboarding(false)} />}
        {showSubjectBriefing && (
          <SubjectBriefing subject={selectedSubject} onDone={handleBriefingDone} />
        )}
      </AnimatePresence>
    </div>
  );
};

const TRACK_DESCRIPTIONS: Record<Subject, { tagline: string; rules: string[] }> = {
  english: {
    tagline: 'NEURAL UPLINK · Watson, Westbrook, City Center, Pacifica',
    rules: ['4 миссий — listening, reading, grammar, writing', '25 баллов максимум', 'Wakako проверяет английский язык'],
  },
  russian: {
    tagline: 'LANG MATRIX · Watson Lang-Net Hub',
    rules: ['1 миссия, 5 вопросов', '18 случайных вариантов', 'Орфоэпия, морфология, синтаксис, лексика'],
  },
  literature: {
    tagline: 'STORYWEAVER · Heywood Old Moscow Databanks',
    rules: ['1 миссия, 5 вопросов', '14 фрагментов классиков (public domain)', 'Толстой, Крылов, Пушкин, Лермонтов'],
  },
  math: {
    tagline: 'CRYPTO BREAK · City Center · Arasaka Tower',
    rules: ['1 миссия, 5 вопросов', '17 случайных вариантов', 'Арифметика, задачи, геометрия, логика'],
  },
  cyberpunk_history: {
    tagline: 'WAKAKO-NET · LORE PROTOCOL',
    rules: ['1 миссия, 5 вопросов', '15 вариантов lore CP2077', 'Персонажи, локации, корпы, концовки'],
  },
};

const SelectedTrackPanel = ({ subject, missionCount }: { subject: Subject; missionCount: number }) => {
  const meta = SUBJECTS.find((s) => s.id === subject);
  const desc = TRACK_DESCRIPTIONS[subject];
  if (!meta) return null;

  return (
    <div
      data-augmented-ui="tl-2-clip-x tr-clip br-2-clip-x bl-clip border"
      className="space-y-4 max-w-md p-6 nc-panel"
      style={
        {
          '--aug-tl1': '0px',
          '--aug-tl2': '32px',
          '--aug-tr': '14px',
          '--aug-br1': '0px',
          '--aug-br2': '32px',
          '--aug-bl': '14px',
          '--aug-border-all': '1px',
          '--aug-border-bg': 'rgba(252,238,10,0.55)',
          '--aug-inlay-bg': 'rgba(10,14,20,0.65)',
        } as React.CSSProperties
      }
    >
      <div className="font-mono text-xs text-nc-yellow tracking-[0.3em]">// SELECTED TRACK</div>
      <div
        className="font-display text-4xl lg:text-5xl text-nc-yellow tracking-wider leading-none"
        style={{ textShadow: '0 0 24px rgba(252,238,10,0.4)' }}
      >
        {meta.label}
      </div>
      <div className="font-mono text-sm text-nc-cyan/80">{desc.tagline}</div>
      <ul className="space-y-1.5 font-mono text-xs text-nc-text/80">
        {desc.rules.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-nc-yellow/60">▸</span>
            <span>{r}</span>
          </li>
        ))}
        <li className="flex gap-2">
          <span className="text-nc-yellow/60">▸</span>
          <span>{missionCount} {missionCount === 1 ? 'миссия' : 'миссий'} в треке</span>
        </li>
      </ul>
      <div className="pt-3 border-t border-nc-yellow/20 font-mono text-[0.65rem] text-nc-yellow/50 tracking-widest">
        Tiebreaker: faster run = higher rank
      </div>
    </div>
  );
};
