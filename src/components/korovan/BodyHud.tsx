import { useGame } from '../../store/gameStore';
import type { BodyPart, LimbState } from '../../types';

// Pictogram of the hero's body — each limb gets a color/decoration based on
// its current state. ASCII art keeps the gore strictly E-for-everyone.

const SYMBOL: Record<LimbState, string> = {
  ok:         ' ',  // healthy = no marker
  wounded:    '!',  // bleeding
  lost:       'X',  // gone
  prosthetic: '+',  // mechanical replacement
};

const RU: Record<BodyPart, string> = {
  leftArm:  'лев. рука',
  rightArm: 'прав. рука',
  leftEye:  'лев. глаз',
  rightEye: 'прав. глаз',
  leftLeg:  'лев. нога',
  rightLeg: 'прав. нога',
  torso:    'торс',
};

const PARTS: BodyPart[] = ['leftEye', 'rightEye', 'leftArm', 'torso', 'rightArm', 'leftLeg', 'rightLeg'];

const formatBleed = (since: number): string => {
  const ms = Date.now() - since;
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
};

export const BodyHud = ({ bleedClock }: { bleedClock: number }) => {
  void bleedClock; // re-render trigger from parent's tick
  const body = useGame((s) => s.korovan.body);
  const bleeding = useGame((s) => s.korovan.bleeding);

  return (
    <div className="kor-panel" style={{ minWidth: 220 }}>
      <div className="font-bold mb-2 text-center" style={{ color: 'var(--kor-blood)' }}>
        ☠ СОСТОЯНИЕ ТЕЛА
      </div>
      <div className="kor-body-hud">
        {PARTS.map((p) => {
          const st = body[p];
          const cls = `kor-limb-${st}`;
          return (
            <div key={p} className={cls}>
              [{SYMBOL[st]}] {RU[p]}{st !== 'ok' ? ` — ${st === 'wounded' ? 'кровь!' : st === 'lost' ? 'отрублен' : 'протез'}` : ''}
            </div>
          );
        })}
      </div>
      {bleeding !== null && (
        <div className="mt-2 text-sm font-bold animate-pulse" style={{ color: 'var(--kor-blood)' }}>
          ⏱ кровотечение {formatBleed(bleeding)} — нужен бинт!
        </div>
      )}
    </div>
  );
};
