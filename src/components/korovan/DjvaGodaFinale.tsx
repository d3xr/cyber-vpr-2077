import { motion } from 'framer-motion';
import { useGame } from '../../store/gameStore';

// The payoff. Triggers when the player has done enough to satisfy Кирилл —
// i.e. grabbed at least one корован AND killed at least one enemy. Or via
// an explicit «увидеть финал» button on the world map (debug shortcut).

export const DjvaGodaFinale = () => {
  const stats = useGame((s) => s.korovan);
  const resetKorovan = useGame((s) => s.resetKorovan);
  const exitKorovan = useGame((s) => s.exitKorovan);

  const lostParts = Object.values(stats.body).filter((s) => s === 'lost').length;
  const prosthetics = Object.values(stats.body).filter((s) => s === 'prosthetic').length;

  return (
    <div className="kor-finale-bg">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <div className="kor-finale-text">
            Я ДЖВА ГОДА
            <br />
            ЖДАЛ ЭТУ ИГРУ
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-6 italic"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.4rem',
            color: '#ffd700',
            textShadow: '2px 2px 0 rgba(0,0,0,0.6)',
          }}
        >
          — Кирилл, 2006
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.6 }}
          className="mt-10 inline-block kor-panel text-left"
          style={{ background: 'linear-gradient(180deg, rgba(255,248,220,0.95), rgba(232,216,168,0.95))' }}
        >
          <div className="kor-title" style={{ fontSize: '1.4rem', margin: 0, marginBottom: '0.6rem' }}>
            ⚜ ЛЕТОПИСЬ ПОДВИГОВ ⚜
          </div>
          <div className="kor-body space-y-1">
            <div>фракция: <b>{stats.faction === 'elf' ? 'Лесной эльф' : stats.faction === 'guard' ? 'Стражник' : `Злой ${stats.evilName}`}</b></div>
            <div>корованов ограблено: <b>{stats.korovansLooted}</b></div>
            <div>врагов превращено в 3-хмерные трупы: <b>{stats.enemiesSlain}</b></div>
            <div>золота накоплено: <b>{stats.gold} 🪙</b></div>
            <div>предметов в сумке: <b>{stats.inventory.length}</b></div>
            <div>частей тела утрачено: <b style={{ color: 'var(--kor-blood)' }}>{lostParts}</b></div>
            <div>протезов установлено: <b>{prosthetics}</b></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.6 }}
          className="mt-8 flex gap-3 flex-wrap justify-center"
        >
          <button
            type="button"
            className="kor-btn kor-btn-blood"
            onClick={() => {
              resetKorovan();
            }}
          >
            ↻ НАЧАТЬ ЗАНОВО
          </button>
          <button
            type="button"
            className="kor-btn"
            onClick={exitKorovan}
          >
            ◀ ВЫЙТИ В КИБЕРПАНК
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 3.4, duration: 0.6 }}
          className="mt-10 text-sm italic"
          style={{ color: 'rgba(255,215,0,0.7)', fontFamily: 'Georgia, serif' }}
        >
          OLD-NET ARCHIVE · KOROVAN.SRV · СВЯЗЬ С 2006 СТАБИЛЬНА
        </motion.div>
      </div>
    </div>
  );
};
