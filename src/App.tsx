import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from './store/gameStore';
import { Briefing } from './screens/Briefing';
import { MapScreen } from './screens/MapScreen';
import { MissionScreen } from './screens/MissionScreen';
import { Finale } from './screens/Finale';
import { Leaderboard } from './screens/Leaderboard';
import { KorovanLevel } from './screens/KorovanLevel';
import { BootSequence } from './components/BootSequence';
import { setMuted } from './utils/audio';
import { ensureVoices } from './utils/speech';
import { useKonami, useKorovanPromptListener } from './utils/useKonami';

export default function App() {
  const { stage, muted } = useGame();
  const enterKorovan = useGame((s) => s.enterKorovan);
  const [korovanPrompt, setKorovanPrompt] = useState(false);
  // Konami listener is window-wide so it works on any screen, not just briefing.
  useKonami(() => setKorovanPrompt(true));
  // Other triggers (logo clicks, callsign cheat) dispatch a window event
  // so they don't need to thread setState through props.
  useKorovanPromptListener(() => setKorovanPrompt(true));
  // Boot only shows once per real page-load (not on every component mount).
  const [booted, setBooted] = useState(() => {
    try {
      return sessionStorage.getItem('cybervpr-booted') === '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    ensureVoices();
  }, []);

  return (
    <div className="crt min-h-screen text-nc-text">
      <AnimatePresence>
        {!booted && (
          <BootSequence
            key="boot"
            onDone={() => {
              try {
                sessionStorage.setItem('cybervpr-booted', '1');
              } catch {
                /* ignore */
              }
              setBooted(true);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {stage === 'briefing' && <Briefing />}
          {stage === 'map' && <MapScreen />}
          {stage === 'mission' && <MissionScreen />}
          {stage === 'finale' && <Finale />}
          {stage === 'leaderboard' && <Leaderboard />}
          {stage === 'korovan' && <KorovanLevel />}
        </motion.div>
      </AnimatePresence>

      {/* Confirm prompt for the secret level. The skin is intentionally not the
          cyberpunk one — it's the first peek at the legacy era to set the tone. */}
      <AnimatePresence>
        {korovanPrompt && (
          <motion.div
            className="kor-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setKorovanPrompt(false)}
          >
            <motion.div
              className="kor-prompt"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '1.6rem', fontStyle: 'italic', fontWeight: 700, marginBottom: '0.5rem', color: '#ff8040' }}>
                ⚠ OLD-NET ARCHIVE
              </div>
              <div style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
                Ты нашёл legacy-сервер 2006 года. Внутри — забытая RPG некоего Кирилла, который джва года ждёт, чтобы кто-нибудь её прошёл.
                <br/><br/>
                Войти? Этот режим — для очень странных инвесторов.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="kor-btn"
                  onClick={() => setKorovanPrompt(false)}
                >
                  ◀ ОТМЕНА
                </button>
                <button
                  type="button"
                  className="kor-btn kor-btn-blood"
                  onClick={() => {
                    setKorovanPrompt(false);
                    enterKorovan();
                  }}
                >
                  ▶ ВОЙТИ В KOROVAN.SRV
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
