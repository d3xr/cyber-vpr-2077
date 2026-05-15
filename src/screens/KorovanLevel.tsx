import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, KOROVAN_ZONES } from '../store/gameStore';
import type { KorovanZoneId } from '../types';
import { KorovanIntro } from './KorovanIntro';
import { FactionPicker } from '../components/korovan/FactionPicker';
import { BodyHud } from '../components/korovan/BodyHud';
import { Shop } from '../components/korovan/Shop';
import { ForestScene } from '../components/korovan/ForestScene';
import { CombatPanel } from '../components/korovan/CombatPanel';
import { KorovanCaravan } from '../components/korovan/KorovanCaravan';
import { DjvaGodaFinale } from '../components/korovan/DjvaGodaFinale';

// ============================================================================
// KOROVAN LEVEL — root screen for the secret legacy-RPG mode
// ============================================================================
//
// Sub-routes (driven by korovan-state in store, not by URL):
//   1. !faction              → FactionPicker
//   2. faction && !zone      → WorldMap (4 zones)
//   3. faction && zone       → ZoneScene (the chosen zone's content)
//   4. finished              → DjvaGodaFinale (overrides everything)
//
// Side effects: toggle body.korovan-mode class so the rest of the app's CSS
// (CRT scanlines, dark cyber bg) is suppressed and the parchment skin applies.

export const KorovanLevel = () => {
  const korovan = useGame((s) => s.korovan);
  const enterZone = useGame((s) => s.enterKorovanZone);
  const exitKorovan = useGame((s) => s.exitKorovan);
  const finishKorovan = useGame((s) => s.finishKorovan);
  const woundPart = useGame((s) => s.woundPart);

  // Intro plays once per browser-session (using sessionStorage so reload re-plays
  // the cinematic; persistent skip would feel less special).
  const [introDone, setIntroDone] = useState(() => {
    try { return sessionStorage.getItem('korovan-intro-done') === '1'; } catch { return false; }
  });

  const [shopOpen, setShopOpen] = useState(false);
  const [combatOpen, setCombatOpen] = useState(false);
  const [manualCaravan, setManualCaravan] = useState(0);
  const [, tick] = useState(0); // forces re-render every second for bleed timer

  // Toggle body class — drives the entire skin swap
  useEffect(() => {
    document.body.classList.add('korovan-mode');
    return () => document.body.classList.remove('korovan-mode');
  }, []);

  // 1Hz tick for bleed timer + slow escalation. Wounded parts only convert to
  // "lost" if untreated for 45s, and at most one part per 20s — leaves room
  // for the player to reach the lavka instead of cascading into total dismemberment.
  useEffect(() => {
    let lastEscalation = 0;
    const t = setInterval(() => {
      tick((n) => n + 1);
      const bleeding = useGame.getState().korovan.bleeding;
      if (!bleeding) return;
      const now = Date.now();
      if (now - bleeding < 45_000) return;
      if (now - lastEscalation < 20_000) return;
      const body = useGame.getState().korovan.body;
      const woundedPart = (Object.keys(body) as (keyof typeof body)[]).find(
        (p) => body[p] === 'wounded',
      );
      if (woundedPart) {
        woundPart(woundedPart);
        lastEscalation = now;
      }
    }, 1000);
    return () => clearInterval(t);
  }, [woundPart]);

  const markIntroDone = () => {
    try { sessionStorage.setItem('korovan-intro-done', '1'); } catch { /* ignore */ }
    setIntroDone(true);
  };

  // The eye-blindness overlay (один глаз = пол-экрана не видно).
  const blindLeft  = korovan.body.leftEye  === 'lost';
  const blindRight = korovan.body.rightEye === 'lost';

  if (!introDone) {
    return <KorovanIntro onDone={markIntroDone} />;
  }

  if (korovan.finished) {
    return <DjvaGodaFinale />;
  }

  // ── Choose which subview to render ──
  let body;
  if (!korovan.faction) {
    body = <FactionPicker />;
  } else if (korovan.zone === null) {
    body = (
      <WorldMap
        onEnterZone={enterZone}
        onCallCaravan={() => setManualCaravan((n) => n + 1)}
        onCallEnemy={() => setCombatOpen(true)}
        onShowFinale={finishKorovan}
        canFinish={korovan.korovansLooted >= 1 && korovan.enemiesSlain >= 1}
      />
    );
  } else {
    body = (
      <ZoneScene
        zoneId={korovan.zone}
        onLeave={() => enterZone(null)}
        onCallEnemy={() => setCombatOpen(true)}
      />
    );
  }

  return (
    <>
      <div className="kor-root">
        {/* Top bar — universal: faction tag, gold, exit, shop */}
        <TopBar
          onShop={() => setShopOpen(true)}
          onExit={exitKorovan}
        />

        <div className="grid lg:grid-cols-[1fr_220px] gap-4 max-w-6xl mx-auto mt-4">
          <div>{body}</div>
          {korovan.faction && <BodyHud bleedClock={Date.now()} />}
        </div>
      </div>

      {/* Eye-blindness overlay — half the screen per lost eye. When BOTH eyes are
          gone we'd black out the entire viewport and trap the player; soften it
          and surface a "купить стеклянный глаз" CTA so they can recover. */}
      {blindLeft  && <div className="kor-eye-overlay left"  style={blindLeft && blindRight ? { opacity: 0.7 } : undefined} />}
      {blindRight && <div className="kor-eye-overlay right" style={blindLeft && blindRight ? { opacity: 0.7 } : undefined} />}
      {blindLeft && blindRight && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 95,
            background: 'rgba(20,12,4,0.9)',
            color: '#ffd700',
            padding: '0.6rem 1.2rem',
            border: '2px solid #8b5a2b',
            fontFamily: 'Times New Roman, serif',
            fontStyle: 'italic',
          }}
        >
          ⚠ ты ослеп на оба глаза.{' '}
          <button type="button" className="kor-btn kor-btn-gold" onClick={() => setShopOpen(true)}>
            ⚜ КУПИТЬ ГЛАЗ
          </button>
        </div>
      )}

      {/* Bleed vignette — pulsing red border while bleeding */}
      {korovan.bleeding !== null && <div className="kor-bleed-vignette" />}

      {/* Caravan random encounters (auto + manual) */}
      {korovan.faction && (
        <KorovanCaravan manualSpawn={manualCaravan} />
      )}

      {/* Combat */}
      <AnimatePresence>
        {combatOpen && korovan.faction && (
          <CombatPanel
            faction={korovan.faction}
            onClose={() => setCombatOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Shop */}
      <AnimatePresence>
        {shopOpen && <Shop onClose={() => setShopOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Top bar
// ────────────────────────────────────────────────────────────────────────────

const TopBar = ({ onShop, onExit }: { onShop: () => void; onExit: () => void }) => {
  const faction = useGame((s) => s.korovan.faction);
  const evilName = useGame((s) => s.korovan.evilName);
  const gold = useGame((s) => s.korovan.gold);
  const looted = useGame((s) => s.korovan.korovansLooted);
  const slain = useGame((s) => s.korovan.enemiesSlain);

  const factionLabel =
    faction === 'elf'   ? '🧝 ЛЕСНОЙ ЭЛЬФ' :
    faction === 'guard' ? '💂 СТРАЖНИК ДВОРЦА' :
    faction === 'evil'  ? `👹 ЗЛОЙ ${evilName}` :
    'без класса';

  return (
    <div className="max-w-6xl mx-auto kor-panel flex items-center justify-between gap-3 flex-wrap"
         style={{ padding: '0.7rem 1rem' }}>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="font-bold" style={{ color: 'var(--kor-blood)' }}>
          ⚜ KOROVAN.SRV ⚜
        </div>
        <div className="text-sm">{factionLabel}</div>
      </div>
      <div className="flex items-center gap-3 flex-wrap text-sm">
        {faction && (
          <>
            <span title="золото">🪙 <b>{gold}</b></span>
            <span title="ограблено корованов">🐪 <b>{looted}</b></span>
            <span title="убитых врагов">☠ <b>{slain}</b></span>
            <button type="button" className="kor-btn kor-btn-gold" onClick={onShop}>⚜ ЛАВКА</button>
          </>
        )}
        <button type="button" className="kor-btn" onClick={onExit}>◀ ВЫХОД</button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// World map — 4 zones as Кирилл specified
// ────────────────────────────────────────────────────────────────────────────

interface WorldMapProps {
  onEnterZone: (z: KorovanZoneId) => void;
  onCallCaravan: () => void;
  onCallEnemy: () => void;
  onShowFinale: () => void;
  canFinish: boolean;
}

const WorldMap = ({ onEnterZone, onCallCaravan, onCallEnemy, onShowFinale, canFinish }: WorldMapProps) => {
  const faction = useGame((s) => s.korovan.faction);

  const factionTip = useMemo(() => {
    if (faction === 'elf')   return 'эльф в лесу. набигают и нагибают. грабь корованы.';
    if (faction === 'guard') return 'слушайся командира. защищай дворец. ходи на набеги.';
    if (faction === 'evil')  return 'ты сам себе командир. можеш напасть на дворец.';
    return '';
  }, [faction]);

  return (
    <div className="space-y-4">
      <div>
        <div className="kor-title">⚜ КАРТА МИРА ⚜</div>
        <div className="kor-subtitle italic">{factionTip}</div>
      </div>

      {/* Zone grid — pseudo-isometric layout. Top-down map of 4 zones. */}
      <div className="grid sm:grid-cols-2 gap-3">
        {KOROVAN_ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => onEnterZone(z.id)}
            className="kor-panel text-left hover:scale-[1.02] transition-transform"
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div style={{ fontSize: '2.4rem' }}>{z.emoji}</div>
              <div>
                <div className="font-bold">{z.id}. {z.name}</div>
                <div className="text-sm italic opacity-70">{z.subtitle}</div>
              </div>
            </div>
            <div className="text-sm mt-2 kor-body">{z.description}</div>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="kor-panel">
        <div className="font-bold mb-2">⚔ БЫСТРЫЕ ДЕЙСТВИЯ</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="kor-btn kor-btn-gold" onClick={onCallCaravan}>
            🐪 ВЫЗВАТЬ КОРОВАН
          </button>
          <button type="button" className="kor-btn kor-btn-blood" onClick={onCallEnemy}>
            ⚔ НАБИГАТЬ НАГИБАТЬ
          </button>
          {canFinish && (
            <button type="button" className="kor-btn kor-btn-forest" onClick={onShowFinale}>
              ⚜ ПОКАЗАТЬ ФИНАЛ (ДЖВА ГОДА)
            </button>
          )}
        </div>
        {!canFinish && (
          <div className="text-xs italic mt-2 opacity-70">
            чтобы открыть финал: ограбь хотябы 1 корован и убей хотябы 1 врага.
          </div>
        )}
      </div>

      <div className="text-center text-xs italic opacity-60 kor-body">
        💾 Сохранятся можно… (всё сохраняется автоматически в браузер)
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Zone scene — content depends on which zone is open
// ────────────────────────────────────────────────────────────────────────────

interface ZoneSceneProps {
  zoneId: KorovanZoneId;
  onLeave: () => void;
  onCallEnemy: () => void;
}

const ZoneScene = ({ zoneId, onLeave, onCallEnemy }: ZoneSceneProps) => {
  const zone = KOROVAN_ZONES.find((z) => z.id === zoneId)!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="kor-title" style={{ fontSize: '1.4rem', margin: 0, textAlign: 'left' }}>
            {zone.emoji} {zone.name}
          </div>
          <div className="kor-subtitle italic" style={{ textAlign: 'left' }}>{zone.subtitle}</div>
        </div>
        <button type="button" className="kor-btn" onClick={onLeave}>
          ◀ НА КАРТУ МИРА
        </button>
      </div>

      {zoneId === 3 ? (
        <ForestScene onSpawnEnemy={onCallEnemy} />
      ) : (
        <GenericZoneScene zone={zone} onSpawnEnemy={onCallEnemy} />
      )}
    </div>
  );
};

// Stub scene for the non-forest zones — same layout, different art.
const GenericZoneScene = ({
  zone,
  onSpawnEnemy,
}: {
  zone: typeof KOROVAN_ZONES[number];
  onSpawnEnemy: () => void;
}) => {
  return (
    <div className="kor-panel" style={{ minHeight: 300 }}>
      <div className="text-center" style={{ fontSize: '6rem', marginBottom: '1rem' }}>
        {zone.emoji}
      </div>
      <div className="kor-body text-center">{zone.description}</div>

      {/* Imperial palace decoration: a row of pseudo-3D guards */}
      {zone.id === 2 && (
        <div className="text-center mt-4">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              style={{
                fontSize: '2.2rem',
                display: 'inline-block',
                margin: '0 0.2rem',
                transform: `perspective(300px) rotateY(${(i - 2) * 12}deg)`,
              }}
            >
              💂
            </span>
          ))}
        </div>
      )}
      {zone.id === 4 && (
        <div className="text-center mt-4">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ fontSize: '4rem', display: 'inline-block' }}
          >
            👹
          </motion.div>
          <div className="kor-body italic mt-2 text-sm">
            тут злой и его прихвостни. набигай или присоединяйся.
          </div>
        </div>
      )}
      {zone.id === 1 && (
        <div className="text-center mt-4">
          {['🏘️', '👨‍🌾', '🐄', '🐖', '🏚️'].map((e, i) => (
            <span key={i} style={{ fontSize: '2.2rem', margin: '0 0.3rem' }}>{e}</span>
          ))}
          <div className="kor-body italic mt-2 text-sm">
            люди-нейтралы. в основном мирные. иногда продают что-то полезное.
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-2 justify-center flex-wrap">
        <button type="button" className="kor-btn kor-btn-blood" onClick={onSpawnEnemy}>
          ⚔ НАБИГАТЬ НАГИБАТЬ
        </button>
      </div>
    </div>
  );
};
