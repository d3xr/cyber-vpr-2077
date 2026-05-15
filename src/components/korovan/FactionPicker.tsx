import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import type { KorovanFaction } from '../../types';

// Class-select screen. Three cards, last one needs a name input
// because Кирилл explicitly said «имя я не придумал».

const FACTIONS: { id: KorovanFaction; name: string; emoji: string; tagline: string; description: string }[] = [
  {
    id: 'elf',
    name: 'ЛЕСНОЙ ЭЛЬФ',
    emoji: '🧝',
    tagline: 'эльфы в лесу',
    description:
      'эльфы в лесу, домики деревяные. набигают нагибают солдаты дворца и злодеи. ' +
      'можно грабить корованы. лук есть.',
  },
  {
    id: 'guard',
    name: 'СТРАЖНИК ДВОРЦА',
    emoji: '💂',
    tagline: 'слушаеш командира',
    description:
      'надо слушаться командира, и защищать дворец от злого и шпионов, партизанов эльфов. ' +
      'ходит на набеги на когото из этих.',
  },
  {
    id: 'evil',
    name: 'ЗЛОЙ ___',
    emoji: '👹',
    tagline: 'сам себе командир',
    description:
      'шпионы или партизаны эльфов иногда нападают, ты сам себе командир. ' +
      'может делать что сам захочет — прикажеш своим войскам с тобой напасть на дворец и пойдёт в атаку.',
  },
];

export const FactionPicker = () => {
  const setKorovanFaction = useGame((s) => s.setKorovanFaction);
  const exitKorovan = useGame((s) => s.exitKorovan);
  const [evilName, setEvilName] = useState('Бессмертный');

  const handlePick = (id: KorovanFaction) => {
    if (id === 'evil') {
      setKorovanFaction('evil', evilName.trim() || 'Бессмертный');
    } else {
      setKorovanFaction(id);
    }
  };

  return (
    <div className="kor-root">
      <div className="max-w-5xl mx-auto">
        <div className="kor-title">⚜ КЛАСС ПЕРСОНАЖА ⚜</div>
        <div className="kor-subtitle mb-6">
          выбери за кого играеш. потом сменить нельзя (наверное).
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {FACTIONS.map((f) => (
            <div
              key={f.id}
              className="kor-panel flex flex-col cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => handlePick(f.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handlePick(f.id)}
            >
              <div className="text-center mb-3">
                <div style={{ fontSize: '4rem', filter: 'drop-shadow(2px 4px 2px rgba(0,0,0,0.4))' }}>
                  {f.emoji}
                </div>
                <div className="kor-title" style={{ fontSize: '1.2rem', margin: '0.5rem 0 0' }}>
                  {f.name}
                </div>
                <div className="kor-subtitle italic">{f.tagline}</div>
              </div>
              <div className="kor-body text-sm flex-1">{f.description}</div>

              {f.id === 'evil' && (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <label className="block">
                    <div className="text-sm font-bold mb-1">имя злого:</div>
                    <input
                      type="text"
                      className="kor-input w-full"
                      value={evilName}
                      onChange={(e) => setEvilName(e.target.value)}
                      maxLength={24}
                      placeholder="Бессмертный"
                    />
                  </label>
                </div>
              )}

              <button
                type="button"
                className={`kor-btn mt-3 w-full ${
                  f.id === 'elf' ? 'kor-btn-forest' : f.id === 'evil' ? 'kor-btn-blood' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePick(f.id);
                }}
              >
                ▶ ИГРАТЬ ЗА {f.name}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button type="button" className="kor-btn" onClick={exitKorovan}>
            ◀ ВЕРНУТЬСЯ В КИБЕРПАНК
          </button>
        </div>
      </div>
    </div>
  );
};
