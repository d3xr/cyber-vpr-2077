import { motion } from 'framer-motion';
import { useGame, getMissionsForSubject } from '../store/gameStore';
import { HudFrame } from './HudFrame';
import type { Subject } from '../types';
import { playClick } from '../utils/audio';

const POINTS_BY_SUBJECT: Record<Subject, { x: number; y: number; label: string }[]> = {
  english: [
    { x: 32, y: 28, label: 'WATSON' },
    { x: 70, y: 38, label: 'WESTBROOK' },
    { x: 56, y: 66, label: 'CITY CENTER' },
    { x: 22, y: 78, label: 'PACIFICA' },
  ],
  russian: [{ x: 50, y: 50, label: 'LANG-NET' }],
  literature: [{ x: 50, y: 50, label: 'ARCHIVES' }],
  math: [{ x: 50, y: 50, label: 'ARASAKA' }],
  cyberpunk_history: [{ x: 50, y: 50, label: 'WAKAKO-NET' }],
};

interface Props {
  selectable?: boolean;
}

export const MiniMap = ({ selectable = false }: Props) => {
  const { results, currentMissionIndex, goToMission, stage, selectedSubject } = useGame();
  const missions = getMissionsForSubject(selectedSubject);
  const POINTS = POINTS_BY_SUBJECT[selectedSubject] ?? POINTS_BY_SUBJECT.english;
  const completedCount = missions.filter((m) => results[m.id]).length;

  const handleClick = (idx: number) => {
    if (!selectable) return;
    const allowed = idx === completedCount;
    if (!allowed) return;
    playClick();
    goToMission(idx);
  };

  return (
    <HudFrame label="NIGHT CITY MAP" color="purple" className="p-3">
      <div className="relative aspect-square w-full bg-nc-black/80 overflow-hidden border border-nc-purple/30">
        {/* grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(176,38,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(176,38,255,0.25) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* roads */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M 32 28 L 70 38 L 56 66 L 22 78"
            fill="none"
            stroke="#B026FF"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            opacity="0.7"
          />
          <path
            d="M 0 50 Q 30 30 60 55 T 100 60"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="0.4"
            opacity="0.4"
          />
        </svg>

        {POINTS.map((p, idx) => {
          const m = missions[idx];
          const done = m ? !!results[m.id] : false;
          const active = idx === currentMissionIndex && stage === 'mission';
          const next = idx === completedCount && !done;
          const color = done ? '#39FF14' : active ? '#FCEE0A' : next ? '#00F0FF' : '#7A8B9C';
          const canClick = selectable && next;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handleClick(idx)}
              disabled={!canClick}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <motion.div
                animate={
                  next || active
                    ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }
                    : {}
                }
                transition={{ duration: 1.6, repeat: Infinity }}
                className="w-3 h-3 rounded-full"
                style={{
                  background: color,
                  boxShadow: `0 0 10px ${color}, 0 0 18px ${color}`,
                }}
              />
              <div
                className="mt-1 text-[0.6rem] font-display tracking-widest whitespace-nowrap"
                style={{ color, textShadow: `0 0 4px ${color}` }}
              >
                {`0${idx + 1}`} {p.label}
              </div>
            </button>
          );
        })}

        {/* corner ticks */}
        <div className="absolute top-1 left-1 text-[0.55rem] font-mono text-nc-purple/70">
          47.7°N · 122.5°W
        </div>
        <div className="absolute bottom-1 right-1 text-[0.55rem] font-mono text-nc-purple/70">
          NIGHT CITY · NCDP NET
        </div>
      </div>
    </HudFrame>
  );
};
