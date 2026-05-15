import { useEffect, useState } from 'react';
import { useGame } from '../../store/gameStore';

// "Можно грабить корованы..." — the requirement that launched a thousand memes.
// Random encounter that surfaces a caravan + a [ГРАБИТЬ] button.
//
// Spawns automatically every ~12-25s while the player is in any zone, and
// can be triggered manually via the «вызвать корован» button on the world map.

const SIZE_OPTIONS = [3, 4, 5, 5, 6, 7];

interface Caravan {
  size: number;
  loot: number;
}

const rollCaravan = (): Caravan => {
  const size = SIZE_OPTIONS[Math.floor(Math.random() * SIZE_OPTIONS.length)];
  // Bigger caravan = more gold, with random spread.
  const loot = size * 12 + Math.floor(Math.random() * 25);
  return { size, loot };
};

interface Props {
  manualSpawn: number; // increment to force-spawn on demand
  onLooted?: (loot: number) => void;
}

export const KorovanCaravan = ({ manualSpawn, onLooted }: Props) => {
  const [caravan, setCaravan] = useState<Caravan | null>(null);
  const lootKorovan = useGame((s) => s.lootKorovan);

  // Auto-spawn on a leisurely interval. Only one active at a time.
  useEffect(() => {
    if (caravan) return;
    const t = setTimeout(() => setCaravan(rollCaravan()), 12_000 + Math.random() * 13_000);
    return () => clearTimeout(t);
  }, [caravan]);

  // External force-spawn (button on overview).
  useEffect(() => {
    if (manualSpawn === 0) return;
    setCaravan(rollCaravan());
  }, [manualSpawn]);

  if (!caravan) return null;

  const handleLoot = () => {
    lootKorovan(caravan.loot);
    onLooted?.(caravan.loot);
    setCaravan(null);
  };

  const handleSkip = () => setCaravan(null);

  return (
    <div className="kor-modal-backdrop" onClick={handleSkip}>
      <div className="kor-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="kor-title" style={{ fontSize: '1.6rem', margin: 0, marginBottom: '0.4rem' }}>
          🐪 КОРОВАН ИДЁТ!
        </h2>
        <div className="kor-body italic mb-3 opacity-80">
          мимо проходит купеческий корован. золото, шёлк, специи. охрана средняя.
        </div>

        <div className="text-center my-4">
          <div
            className="kor-korovan"
            style={{
              fontSize: '3rem',
              transform: 'perspective(400px) rotateX(8deg) rotateY(-6deg)',
            }}
          >
            {Array.from({ length: caravan.size }, (_, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  animation: `kor-walk 2.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.18}s`,
                }}
              >
                🐪
              </span>
            ))}
          </div>
          <div className="mt-2 font-bold" style={{ color: 'var(--kor-gold)' }}>
            добыча: ≈{caravan.loot} 🪙
          </div>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          <button type="button" className="kor-btn kor-btn-blood" onClick={handleLoot}>
            ⚔ ГРАБИТЬ КОРОВАН
          </button>
          <button type="button" className="kor-btn" onClick={handleSkip}>
            ▶ ПРОПУСТИТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
