import { motion } from 'framer-motion';

interface Props {
  variant?: 'night' | 'sunrise' | 'rain';
}

const IMAGES: Record<NonNullable<Props['variant']>, string> = {
  night: '/images/city1.jpg',
  sunrise: '/images/city3.jpg',
  rain: '/images/city2.jpg',
};

const TINTS: Record<NonNullable<Props['variant']>, string> = {
  night:
    'linear-gradient(180deg, rgba(0,240,255,0.05) 0%, rgba(176,38,255,0.10) 60%, rgba(255,0,60,0.14) 100%)',
  sunrise:
    'linear-gradient(180deg, rgba(176,38,255,0.18) 0%, rgba(255,106,61,0.16) 55%, rgba(252,238,10,0.14) 100%)',
  rain:
    'linear-gradient(180deg, rgba(0,240,255,0.10) 0%, rgba(5,8,16,0.30) 70%, rgba(176,38,255,0.18) 100%)',
};

/**
 * AMBIENT backdrop. The photo is heavily blurred + dimmed so HUD
 * elements pop on top. This is a mood layer, not a feature image.
 */
export const Skyline = ({ variant = 'night' }: Props) => {
  const img = IMAGES[variant];
  const tint = TINTS[variant];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Solid base color first */}
      <div className="absolute inset-0 bg-nc-black" />

      {/* Heavily blurred photo, low opacity */}
      <motion.div
        key={`base-${variant}`}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${img})`,
          filter: 'blur(14px) saturate(1.2)',
          opacity: 0.55,
          transform: 'scale(1.1)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ duration: 1.2 }}
      />

      {/* Heavy dark overlay so HUD reads cleanly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,8,16,0.65) 0%, rgba(5,8,16,0.55) 50%, rgba(5,8,16,0.85) 100%)',
        }}
      />

      {/* Color grade tint */}
      <div
        className="absolute inset-0 mix-blend-overlay pointer-events-none"
        style={{ background: tint }}
      />

      {/* Light scanlines */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,240,255,0.10) 0, rgba(0,240,255,0.10) 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* Single soft neon haze accent */}
      <div
        className="absolute -bottom-32 -left-20 w-[60vw] h-[60vw] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(176,38,255,0.12), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {variant === 'rain' && <Rain />}
    </div>
  );
};

const Rain = () => (
  <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" preserveAspectRatio="none">
    {Array.from({ length: 50 }).map((_, i) => {
      const x = (i * 23) % 100;
      const delay = (i * 0.13) % 2;
      return (
        <line
          key={i}
          x1={`${x}%`}
          y1="-10%"
          x2={`${x - 2}%`}
          y2="110%"
          stroke="#00F0FF"
          strokeWidth="1"
          opacity="0.4"
          style={{ animation: `rain 1.4s linear ${delay}s infinite` }}
        />
      );
    })}
    <style>{`
      @keyframes rain {
        from { transform: translateY(-100%); }
        to { transform: translateY(100%); }
      }
    `}</style>
  </svg>
);
