import { useGame, KOROVAN_SHOP } from '../../store/gameStore';
import type { KorovanItem } from '../../types';

// "Покупать и т.п. возможности как в Daggerfall" — но в скейле easter-egg.
// Auto-applies items on purchase (no separate inventory-use step).

interface Props {
  onClose: () => void;
}

export const Shop = ({ onClose }: Props) => {
  const gold = useGame((s) => s.korovan.gold);
  const inventory = useGame((s) => s.korovan.inventory);
  const body = useGame((s) => s.korovan.body);
  const buy = useGame((s) => s.buyKorovanItem);

  // Hide items that are pointless right now — keeps the list small.
  // Bandage is useless without a wound; prosthetics are useless without a lost limb.
  const isUseful = (it: KorovanItem): boolean => {
    const anyWounded = Object.values(body).some((s) => s === 'wounded');
    const lostArm    = body.leftArm === 'lost' || body.rightArm === 'lost';
    const lostEye    = body.leftEye === 'lost' || body.rightEye === 'lost';
    const lostLeg    = body.leftLeg === 'lost' || body.rightLeg === 'lost';
    if (it.id === 'bandage' || it.id === 'potion') return anyWounded;
    if (it.id === 'prosthetic_arm') return lostArm;
    if (it.id === 'glass_eye')      return lostEye;
    if (it.id === 'wooden_leg' || it.id === 'wheelchair') return lostLeg;
    return true;
  };

  const handleBuy = (id: KorovanItem['id']) => {
    buy(id);
  };

  return (
    <div className="kor-modal-backdrop" onClick={onClose}>
      <div className="kor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="kor-title" style={{ fontSize: '1.6rem', margin: 0, textAlign: 'left' }}>
            ⚜ ЛАВКА КУПЦА
          </h2>
          <div className="font-bold" style={{ color: 'var(--kor-gold)' }}>
            🪙 {gold}
          </div>
        </div>

        <div className="kor-body italic mb-3 opacity-80">
          «Покупать и т.п. возможности как в Daggerfall»
        </div>

        <div className="space-y-2">
          {KOROVAN_SHOP.filter(isUseful).map((it) => {
            const canAfford = gold >= it.price;
            return (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 p-2 border rounded"
                style={{ borderColor: 'rgba(42,24,16,0.3)', background: 'rgba(255,248,220,0.5)' }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div style={{ fontSize: '1.6rem' }}>{it.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{it.name}</div>
                    <div className="text-sm opacity-70">{it.effect}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="kor-btn kor-btn-gold"
                  disabled={!canAfford}
                  onClick={() => handleBuy(it.id)}
                  title={canAfford ? 'купить' : 'мало золота'}
                >
                  {it.price}🪙
                </button>
              </div>
            );
          })}
        </div>

        {inventory.length > 0 && (
          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(42,24,16,0.3)' }}>
            <div className="font-bold mb-2">📦 в сумке:</div>
            <div>
              {inventory.map((id, i) => {
                const it = KOROVAN_SHOP.find((x) => x.id === id);
                if (!it) return null;
                return (
                  <span key={i} className="kor-inv-chip">
                    {it.emoji} {it.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 text-right">
          <button type="button" className="kor-btn" onClick={onClose}>
            ◀ ВЫЙТИ ИЗ ЛАВКИ
          </button>
        </div>
      </div>
    </div>
  );
};
