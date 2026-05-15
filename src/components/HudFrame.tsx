import { ReactNode } from 'react';

type Color = 'cyan' | 'purple' | 'yellow' | 'green' | 'magenta';

interface Props {
  children: ReactNode;
  color?: Color;
  className?: string;
  label?: string;
  tag?: string;
}

const colorClass: Record<Color, string> = {
  cyan: '',
  purple: 'hud-purple',
  yellow: 'hud-yellow',
  green: 'hud-green',
  magenta: 'hud-magenta',
};

export const HudFrame = ({ children, color = 'cyan', className = '', label, tag }: Props) => (
  <div
    className={`hud-frame relative bg-nc-dark/70 backdrop-blur-sm border border-nc-cyan/20 ${colorClass[color]} ${className}`}
  >
    <span className="hud-corner-tr" />
    <span className="hud-corner-bl" />
    {label && (
      <div className="absolute -top-3 left-4 px-2 bg-nc-black label-tag">
        ⌐ {label} ¬
      </div>
    )}
    {tag && (
      <div className="absolute -top-3 right-4 px-2 bg-nc-black text-[0.65rem] tracking-widest font-display text-nc-yellow">
        {tag}
      </div>
    )}
    {children}
  </div>
);
