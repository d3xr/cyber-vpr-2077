import { useMemo, useState } from 'react';

// "А движок можно поставить так что вдали деревья картинкой,
//  когда подходиш они преобразовываются в 3-хмерные деревья"
//                                                       — Кирилл, 2006
//
// Implementation: an emoji 🌲 by default (the "картинка"), swapped to a
// CSS-3D pyramid (`.kor-tree-near`) when the camera "approaches".
// Approach is faked two ways: hover on individual trees, or the global
// «подойти ближе» toggle that flips the whole grove.

interface TreePos {
  x: number;
  y: number;
  size: number;
  isHut: boolean;
}

const seedRand = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const Tree3D = () => (
  <div className="kor-tree-near">
    <div className="kor-crown">
      <div className="kor-crown-face f1" />
      <div className="kor-crown-face f2" />
      <div className="kor-crown-face f3" />
    </div>
    <div className="kor-trunk" />
  </div>
);

interface Props {
  onSpawnEnemy: () => void;
}

export const ForestScene = ({ onSpawnEnemy }: Props) => {
  const [near, setNear] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const trees = useMemo<TreePos[]>(() => {
    // Seeded so the layout is stable across renders without re-randomising.
    const r = seedRand(42);
    return Array.from({ length: 36 }, (_, i) => ({
      x: r() * 92 + 2,
      y: r() * 78 + 8,
      size: 0.8 + r() * 0.7,
      isHut: i % 9 === 0, // few wooden huts scattered in the grove
    }));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="kor-body italic opacity-80 text-sm">
          вдали деревья картинкой — подойдёш ближе, преобразовываются в 3-хмерные.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="kor-btn kor-btn-forest"
            onClick={() => setNear((n) => !n)}
            title="LOD switch"
          >
            {near ? '◀ ОТОЙТИ (картинка)' : '▶ ПОДОЙТИ (3-хмерные)'}
          </button>
          <button type="button" className="kor-btn kor-btn-blood" onClick={onSpawnEnemy}>
            ⚔ НАБИГАТЬ НАГИБАТЬ
          </button>
        </div>
      </div>

      <div className="kor-forest-bg">
        {trees.map((t, i) => {
          const isNear = near || hovered === i;
          if (t.isHut) {
            return (
              <div
                key={i}
                className="kor-hut"
                style={{ left: `${t.x}%`, top: `${t.y}%`, fontSize: `${t.size * 1.6}rem` }}
                title="домик деревяный"
              >
                🏚
              </div>
            );
          }
          return (
            <div
              key={i}
              style={{ position: 'absolute', left: `${t.x}%`, top: `${t.y}%` }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isNear ? (
                <Tree3D />
              ) : (
                <div
                  className="kor-tree-far"
                  style={{ fontSize: `${t.size * 2.2}rem` }}
                  title="наведи курсор — станет 3D"
                >
                  🌲
                </div>
              )}
            </div>
          );
        })}
        {/* Foreground "ground" that sells the depth */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '14%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(74, 107, 31, 0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};
