import { useGame, getMissionsForSubject } from '../store/gameStore';
import { HudFrame } from './HudFrame';
import { OperativePortrait } from './OperativePortrait';

export const BioMonitor = () => {
  const { player, streetcred, hp, results, currentMissionIndex, stage, selectedSubject } = useGame();
  const missions = getMissionsForSubject(selectedSubject);
  const subjectResults = missions.map((m) => results[m.id]).filter(Boolean);
  const totalEarned = subjectResults.reduce((a, x) => a + x.earned, 0);
  const totalMax = missions.reduce((a, m) => a + m.maxPoints, 0);

  return (
    <HudFrame label="BIO-MONITOR" color="cyan" className="p-4 text-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <OperativePortrait seed={player.nickname || 'V'} size={128} />
        </div>
        <div>
          <div className="label-tag mb-1">OPERATIVE</div>
          <div className="font-display text-nc-yellow text-lg leading-tight tracking-wider break-words">
            {player.nickname || 'UNKNOWN'}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="label-tag">STREETCRED</span>
            <span className="font-mono text-nc-cyan">{streetcred}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${streetcred}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="label-tag">HP</span>
            <span className="font-mono text-nc-magenta">{hp}</span>
          </div>
          <div className="progress-track">
            <div className="hp-fill" style={{ width: `${hp}%` }} />
          </div>
        </div>

        <div className="border-t border-nc-cyan/20 pt-3">
          <div className="label-tag mb-2">MISSION LOG · {selectedSubject.toUpperCase()}</div>
          <ul className="space-y-1.5 font-mono text-xs">
            {missions.map((m) => {
              const r = results[m.id];
              const isCurrent = stage === 'mission' && m.id === missions[currentMissionIndex]?.id;
              return (
                <li key={m.id} className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 ${
                      r ? 'bg-nc-green' : isCurrent ? 'bg-nc-yellow animate-flicker' : 'bg-nc-muted/30'
                    }`}
                  />
                  <span className="flex-1 text-nc-text/80 truncate">{m.code}</span>
                  <span className="text-nc-muted">
                    {r ? `${r.earned}/${m.maxPoints}` : `--/${m.maxPoints}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-nc-cyan/20 pt-3">
          <div className="flex justify-between font-display text-sm">
            <span className="text-nc-muted tracking-widest">SCORE</span>
            <span className="text-nc-yellow">
              {totalEarned} / {totalMax}
            </span>
          </div>
        </div>
      </div>
    </HudFrame>
  );
};
