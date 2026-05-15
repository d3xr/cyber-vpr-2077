import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  MissionResult,
  Stage,
  Mission,
  MissionVariant,
  Subject,
  KorovanState,
  KorovanFaction,
  KorovanZoneId,
  BodyPart,
  LimbState,
  KorovanItem,
  KorovanItemId,
} from '../types';
export type { MissionResult } from '../types';
import missionsRaw from '../data/missions.json';

const allMissions = (missionsRaw.missions as Mission[]) ?? [];

/**
 * Filter missions by selected subject.
 * Treats undefined subject as 'english' for backward compat.
 */
export const getMissionsForSubject = (subject: Subject): Mission[] =>
  allMissions.filter((m) => (m.subject ?? 'english') === subject);

/**
 * Subjects that gate the secret CP2077 lore subject.
 * To unlock cyberpunk_history, the player must pass all of these
 * with at least 60% (= grade 4 / А-tier) on the most recent attempt.
 */
const GATING_SUBJECTS: Subject[] = ['english', 'russian', 'literature', 'math'];
const PASS_THRESHOLD = 0.6;

export const isSubjectPassed = (
  subject: Subject,
  results: Record<string, MissionResult>,
): boolean => {
  const ms = getMissionsForSubject(subject);
  if (ms.length === 0) return false;
  const earned = ms.reduce((acc, m) => acc + (results[m.id]?.earned ?? 0), 0);
  const max = ms.reduce((acc, m) => acc + m.maxPoints, 0);
  if (max === 0) return false;
  return earned / max >= PASS_THRESHOLD;
};

export const isSubjectUnlocked = (
  subject: Subject,
  results: Record<string, MissionResult>,
): boolean => {
  if (subject !== 'cyberpunk_history') return true;
  return GATING_SUBJECTS.every((s) => isSubjectPassed(s, results));
};

// color sync with each mission's themeColor in missions.json
export const SUBJECTS: { id: Subject; label: string; ru: string; tag: string; color: string }[] = [
  { id: 'english',           label: 'ENGLISH',    ru: 'Английский',     tag: '// LANG // EN',  color: 'yellow' },
  { id: 'russian',           label: 'RUSSIAN',    ru: 'Русский',        tag: '// LANG // RU',  color: 'cyan' },
  { id: 'literature',        label: 'LITERATURE', ru: 'Литература',     tag: '// ARCHIVE',     color: 'purple' },
  { id: 'math',              label: 'MATH',       ru: 'Математика',     tag: '// CRYPTO',      color: 'yellow' },
  { id: 'cyberpunk_history', label: 'CP LORE',    ru: 'История CP2077', tag: '// LORE-NET',    color: 'magenta' },
];

// No faction tags — kid feedback: «не ставь меня за корпов».
// Neutral street handles only.
const NICK_TAGS = ['NEON', 'GHOST', 'WIRE', 'CHROME', 'ZERO', 'SPARK'];

const pickNick = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return NICK_TAGS[h % NICK_TAGS.length];
};

const buildNickname = (name: string): string => {
  const clean = name.trim().toUpperCase() || 'V';
  const tag = pickNick(clean);
  return `${clean} '${tag}' KAZ`;
};

// ============================================================================
// KOROVAN MODE — secret legacy-RPG (OLD-NET archive 2006)
// ============================================================================
// All copy preserves Kirill's original spelling. Do NOT correct it.

export const KOROVAN_SHOP: KorovanItem[] = [
  { id: 'bandage',        name: 'бинт',                       price: 10,  emoji: '🩹', effect: 'останавливает кровь' },
  { id: 'potion',         name: 'зелье лечения',              price: 25,  emoji: '🧪', effect: 'лечит раны на частях тела' },
  { id: 'sword',          name: 'меч-кладенец',               price: 80,  emoji: '⚔️', effect: '+урон в бою' },
  { id: 'bow',            name: 'эльфийский лук',             price: 60,  emoji: '🏹', effect: 'стрелять издалека' },
  { id: 'horse',          name: 'конь',                       price: 120, emoji: '🐎', effect: 'быстрее по карте' },
  { id: 'prosthetic_arm', name: 'протез руки (механический)', price: 150, emoji: '🦾', effect: 'снимает потерю руки' },
  { id: 'glass_eye',      name: 'стеклянный глаз',            price: 90,  emoji: '👁️', effect: 'снимает слепоту на полэкрана' },
  { id: 'wooden_leg',     name: 'дервяная нога',              price: 70,  emoji: '🦿', effect: 'снимает потерю ноги (медленно)' },
  { id: 'wheelchair',     name: 'инвалидное кресло',          price: 50,  emoji: '♿', effect: 'катаешся вместо ползания' },
  { id: 'scroll_save',    name: 'свиток сохранения',          price: 5,   emoji: '📜', effect: 'Сохранятся можно…' },
  { id: 'elven_cloak',    name: 'плащ эльфа',                 price: 100, emoji: '🧝', effect: 'эльфы не нападают' },
  { id: 'guard_shield',   name: 'щит стражи',                 price: 110, emoji: '🛡️', effect: 'стража не нападает' },
];

export const KOROVAN_ZONES: { id: KorovanZoneId; name: string; subtitle: string; emoji: string; description: string }[] = [
  { id: 1, name: 'ЗОНА ЛЮДЕЙ',        subtitle: 'нейтрал',                emoji: '🏘️', description: 'деревеньки, торговцы. ничего особо не происходит.' },
  { id: 2, name: 'ДВОРЕЦ ИМПЕРАТОРА', subtitle: 'тут стража и командир',  emoji: '🏰', description: 'если играть за стражу — слушаться командира. иначе — набигают.' },
  { id: 3, name: 'ЛЕС ЭЛЬФОВ',        subtitle: 'густой лес, домики',     emoji: '🌲', description: 'вдали деревья картинкой, когда подходиш — преобразовываются в 3-хмерные.' },
  { id: 4, name: 'СТАРЫЙ ФОРТ',       subtitle: 'в горах, у злого…',      emoji: '🏔️', description: 'если за злого — сам себе командир, можеш напасть на дворец.' },
];

const FACTION_GOLD: Record<KorovanFaction, number> = {
  elf:   30,
  guard: 50,
  evil:  100,
};

const initialBody: Record<BodyPart, LimbState> = {
  leftArm:  'ok',
  rightArm: 'ok',
  leftEye:  'ok',
  rightEye: 'ok',
  leftLeg:  'ok',
  rightLeg: 'ok',
  torso:    'ok',
};

const initialKorovan: KorovanState = {
  active: false,
  faction: null,
  evilName: 'Бессмертный',
  zone: null,
  body: { ...initialBody },
  bleeding: null,
  gold: 0,
  inventory: [],
  korovansLooted: 0,
  enemiesSlain: 0,
  finished: false,
  visitedAt: 0,
};

interface Actions {
  setStage: (s: Stage) => void;
  startGame: (name: string) => void;
  goToMission: (idx: number) => void;
  completeMission: (result: MissionResult) => void;
  setReplayUsed: (missionId: string) => void;
  toggleMute: () => void;
  reset: () => void;
  setSubject: (s: Subject) => void;
  setRunId: (id: string | null) => void;
  setServerScore: (score: number | null) => void;
  // Sync server-picked variants → client store. Looks up each variant_id
  // string in mission.variants[] and stores its numeric index in
  // selectedVariant (which is what useActiveVariant reads).
  // Also records lastVariants[subject] so the next /run/start can ask
  // the server to exclude them (variant-rotation polish).
  setVariantsFromServer: (
    subject: Subject,
    variants: { mission_id: string; variant_id: string }[],
  ) => void;
  // Korovan mode actions
  enterKorovan: () => void;
  exitKorovan: () => void;
  setKorovanFaction: (f: KorovanFaction, evilName?: string) => void;
  enterKorovanZone: (z: KorovanZoneId | null) => void;
  lootKorovan: (loot: number) => void;
  woundPart: (part: BodyPart) => void;
  healPart: (part: BodyPart) => void;
  equipProsthetic: (part: BodyPart) => void;
  registerKill: () => void;
  buyKorovanItem: (id: KorovanItemId) => boolean;
  finishKorovan: () => void;
  resetKorovan: () => void;
}

const initial: GameState = {
  stage: 'briefing',
  player: { name: '', nickname: '' },
  currentMissionIndex: 0,
  results: {},
  streetcred: 0,
  hp: 100,
  muted: false,
  replayUsed: {},
  selectedVariant: {},
  selectedSubject: 'english',
  runId: null,
  serverScore: null,
  lastVariants: {},
  korovan: { ...initialKorovan },
};

/**
 * Resolve the active variant for a mission. Picks the variant the store recorded
 * via goToMission, falls back to legacy top-level fields if the mission has no variants[].
 */
export const useActiveVariant = (mission: Mission): MissionVariant => {
  const idx = useGame((s) => s.selectedVariant[mission.id] ?? 0);
  if (mission.variants && mission.variants[idx]) return mission.variants[idx];
  return {
    id: 'default',
    audioFile: mission.audioFile,
    audioScript: mission.audioScript,
    datapad: mission.datapad,
    profile: mission.profile,
    intro: mission.intro,
    template: mission.template,
    blanks: mission.blanks,
    questions: mission.questions,
  };
};

export const useGame = create<GameState & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      setStage: (s) => set({ stage: s }),
      startGame: (name) => {
        const trimmed = name.trim() || 'OPERATIVE';
        set({
          player: { name: trimmed, nickname: buildNickname(trimmed) },
          stage: 'map',
        });
      },
      goToMission: (idx) => {
        // idx is index within the FILTERED subject mission list (what map shows).
        // We need to resolve to the actual mission and store its absolute index.
        const subjectMissions = getMissionsForSubject(get().selectedSubject);
        const mission = subjectMissions[idx];
        if (!mission) return;
        const absoluteIdx = allMissions.findIndex((m) => m.id === mission.id);
        const selected = { ...get().selectedVariant };
        if (mission.variants && mission.variants.length > 0 && selected[mission.id] === undefined) {
          selected[mission.id] = Math.floor(Math.random() * mission.variants.length);
        }
        set({
          currentMissionIndex: absoluteIdx >= 0 ? absoluteIdx : idx,
          stage: 'mission',
          selectedVariant: selected,
        });
      },
      setSubject: (s) => set({ selectedSubject: s }),
      setRunId: (id) => set({ runId: id }),
      setServerScore: (score) => set({ serverScore: score }),
      setVariantsFromServer: (subject, variants) => {
        // Convert server's variant_id strings → numeric indices for useActiveVariant.
        const indexMap = { ...get().selectedVariant };
        const lastForSubject: Record<string, string> = {};
        for (const v of variants) {
          const mission = allMissions.find((m) => m.id === v.mission_id);
          if (!mission?.variants) continue;
          const idx = mission.variants.findIndex((mv) => mv.id === v.variant_id);
          if (idx >= 0) {
            indexMap[v.mission_id] = idx;
            lastForSubject[v.mission_id] = v.variant_id;
          }
        }
        const lastVariants = { ...get().lastVariants, [subject]: lastForSubject };
        set({ selectedVariant: indexMap, lastVariants });
      },
      completeMission: (r) => {
        const results = { ...get().results, [r.missionId]: r };
        const earnedTotal = Object.values(results).reduce((a, x) => a + x.earned, 0);
        const lost = Object.values(results).reduce((a, x) => a + (x.max - x.earned), 0);
        set({
          results,
          streetcred: Math.min(100, earnedTotal * 4),
          hp: Math.max(35, 100 - lost * 5),
        });
      },
      setReplayUsed: (id) =>
        set({ replayUsed: { ...get().replayUsed, [id]: true } }),
      toggleMute: () => set({ muted: !get().muted }),
      // VPR reset — preserves korovan unlock progress (it's a separate game).
      reset: () => set({ ...initial, korovan: get().korovan }),

      // ── KOROVAN ACTIONS ───────────────────────────────────────────────
      enterKorovan: () => {
        const cur = get().korovan;
        set({
          stage: 'korovan',
          korovan: {
            ...cur,
            active: true,
            // Fresh body and zone every entry; faction/gold/inventory persist between sessions.
            zone: null,
            body: { ...initialBody },
            bleeding: null,
            // First entry — give starter gold so player can immediately buy something.
            gold: cur.gold > 0 ? cur.gold : 50,
            visitedAt: cur.visitedAt || Date.now(),
            finished: false,
          },
        });
      },
      exitKorovan: () => set({ stage: 'briefing' }),
      setKorovanFaction: (f, evilName) => {
        const cur = get().korovan;
        set({
          korovan: {
            ...cur,
            faction: f,
            evilName: evilName?.trim() || cur.evilName || 'Бессмертный',
            // Top up gold based on faction starting bonus (only on first faction pick).
            gold: cur.gold + (cur.faction ? 0 : FACTION_GOLD[f]),
          },
        });
      },
      enterKorovanZone: (z) => set({ korovan: { ...get().korovan, zone: z } }),
      lootKorovan: (loot) => {
        const cur = get().korovan;
        set({
          korovan: {
            ...cur,
            gold: cur.gold + loot,
            korovansLooted: cur.korovansLooted + 1,
          },
        });
      },
      woundPart: (part) => {
        const cur = get().korovan;
        const next: LimbState = cur.body[part] === 'ok' ? 'wounded' : 'lost';
        const newBody = { ...cur.body, [part]: next };
        // Bleeding timer starts on first untreated wound and runs until all wounds healed.
        const anyWound = Object.values(newBody).some((s) => s === 'wounded' || s === 'lost');
        set({
          korovan: {
            ...cur,
            body: newBody,
            bleeding: anyWound ? cur.bleeding ?? Date.now() : null,
          },
        });
      },
      healPart: (part) => {
        const cur = get().korovan;
        // Only heal wounded; lost parts need a prosthetic.
        if (cur.body[part] !== 'wounded') return;
        const newBody = { ...cur.body, [part]: 'ok' as LimbState };
        const anyWound = Object.values(newBody).some((s) => s === 'wounded' || s === 'lost');
        set({
          korovan: {
            ...cur,
            body: newBody,
            bleeding: anyWound ? cur.bleeding : null,
          },
        });
      },
      equipProsthetic: (part) => {
        const cur = get().korovan;
        const newBody = { ...cur.body, [part]: 'prosthetic' as LimbState };
        const anyWound = Object.values(newBody).some((s) => s === 'wounded' || s === 'lost');
        set({
          korovan: {
            ...cur,
            body: newBody,
            bleeding: anyWound ? cur.bleeding : null,
          },
        });
      },
      registerKill: () => {
        const cur = get().korovan;
        set({ korovan: { ...cur, enemiesSlain: cur.enemiesSlain + 1 } });
      },
      buyKorovanItem: (id) => {
        const cur = get().korovan;
        const item = KOROVAN_SHOP.find((x) => x.id === id);
        if (!item) return false;
        if (cur.gold < item.price) return false;

        const newBody = { ...cur.body };
        let bleeding = cur.bleeding;

        // Auto-apply consumables and prosthetics on purchase — Daggerfall-style "use on buy"
        // is too clunky for an easter-egg level, just resolve immediately.
        if (id === 'bandage') {
          // Patch every wounded part (lost stays lost — needs a prosthetic).
          (Object.keys(newBody) as BodyPart[]).forEach((p) => {
            if (newBody[p] === 'wounded') newBody[p] = 'ok';
          });
          bleeding = null;
        } else if (id === 'potion') {
          // Heal one wounded part, priority: torso > arms > legs > eyes.
          const order: BodyPart[] = ['torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'leftEye', 'rightEye'];
          const target = order.find((p) => newBody[p] === 'wounded');
          if (target) newBody[target] = 'ok';
          const anyWound = Object.values(newBody).some((s) => s === 'wounded' || s === 'lost');
          if (!anyWound) bleeding = null;
        } else if (id === 'prosthetic_arm') {
          if (newBody.leftArm === 'lost') newBody.leftArm = 'prosthetic';
          else if (newBody.rightArm === 'lost') newBody.rightArm = 'prosthetic';
        } else if (id === 'glass_eye') {
          if (newBody.leftEye === 'lost') newBody.leftEye = 'prosthetic';
          else if (newBody.rightEye === 'lost') newBody.rightEye = 'prosthetic';
        } else if (id === 'wooden_leg' || id === 'wheelchair') {
          if (newBody.leftLeg === 'lost') newBody.leftLeg = 'prosthetic';
          else if (newBody.rightLeg === 'lost') newBody.rightLeg = 'prosthetic';
        }

        set({
          korovan: {
            ...cur,
            gold: cur.gold - item.price,
            inventory: [...cur.inventory, id],
            body: newBody,
            bleeding,
          },
        });
        return true;
      },
      finishKorovan: () => set({ korovan: { ...get().korovan, finished: true } }),
      resetKorovan: () =>
        set({
          korovan: {
            ...initialKorovan,
            // Keep the unlock — once found, always available.
            active: true,
            visitedAt: get().korovan.visitedAt || Date.now(),
          },
        }),
    }),
    {
      name: 'cybervpr-2077',
      // v6: added korovan secret level state.
      version: 6,
      migrate: (persisted, version) => {
        const p = (persisted as Partial<GameState>) ?? {};
        if (version < 6 || !p.korovan) {
          return { ...p, korovan: { ...initialKorovan } } as GameState;
        }
        return p as GameState;
      },
    },
  ),
);
