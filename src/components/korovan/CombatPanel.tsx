import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import type { BodyPart, KorovanFaction } from '../../types';

// Combat is simple text-based: each [УДАРИТЬ] tick rolls damage on both sides.
// On enemy HP=0, drop loot + corpse. On player wound, the body HUD updates and
// the bleeding timer kicks in (handled in store.woundPart).

interface Enemy {
  name: string;
  emoji: string;
  hp: number;
  loot: number;
}

const ENEMY_BY_FACTION: Record<KorovanFaction, () => Enemy> = {
  // If player IS elf, encounters are guards & evil. Etc.
  elf:   () => Math.random() < 0.5
    ? { name: 'Стражник дворца', emoji: '💂', hp: 3 + Math.floor(Math.random() * 3), loot: 20 + Math.floor(Math.random() * 30) }
    : { name: 'Прихвостень злого', emoji: '👹', hp: 4 + Math.floor(Math.random() * 3), loot: 30 + Math.floor(Math.random() * 40) },
  guard: () => Math.random() < 0.5
    ? { name: 'Шпион эльфов', emoji: '🧝', hp: 3 + Math.floor(Math.random() * 2), loot: 15 + Math.floor(Math.random() * 25) }
    : { name: 'Прихвостень злого', emoji: '👹', hp: 4 + Math.floor(Math.random() * 3), loot: 30 + Math.floor(Math.random() * 40) },
  evil:  () => Math.random() < 0.5
    ? { name: 'Партизан эльфов', emoji: '🧝', hp: 3 + Math.floor(Math.random() * 2), loot: 25 + Math.floor(Math.random() * 30) }
    : { name: 'Стражник дворца', emoji: '💂', hp: 3 + Math.floor(Math.random() * 3), loot: 25 + Math.floor(Math.random() * 30) },
};

const WOUNDABLE: BodyPart[] = ['leftArm', 'rightArm', 'leftEye', 'rightEye', 'leftLeg', 'rightLeg', 'torso'];

const partRu = (p: BodyPart): string =>
  ({ leftArm: 'левую руку', rightArm: 'правую руку', leftEye: 'левый глаз', rightEye: 'правый глаз',
     leftLeg: 'левую ногу', rightLeg: 'правую ногу', torso: 'торс' }[p]);

interface Props {
  faction: KorovanFaction;
  onClose: () => void;
}

export const CombatPanel = ({ faction, onClose }: Props) => {
  const [enemy, setEnemy] = useState<Enemy>(() => ENEMY_BY_FACTION[faction]());
  const [log, setLog] = useState<{ type: 'hit' | 'loot' | 'info' | 'kill'; text: string }[]>([
    { type: 'info', text: `> ${enemy.emoji} ${enemy.name} (HP: ${enemy.hp}) набигает на тебя!` },
  ]);
  const [defeated, setDefeated] = useState(false);
  const [jumping, setJumping] = useState(false);

  const lootKorovan = useGame((s) => s.lootKorovan);
  const woundPart = useGame((s) => s.woundPart);
  const registerKill = useGame((s) => s.registerKill);

  const append = (type: 'hit' | 'loot' | 'info' | 'kill', text: string) =>
    setLog((l) => [...l, { type, text }]);

  const handleAttack = () => {
    // Functional setState — guarantees correct HP even on rapid clicks before re-render.
    setEnemy((prev) => {
      if (prev.hp <= 0) return prev;
      const dmg = 1 + Math.floor(Math.random() * 2);
      const newHp = Math.max(0, prev.hp - dmg);
      append('hit', `> ты бьёш ${prev.name} на ${dmg} (осталось HP: ${newHp})`);
      if (newHp === 0) {
        setDefeated(true);
        append('kill', `> ${prev.name} превращается в труп. труп тоже 3-хмерный.`);
        append('loot', `> +${prev.loot} золота с трупа`);
        lootKorovan(prev.loot);
        registerKill();
      } else if (Math.random() < 0.45) {
        // Enemy strikes back only while alive
        const part = WOUNDABLE[Math.floor(Math.random() * WOUNDABLE.length)];
        woundPart(part);
        append('hit', `> ${prev.name} рубит тебе ${partRu(part)}! бери бинт скорее.`);
      } else {
        append('info', `> ${prev.name} промахивается`);
      }
      return { ...prev, hp: newHp };
    });
  };

  const handleJump = () => {
    setJumping(true);
    setTimeout(() => setJumping(false), 480);
    append('info', '> ты прыгаеш через врага. эпично!');
  };

  const handleFlee = () => {
    append('info', '> ты убегаеш. позорно но живой.');
    setTimeout(onClose, 500);
  };

  return (
    <div className="kor-modal-backdrop" onClick={defeated ? onClose : undefined}>
      <div className="kor-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="kor-title" style={{ fontSize: '1.6rem', margin: 0, marginBottom: '0.5rem' }}>
          ⚔ БОЙ
        </h2>

        {/* Enemy "3D" rendering — emoji with CSS perspective */}
        <div className="text-center my-4" style={{ minHeight: 100 }}>
          {!defeated ? (
            <div
              className={jumping ? 'kor-jump' : ''}
              style={{
                fontSize: '4rem',
                display: 'inline-block',
                transform: 'perspective(400px) rotateY(-15deg) rotateX(8deg)',
                filter: 'drop-shadow(4px 6px 2px rgba(0,0,0,0.4))',
              }}
            >
              {enemy.emoji}
            </div>
          ) : (
            <div
              style={{
                fontSize: '4rem',
                display: 'inline-block',
                transform: 'perspective(400px) rotate(90deg) translateY(-10px)',
                filter: 'grayscale(0.7) drop-shadow(2px 8px 2px rgba(0,0,0,0.5))',
              }}
              title="3-хмерный труп"
            >
              {enemy.emoji}💀
            </div>
          )}
          <div className="font-bold mt-2">{enemy.name}</div>
          <div className="text-sm opacity-70">HP: {enemy.hp}</div>
        </div>

        <div className="kor-combat-log mb-3">
          {log.map((l, i) => (
            <div key={i} className={`kor-log-${l.type}`}>
              {l.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {!defeated ? (
            <>
              <button type="button" className="kor-btn kor-btn-blood" onClick={handleAttack}>
                ⚔ УДАРИТЬ
              </button>
              <button type="button" className="kor-btn" onClick={handleJump}>
                ↑ ПРЫГНУТЬ
              </button>
              <button type="button" className="kor-btn" onClick={handleFlee}>
                ▶ УБЕЖАТЬ
              </button>
            </>
          ) : (
            <button type="button" className="kor-btn kor-btn-gold" onClick={onClose}>
              ✓ ЗАБРАТЬ ЗОЛОТО И УЙТИ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
