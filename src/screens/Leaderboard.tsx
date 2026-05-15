import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { HudFrame } from '../components/HudFrame';
import { GlitchTitle } from '../components/GlitchTitle';
import { useGame, SUBJECTS } from '../store/gameStore';
import { fetchLeaderboard, type LeaderboardEntry, type LeaderboardAggregate } from '../api/leaderboard';
import type { Subject } from '../types';
import { playClick } from '../utils/audio';

type Tab = 'global' | Subject;

const TAB_LABELS: Record<Tab, string> = {
  global: 'GLOBAL · ALL',
  english: 'ENGLISH',
  russian: 'RUSSIAN',
  literature: 'LITERATURE',
  math: 'MATH',
  cyberpunk_history: 'CP LORE',
};

const formatDuration = (ms: number): string => {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
};

export const Leaderboard = () => {
  const setStage = useGame((s) => s.setStage);
  const player = useGame((s) => s.player);
  const [tab, setTab] = useState<Tab>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [aggregates, setAggregates] = useState<LeaderboardAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const subjectArg = tab === 'global' ? undefined : tab;
    fetchLeaderboard(subjectArg)
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries);
        setAggregates(data.aggregates ?? []);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, tick]);

  const handleBack = () => {
    playClick();
    setStage(player.nickname ? 'map' : 'briefing');
  };

  const handleRefresh = () => {
    playClick();
    setTick((t) => t + 1);
  };

  const isOwn = (callsign: string) =>
    player.name && callsign.toLowerCase() === player.name.toLowerCase();

  return (
    // Fullscreen overlay so leaderboard always sits above mission content during
    // AnimatePresence transition. CHROMA U18: leaderboard was rendering under
    // mission UI when opened from TopBar mid-mission.
    <div className="fixed inset-0 z-40 overflow-y-auto bg-nc-black">
      <Layout showSides={false}>
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="label-tag">// LEADERBOARD · NCDP-NET</div>
              <GlitchTitle text="STREET HALL OF FAME" className="text-2xl lg:text-4xl text-nc-yellow" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleRefresh} className="cyber-btn text-sm">
                ↻ REFRESH
              </button>
              <button type="button" onClick={handleBack} className="cyber-btn text-sm">
                ◂ BACK
              </button>
            </div>
          </div>

        <HudFrame label="// FILTER · SUBJECT" color="cyan" className="p-3 bg-nc-dark/80">
          <div className="flex gap-2 flex-wrap">
            {(['global', 'english', 'russian', 'literature', 'math', 'cyberpunk_history'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  playClick();
                  setTab(t);
                }}
                className={`cyber-btn text-xs ${tab === t ? 'cyber-btn-yellow' : ''}`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </HudFrame>

        {loading && (
          <HudFrame label="LOADING" color="cyan" className="p-5 bg-nc-dark/85">
            <div className="font-mono text-nc-cyan animate-flicker">▣ FETCHING LEADERBOARD...</div>
          </HudFrame>
        )}

        {error && (
          <HudFrame label="ERROR · API DOWN" color="magenta" className="p-5 bg-nc-dark/85">
            <div className="font-mono text-nc-magenta">⚠ {error}</div>
            <div className="font-mono text-xs text-nc-muted mt-2">
              Сервер может быть оффлайн. Попробуй REFRESH через минуту.
            </div>
          </HudFrame>
        )}

        {!loading && !error && tab === 'global' && aggregates.length > 0 && (
          <HudFrame
            label="// GLOBAL TOTALS · TOP CALLSIGNS"
            color="yellow"
            className="p-4 bg-nc-dark/85"
          >
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="text-nc-yellow border-b border-nc-yellow/30">
                    <th className="text-left p-2 w-12">#</th>
                    <th className="text-left p-2">CALLSIGN</th>
                    <th className="text-right p-2">SCORE</th>
                    <th className="text-right p-2 hidden sm:table-cell">MAX</th>
                    <th className="text-right p-2 hidden sm:table-cell">RUNS</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.slice(0, 50).map((a, i) => (
                    <motion.tr
                      key={a.callsign + i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-nc-cyan/10 ${
                        isOwn(a.callsign) ? 'bg-nc-yellow/10 text-nc-yellow' : 'text-nc-text/90'
                      }`}
                    >
                      <td className="p-2 text-nc-muted">{i + 1}</td>
                      <td className="p-2 truncate max-w-[200px]">{a.callsign}</td>
                      <td className="p-2 text-right text-nc-cyan font-display">{a.total_score}</td>
                      <td className="p-2 text-right text-nc-muted hidden sm:table-cell">{a.total_max}</td>
                      <td className="p-2 text-right text-nc-muted hidden sm:table-cell">{a.runs}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudFrame>
        )}

        {!loading && !error && (
          <HudFrame
            label={`// ${tab === 'global' ? 'INDIVIDUAL RUNS' : `${TAB_LABELS[tab]} · BEST RUNS`}`}
            color="purple"
            className="p-4 bg-nc-dark/85"
          >
            {entries.length === 0 ? (
              <div className="font-mono text-nc-muted text-sm">
                ▣ Пока никого. Будь первым — пройди трек и попади на доску.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="text-nc-purple border-b border-nc-purple/30">
                      <th className="text-left p-2 w-12">#</th>
                      <th className="text-left p-2">CALLSIGN</th>
                      {tab === 'global' && <th className="text-left p-2 hidden md:table-cell">TRACK</th>}
                      <th className="text-right p-2">SCORE</th>
                      <th className="text-right p-2 hidden sm:table-cell">TIME</th>
                      <th className="text-right p-2 hidden md:table-cell">DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, i) => (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-nc-cyan/10 ${
                          isOwn(e.callsign) ? 'bg-nc-yellow/10 text-nc-yellow' : 'text-nc-text/90'
                        }`}
                      >
                        <td className="p-2 text-nc-muted">{i + 1}</td>
                        <td className="p-2 truncate max-w-[160px]">{e.callsign}</td>
                        {tab === 'global' && (
                          <td className="p-2 text-nc-cyan/70 hidden md:table-cell">
                            {SUBJECTS.find((s) => s.id === e.subject)?.label ?? e.subject}
                          </td>
                        )}
                        <td className="p-2 text-right">
                          <span className="text-nc-green font-display">{e.score}</span>
                          <span className="text-nc-muted">/{e.max_score}</span>
                        </td>
                        <td className="p-2 text-right text-nc-muted hidden sm:table-cell">
                          {formatDuration(e.duration_ms)}
                        </td>
                        <td className="p-2 text-right text-nc-muted hidden md:table-cell">
                          {formatTime(e.created_at)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </HudFrame>
        )}

          <div className="font-mono text-[0.65rem] text-nc-muted text-center">
            ▣ Tiebreaker: при равных очках выше тот, кто прошёл быстрее. Несколько попыток — норма, каждая в таблице.
          </div>
        </div>
      </Layout>
    </div>
  );
};
