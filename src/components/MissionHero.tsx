import { motion } from 'framer-motion';
import type { Skill } from '../types';

interface Props {
  skill: Skill;
}

interface HeroConfig {
  src: string;
  tint: string;
  accent: string; // hex border colour
  caption: string;
}

const HERO_BY_SKILL: Partial<Record<Skill, HeroConfig>> = {
  listening: {
    src: '/images/m1_listening.jpg',
    tint: 'rgba(176, 38, 255, 0.28)',
    accent: '#B026FF',
    caption: 'BRAINDANCE · INTERCEPTED',
  },
  reading: {
    src: '/images/m2_reading.jpg',
    tint: 'rgba(57, 255, 20, 0.20)',
    accent: '#39FF14',
    caption: 'STOLEN DATAPAD',
  },
  grammar: {
    src: '/images/m3_grammar.jpg',
    tint: 'rgba(0, 240, 255, 0.22)',
    accent: '#00F0FF',
    caption: 'CORP ICE · INTRUSION',
  },
  writing: {
    src: '/images/m4_writing.jpg',
    tint: 'rgba(252, 238, 10, 0.18)',
    accent: '#FCEE0A',
    caption: 'NCPD · FILE A REPORT',
  },
};

export const MissionHero = ({ skill }: Props) => {
  const cfg = HERO_BY_SKILL[skill];
  if (!cfg) return null;

  return (
    <div
      className="relative w-full aspect-[16/5] bg-nc-black border-2 overflow-hidden mb-5"
      style={{
        borderColor: cfg.accent,
        boxShadow: `0 0 24px ${cfg.accent}55, inset 0 0 80px rgba(0,0,0,0.55)`,
      }}
    >
      {/* Real photograph */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cfg.src})` }}
      />

      {/* Cyber tint */}
      <div className="absolute inset-0" style={{ background: cfg.tint, mixBlendMode: 'overlay' }} />

      {/* Bottom-fade for caption */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 60%, rgba(5,8,16,0.85) 100%)',
        }}
      />

      {/* Subtle scanlines, very light */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Corner brackets */}
      {[
        { pos: 'top-1 left-1', border: 'border-t-2 border-l-2' },
        { pos: 'top-1 right-1', border: 'border-t-2 border-r-2' },
        { pos: 'bottom-1 left-1', border: 'border-b-2 border-l-2' },
        { pos: 'bottom-1 right-1', border: 'border-b-2 border-r-2' },
      ].map((c, i) => (
        <div
          key={i}
          className={`absolute ${c.pos} w-4 h-4 ${c.border} pointer-events-none`}
          style={{ borderColor: cfg.accent, boxShadow: `0 0 6px ${cfg.accent}` }}
        />
      ))}

      {/* Slow scan line */}
      <motion.div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(to right, transparent, ${cfg.accent}, transparent)`,
        }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      {/* Caption */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 font-display text-xl tracking-[0.4em] pointer-events-none whitespace-nowrap"
        style={{ color: cfg.accent, textShadow: `0 0 10px ${cfg.accent}` }}
      >
        {cfg.caption}
      </div>
    </div>
  );
};
