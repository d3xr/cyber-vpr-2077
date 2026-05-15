import { motion } from 'framer-motion';
import { useGame } from '../store/gameStore';
import { HudFrame } from './HudFrame';
import { playClick } from '../utils/audio';

interface Props {
  missionTitle: string;
  earned: number;
  max: number;
  rows: { id: string; ok: boolean; user: string; correct: string; explanation: string }[];
}

export const MissionResultPanel = ({ missionTitle, earned, max, rows }: Props) => {
  const setStage = useGame((s) => s.setStage);
  const handleContinue = () => {
    playClick();
    setStage('map');
  };

  const isWin = earned >= Math.ceil(max * 0.6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <HudFrame
        label={isWin ? '▣ BREACH SUCCESSFUL' : '⚠ ICE DETECTED'}
        color={isWin ? 'green' : 'magenta'}
        className="p-5 lg:p-6 bg-nc-dark/90"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <div className={`label-tag ${isWin ? 'text-nc-green' : 'text-nc-magenta'}`}>
              {isWin ? '// DAEMON UPLOADED · EDDIES BANKED' : '// ICE BARRIER HOLDS · RETRY ADVISED'}
            </div>
            <div className="font-display text-2xl lg:text-3xl text-nc-yellow tracking-wider">
              {missionTitle}
            </div>
          </div>
          <div className="font-display text-3xl">
            <span className={isWin ? 'text-nc-green' : 'text-nc-magenta'}>{earned}</span>
            <span className="text-nc-muted"> / {max}</span>
            <span className="text-nc-cyan ml-2 text-base align-middle">PTS</span>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          {rows.map((r) => (
            <div
              key={r.id}
              className={`border p-3 font-mono text-sm ${
                r.ok ? 'border-nc-green/40 bg-nc-green/5' : 'border-nc-magenta/40 bg-nc-magenta/5'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className={`font-display text-xs tracking-widest ${r.ok ? 'text-nc-green' : 'text-nc-magenta'}`}>
                  {r.ok ? '✓ HIT' : '✗ MISS'}
                </span>
                <span className="text-nc-cyan">[{r.id}]</span>
                <span className="text-nc-muted text-xs">your: {r.user || '—'}</span>
                {!r.ok && <span className="text-nc-muted text-xs">· right: <span className="text-nc-green">{r.correct}</span></span>}
              </div>
              <div className="text-nc-text/80 mt-1 text-xs leading-relaxed">{r.explanation}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="cyber-btn cyber-btn-yellow"
          >
            ▶ BACK TO MAP
          </button>
        </div>
      </HudFrame>
    </motion.div>
  );
};
