import { motion } from 'framer-motion';

interface Props {
  className?: string;
}

export const CyberpunkLogo = ({ className = '' }: Props) => (
  <div className={`relative inline-block ${className}`}>
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="font-display font-black leading-[0.85] tracking-tighter">
        <div
          className="text-nc-yellow text-[clamp(3rem,9vw,7.5rem)] flex items-baseline gap-2"
          style={{
            textShadow:
              '0 0 0 #FCEE0A, 4px 0 0 #FF003C, -4px 0 0 #00F0FF, 0 0 22px rgba(252,238,10,0.6)',
            WebkitTextStroke: '1px #0A0E14',
          }}
        >
          <span data-text="CYBER" className="glitch-text">
            CYBER
          </span>
          <span className="text-nc-magenta text-[0.4em] self-start mt-2 font-display">▰</span>
          <span data-text="VPR" className="glitch-text">
            VPR
          </span>
        </div>
        <div className="flex items-end justify-between mt-1">
          <div
            className="font-display text-nc-yellow text-[clamp(2.5rem,7vw,5.5rem)] leading-none"
            style={{
              textShadow: '4px 0 0 #FF003C, -4px 0 0 #00F0FF, 0 0 18px rgba(252,238,10,0.5)',
              WebkitTextStroke: '1px #0A0E14',
            }}
          >
            2077
          </div>
          <div className="font-mono text-[0.65rem] tracking-widest text-nc-yellow/70 mb-1 hidden sm:block">
            ▣ NIGHT CITY · ENG OPS · 4-CLASS BUILD
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

export const VLogo = ({ size = 64 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    style={{ filter: 'drop-shadow(0 0 8px rgba(252,238,10,0.7))' }}
  >
    <polygon points="32,4 60,58 4,58" fill="#FCEE0A" stroke="#0A0E14" strokeWidth="2" />
    <polygon
      points="32,14 50,52 14,52"
      fill="none"
      stroke="#0A0E14"
      strokeWidth="2"
    />
    <text
      x="32"
      y="46"
      textAnchor="middle"
      fontFamily="Orbitron, sans-serif"
      fontSize="26"
      fontWeight="900"
      fill="#0A0E14"
    >
      V
    </text>
  </svg>
);

export const WarningStripes = ({ className = '' }: { className?: string }) => (
  <div
    className={`relative h-3 ${className}`}
    style={{
      backgroundImage:
        'repeating-linear-gradient(45deg, #FCEE0A 0 14px, #0A0E14 14px 28px)',
      boxShadow: '0 0 16px rgba(252,238,10,0.4)',
    }}
  />
);
