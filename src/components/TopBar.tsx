import { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { setMuted, stopAmbient, playClick } from '../utils/audio';

export const TopBar = () => {
  const { muted, toggleMute, stage, reset } = useGame();

  // Keep audio module in sync with store. Persisted state on reload
  // and reset() both rely on this to propagate.
  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  const handleMute = () => {
    const next = !muted;
    setMuted(next);
    toggleMute();
    if (!next) playClick();
  };

  const handleReset = () => {
    if (!confirm('Сбросить прогресс и начать заново?')) return;
    playClick();
    stopAmbient();
    reset();
  };

  const setStage = useGame((s) => s.setStage);
  const handleLeaderboard = () => {
    playClick();
    setStage('leaderboard');
  };

  // Briefing has no progress yet → no point in showing RESET
  const showReset = stage !== 'briefing' && stage !== 'leaderboard';

  return (
    <div className="flex items-center justify-between border-b border-nc-cyan/20 bg-nc-black/85 backdrop-blur-sm px-4 py-2 z-30 relative">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="inline-block w-3 h-3 bg-nc-magenta animate-flicker shrink-0"
          style={{ boxShadow: '0 0 10px #FF003C' }}
        />
        <span className="font-display font-black tracking-[0.3em] text-nc-cyan text-sm whitespace-nowrap">
          CYBER VPR <span className="text-nc-yellow">2077</span>
        </span>
        <span className="hidden sm:inline-block label-tag border-l border-nc-cyan/30 pl-3 truncate">
          {stage === 'briefing' && 'NEURAL UPLINK // BRIEFING'}
          {stage === 'map' && 'NIGHT CITY // FREE ROAM'}
          {stage === 'mission' && 'OPERATION // ACTIVE'}
          {stage === 'finale' && 'DEBRIEFING // EOM'}
          {stage === 'leaderboard' && 'STREET HALL // LEADERBOARD'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {stage !== 'leaderboard' && (
          <button
            type="button"
            onClick={handleLeaderboard}
            className="text-xs font-display tracking-widest border border-nc-purple/40 text-nc-purple px-3 py-1 hover:bg-nc-purple/10 transition-colors hidden sm:block"
            title="Открыть таблицу лидеров"
          >
            ▣ LEADERBOARD
          </button>
        )}
        <button
          type="button"
          onClick={handleMute}
          className={`text-xs font-display tracking-widest border px-3 py-1 transition-colors ${
            muted
              ? 'border-nc-yellow/60 text-nc-yellow hover:bg-nc-yellow/10'
              : 'border-nc-cyan/40 hover:bg-nc-cyan/10 hover:text-nc-cyan'
          }`}
          title={muted ? 'Включить звук' : 'Выключить звук'}
        >
          {muted ? '♪ AUDIO ON' : '◊ MUTE'}
        </button>
        {showReset && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-display tracking-widest border border-nc-magenta/40 text-nc-magenta px-3 py-1 hover:bg-nc-magenta/10 transition-colors"
            title="Сбросить прогресс"
          >
            ⟲ RESET
          </button>
        )}
      </div>
    </div>
  );
};
