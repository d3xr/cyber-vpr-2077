interface Props {
  seed: string;
  size?: number;
}

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export const OperativePortrait = ({ seed, size = 128 }: Props) => {
  const h = hash(seed || 'V');
  const hairStyle = h % 4;
  const visorStyle = (h >> 2) % 3;
  const jacketColor = ['#FCEE0A', '#FF003C', '#00F0FF', '#B026FF'][(h >> 4) % 4];
  const skinTone = ['#E8C99B', '#C9A57B', '#A87E5A', '#7A5A3D'][(h >> 6) % 4];
  const hairColor = ['#FF003C', '#00F0FF', '#FCEE0A', '#B026FF', '#39FF14'][(h >> 8) % 5];
  const cheekImplant = (h >> 10) % 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      style={{ filter: 'drop-shadow(0 0 6px rgba(252,238,10,0.4))' }}
    >
      {/* background hex grid */}
      <defs>
        <pattern id="hex" width="8" height="9" patternUnits="userSpaceOnUse">
          <polygon points="4,0 8,2 8,7 4,9 0,7 0,2" fill="none" stroke="rgba(0,240,255,0.15)" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="128" height="128" fill="#0A0E14" />
      <rect x="0" y="0" width="128" height="128" fill="url(#hex)" />

      {/* shoulders / jacket */}
      <path
        d="M 18 124 L 28 84 L 100 84 L 110 124 Z"
        fill={jacketColor}
        opacity="0.85"
        stroke="#0A0E14"
        strokeWidth="1.5"
      />
      <path d="M 64 124 L 64 84" stroke="#0A0E14" strokeWidth="2" />
      <circle cx="50" cy="98" r="2" fill="#0A0E14" />
      <circle cx="78" cy="98" r="2" fill="#0A0E14" />
      <rect x="62" y="86" width="4" height="6" fill="#39FF14" opacity="0.9" />

      {/* neck */}
      <rect x="56" y="74" width="16" height="14" fill={skinTone} />
      <rect x="56" y="80" width="16" height="2" fill="rgba(0,0,0,0.3)" />

      {/* face */}
      <ellipse cx="64" cy="56" rx="22" ry="26" fill={skinTone} />

      {/* hair styles */}
      {hairStyle === 0 && (
        <path d="M 42 38 Q 42 24 64 22 Q 86 24 86 38 Q 84 30 64 28 Q 44 30 42 38 Z" fill={hairColor} />
      )}
      {hairStyle === 1 && (
        <>
          <path d="M 42 40 Q 42 22 64 20 Q 86 22 86 40 L 86 32 Q 64 26 42 32 Z" fill={hairColor} />
          <rect x="62" y="20" width="4" height="20" fill={hairColor} transform="skewX(-15)" />
        </>
      )}
      {hairStyle === 2 && (
        <>
          <rect x="42" y="34" width="44" height="6" fill={hairColor} />
          <rect x="44" y="28" width="4" height="6" fill={hairColor} />
          <rect x="60" y="24" width="4" height="10" fill={hairColor} />
          <rect x="78" y="30" width="4" height="6" fill={hairColor} />
        </>
      )}
      {hairStyle === 3 && (
        <path d="M 40 48 Q 42 28 64 24 Q 86 28 88 48 L 86 38 Q 80 30 64 32 Q 48 30 42 38 Z" fill={hairColor} />
      )}

      {/* visor / glasses (signature cyber implant) */}
      {visorStyle === 0 && (
        <g>
          <rect x="44" y="50" width="40" height="6" fill="#0A0E14" />
          <rect x="44" y="50" width="40" height="6" fill="#FCEE0A" opacity="0.5" />
          <rect x="44" y="50" width="40" height="1.5" fill="#FCEE0A" />
        </g>
      )}
      {visorStyle === 1 && (
        <g>
          <rect x="42" y="48" width="44" height="10" fill="#0A0E14" rx="1" />
          <rect x="46" y="51" width="14" height="4" fill="#00F0FF" opacity="0.9" />
          <rect x="68" y="51" width="14" height="4" fill="#00F0FF" opacity="0.9" />
        </g>
      )}
      {visorStyle === 2 && (
        <g>
          <circle cx="54" cy="54" r="6" fill="#0A0E14" stroke="#FF003C" strokeWidth="1" />
          <circle cx="74" cy="54" r="6" fill="#0A0E14" stroke="#FF003C" strokeWidth="1" />
          <circle cx="54" cy="54" r="2" fill="#FF003C" />
          <circle cx="74" cy="54" r="2" fill="#FF003C" />
        </g>
      )}

      {/* mouth */}
      <rect x="58" y="68" width="12" height="2" fill="rgba(0,0,0,0.5)" />

      {/* cheek implant */}
      {cheekImplant === 0 && (
        <g>
          <rect x="78" y="60" width="8" height="3" fill="#39FF14" opacity="0.8" />
          <rect x="78" y="60" width="2" height="3" fill="#0A0E14" />
        </g>
      )}
      {cheekImplant === 1 && (
        <g>
          <circle cx="44" cy="62" r="2" fill="#FF003C" />
          <circle cx="44" cy="62" r="0.8" fill="#FCEE0A" />
        </g>
      )}
      {cheekImplant === 2 && (
        <g>
          <rect x="42" y="60" width="3" height="6" fill="#B026FF" opacity="0.8" />
          <rect x="42" y="63" width="3" height="0.5" fill="#FCEE0A" />
        </g>
      )}

      {/* HUD frame around portrait */}
      <rect x="2" y="2" width="124" height="124" fill="none" stroke="#FCEE0A" strokeWidth="0.8" opacity="0.5" strokeDasharray="2 2" />
      <text x="6" y="14" fontFamily="Orbitron, sans-serif" fontSize="6" fill="#FCEE0A" opacity="0.7" letterSpacing="1">
        OP-{(h % 9999).toString().padStart(4, '0')}
      </text>
      <text x="122" y="14" fontFamily="Orbitron, sans-serif" fontSize="6" fill="#FCEE0A" opacity="0.7" textAnchor="end">
        ▣ ACTIVE
      </text>
    </svg>
  );
};
