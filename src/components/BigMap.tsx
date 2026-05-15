import { motion } from 'framer-motion';
import { useGame, getMissionsForSubject } from '../store/gameStore';
import type { Subject } from '../types';
import { playClick } from '../utils/audio';

interface MarkerPos {
  x: number;
  y: number;
  name: string;
  fullName: string;
}

const POINTS_BY_SUBJECT: Record<Subject, MarkerPos[]> = {
  english: [
    { x: 28, y: 24, name: 'WATSON', fullName: 'Watson · Kabuki Market' },
    { x: 72, y: 36, name: 'WESTBROOK', fullName: 'Westbrook · Japantown' },
    { x: 54, y: 64, name: 'CITY CENTER', fullName: 'City Center · Corporate Plaza' },
    { x: 22, y: 80, name: 'PACIFICA', fullName: 'Pacifica · NCPD HQ' },
  ],
  russian: [{ x: 50, y: 45, name: 'LANG-NET', fullName: 'Watson · Lang-Net Hub' }],
  literature: [{ x: 50, y: 45, name: 'OLD ARCHIVES', fullName: 'Heywood · Old Moscow Databanks' }],
  math: [{ x: 50, y: 45, name: 'ARASAKA TWR', fullName: 'City Center · Arasaka Tower' }],
  cyberpunk_history: [{ x: 50, y: 45, name: 'WAKAKO-NET', fullName: 'Westbrook · Wakako Lore Hub' }],
};

interface Props {
  onSelect: (idx: number) => void;
}

export const BigMap = ({ onSelect }: Props) => {
  const { results, currentMissionIndex, stage, selectedSubject } = useGame();
  const missions = getMissionsForSubject(selectedSubject);
  const POINTS = POINTS_BY_SUBJECT[selectedSubject] ?? POINTS_BY_SUBJECT.english;
  const completedCount = missions.filter((m) => results[m.id]).length;

  const handleClick = (idx: number) => {
    const allowed = idx === completedCount;
    if (!allowed) return;
    playClick();
    onSelect(idx);
  };

  return (
    <div className="relative aspect-[4/3] w-full bg-nc-black border-2 border-nc-yellow/40 overflow-hidden"
      style={{ boxShadow: '0 0 24px rgba(252,238,10,0.25), inset 0 0 60px rgba(0,0,0,0.7)' }}>
      {/* gradient sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, #1a0030 0%, #0a0e14 70%) , linear-gradient(to bottom, #0a1a30 0%, #0a0e14 60%, #2a0a30 100%)',
        }}
      />

      {/* far stars */}
      <svg className="absolute inset-0 w-full h-full">
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (i * 37) % 100;
          const y = (i * 53) % 50;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r={i % 7 === 0 ? 1.2 : 0.6}
              fill={i % 5 === 0 ? '#FCEE0A' : '#E8F4FF'}
              opacity={0.3 + ((i * 11) % 60) / 100}
            />
          );
        })}
      </svg>

      {/* grid plane (isometric perspective) */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-[60%]"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCEE0A" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FCEE0A" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* horizontal lines (perspective) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const y = 5 + i * 5;
          const opacity = 0.1 + i * 0.05;
          return (
            <line
              key={`h${i}`}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#FCEE0A"
              strokeWidth="0.15"
              opacity={opacity}
            />
          );
        })}
        {/* radial lines (vanishing point at top center) */}
        {Array.from({ length: 22 }).map((_, i) => {
          const x = (i / 21) * 100;
          return (
            <line
              key={`v${i}`}
              x1="50"
              y1="0"
              x2={x}
              y2="60"
              stroke="#FCEE0A"
              strokeWidth="0.15"
              opacity="0.25"
            />
          );
        })}
      </svg>

      {/* Night City silhouette (back skyline) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 75"
        preserveAspectRatio="none"
      >
        {/* far buildings */}
        {Array.from({ length: 28 }).map((_, i) => {
          const w = 1.6 + ((i * 13) % 22) * 0.18;
          const h = 8 + ((i * 41) % 22);
          const x = i * 3.8;
          const y = 35 - h;
          const lit = i % 3 === 0;
          return (
            <g key={`f${i}`}>
              <rect x={x} y={y} width={w} height={h} fill="#0c1424" />
              {lit && (
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={0.7}
                  fill={i % 4 === 0 ? '#00F0FF' : '#FCEE0A'}
                  opacity="0.9"
                />
              )}
              {Array.from({ length: Math.floor(h / 2) }).map((_, k) => {
                const wx = x + 0.3 + ((k * 5) % Math.max(1, w - 0.6));
                const wy = y + 1 + k * 2;
                const litK = (i + k) % 3 === 0;
                return (
                  <rect
                    key={k}
                    x={wx}
                    y={wy}
                    width={0.5}
                    height={0.5}
                    fill={
                      litK
                        ? k % 3 === 0
                          ? '#FCEE0A'
                          : k % 2 === 0
                          ? '#FF003C'
                          : '#00F0FF'
                        : '#1a2030'
                    }
                    opacity={litK ? 0.95 : 0.2}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* roads on ground — connect each point to the next, only when we have ≥2 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {POINTS.length >= 2 && (
          <path
            d={POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
            fill="none"
            stroke="#FCEE0A"
            strokeWidth="0.3"
            strokeDasharray="1.5 1.5"
            opacity="0.55"
          />
        )}
        {/* secondary roads */}
        <path
          d="M 0 70 Q 30 55 60 65 T 100 60"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="0.2"
          opacity="0.3"
        />
        <path
          d="M 0 88 L 100 92"
          fill="none"
          stroke="#FF003C"
          strokeWidth="0.2"
          opacity="0.25"
        />

        {/* district zones (translucent) */}
        {POINTS.map((p, i) => (
          <circle
            key={`zone${i}`}
            cx={p.x}
            cy={p.y}
            r="9"
            fill={i === 0 ? '#FF003C' : i === 1 ? '#B026FF' : i === 2 ? '#00F0FF' : '#FCEE0A'}
            opacity="0.06"
          />
        ))}
      </svg>

      {/* flying drones — moving dots */}
      <Drones />

      {/* district markers */}
      {POINTS.map((p, idx) => {
        const m = missions[idx];
        const done = m ? !!results[m.id] : false;
        const active = idx === currentMissionIndex && stage === 'mission';
        const next = idx === completedCount && !done;
        const locked = !done && !next;
        const color = done ? '#39FF14' : next ? '#FCEE0A' : active ? '#00F0FF' : '#7A8B9C';
        const canClick = next;

        return (
          <button
            key={p.name}
            type="button"
            disabled={!canClick}
            onClick={() => handleClick(idx)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${
              canClick ? 'cursor-pointer hover:z-20' : 'cursor-default'
            }`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {/* hologram beam */}
            <motion.div
              animate={
                next || active
                  ? { opacity: [0.3, 1, 0.3] }
                  : { opacity: 0.5 }
              }
              transition={{ duration: 1.4, repeat: Infinity }}
              className="absolute left-1/2 bottom-1/2 -translate-x-1/2 w-px"
              style={{
                height: 70,
                background: `linear-gradient(to top, ${color}, transparent)`,
                boxShadow: `0 0 10px ${color}`,
                opacity: 0.6,
              }}
            />

            {/* main pulsing dot */}
            <motion.div
              animate={
                next || active
                  ? { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }
                  : {}
              }
              transition={{ duration: 1.6, repeat: Infinity }}
              className="relative w-4 h-4 rounded-full"
              style={{
                background: color,
                boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
              }}
            >
              {/* inner ring */}
              <div
                className="absolute inset-1 rounded-full bg-nc-black"
                style={{ boxShadow: `inset 0 0 4px ${color}` }}
              />
            </motion.div>

            {/* outer ring (only for next/active) */}
            {(next || active) && (
              <motion.div
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: color }}
              />
            )}

            {/* label */}
            <div
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
            >
              <div
                className="font-display text-[0.7rem] tracking-widest"
                style={{ color, textShadow: `0 0 4px ${color}` }}
              >
                {`0${idx + 1}`} · {p.name}
              </div>
              <div
                className="font-mono text-[0.6rem] mt-0.5"
                style={{ color: locked ? '#7A8B9C' : color, opacity: 0.7 }}
              >
                {locked ? '▣ LOCKED' : done ? '▣ CLEARED' : next ? '▶ AVAILABLE' : '▣ ACTIVE'}
              </div>
              {m && (
                <div className="font-mono text-[0.55rem] text-nc-muted mt-0.5">
                  {m.code} · {m.maxPoints} PTS
                </div>
              )}
            </div>

            {/* connector line to label */}
            <div
              className="absolute left-1/2 top-1/2 h-px"
              style={{
                width: 12,
                background: color,
                boxShadow: `0 0 4px ${color}`,
              }}
            />
          </button>
        );
      })}

      {/* HUD overlay corners */}
      <div className="absolute top-2 left-2 font-mono text-[0.6rem] text-nc-yellow/70 leading-tight">
        <div>NCDP-NET // ACTIVE</div>
        <div>47.7°N · 122.5°W</div>
      </div>
      <div className="absolute top-2 right-2 text-right font-mono text-[0.6rem] text-nc-yellow/70 leading-tight">
        <div>NIGHT CITY</div>
        <div>{new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })} LST</div>
      </div>
      <div className="absolute bottom-2 left-2 font-mono text-[0.6rem] text-nc-yellow/70">
        ZOOM 1:50K · DISTRICTS: {missions.length} · {selectedSubject.toUpperCase()}
      </div>
      <div className="absolute bottom-2 right-2 font-mono text-[0.6rem] text-nc-yellow/70">
        FIXER: WAKAKO OKADA · TIER STREET KID
      </div>

      {/* corner brackets */}
      <CornerBrackets />

      {/* scan line */}
      <motion.div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, #FCEE0A, transparent)', boxShadow: '0 0 8px #FCEE0A' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

const Drones = () => (
  <>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5"
        style={{
          background: i === 0 ? '#FF003C' : i === 1 ? '#00F0FF' : '#39FF14',
          boxShadow: `0 0 6px ${i === 0 ? '#FF003C' : i === 1 ? '#00F0FF' : '#39FF14'}`,
        }}
        animate={{
          left: ['0%', '100%'],
          top: [`${20 + i * 20}%`, `${30 + i * 18}%`, `${20 + i * 20}%`],
        }}
        transition={{
          duration: 8 + i * 3,
          repeat: Infinity,
          ease: 'linear',
          delay: i * 1.5,
        }}
      />
    ))}
  </>
);

const CornerBrackets = () => (
  <>
    {[
      { pos: 'top-1 left-1', border: 'border-t-2 border-l-2' },
      { pos: 'top-1 right-1', border: 'border-t-2 border-r-2' },
      { pos: 'bottom-1 left-1', border: 'border-b-2 border-l-2' },
      { pos: 'bottom-1 right-1', border: 'border-b-2 border-r-2' },
    ].map((c, i) => (
      <div
        key={i}
        className={`absolute ${c.pos} w-4 h-4 ${c.border} border-nc-yellow pointer-events-none`}
        style={{ boxShadow: '0 0 6px rgba(252,238,10,0.6)' }}
      />
    ))}
  </>
);
