export type Skill = 'listening' | 'reading' | 'grammar' | 'writing' | 'quiz';

export type Subject = 'english' | 'russian' | 'literature' | 'math' | 'cyberpunk_history';

export type ThemeColor = 'cyan' | 'yellow' | 'magenta' | 'purple' | 'green';

export interface MCQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface BlankOption {
  id: number;
  options: string[];
  answer: number;
  explanation: string;
}

export interface ProfileField {
  id: string;
  label: string;
  placeholder: string;
  points: number;
  minLength: number;
  kind: 'text' | 'number' | 'sentence';
  min?: number;
  max?: number;
}

export interface MissionVariant {
  id: string;
  audioScript?: string;
  audioFile?: string;
  datapad?: string;
  profile?: string;
  intro?: string;
  template?: string;
  blanks?: BlankOption[];
  questions?: MCQuestion[];
}

export interface Mission {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  skill: Skill;
  subject?: Subject;       // English missions default to 'english' if absent
  themeColor?: ThemeColor; // Used by GenericQuiz mission rendering
  districtTag: string;
  maxPoints: number;
  variants?: MissionVariant[];
  // Legacy single-variant fields (still supported)
  audioScript?: string;
  audioFile?: string;
  datapad?: string;
  profile?: string;
  intro?: string;
  template?: string;
  blanks?: BlankOption[];
  questions?: MCQuestion[];
  fields?: ProfileField[];
}

export interface MissionResult {
  missionId: string;
  earned: number;
  max: number;
  answers: Record<string, number | string>;
  completedAt: number;
}

export type Stage = 'briefing' | 'map' | 'mission' | 'finale' | 'leaderboard' | 'korovan';

// ============================================================================
// KOROVAN MODE — secret legacy-RPG level (OLD-NET archive 2006)
// ============================================================================
// Triggered by Konami code / 7 clicks on logo / "korovan" in callsign.
// All copy intentionally preserves Kirill's original spelling — do not "fix" it.

export type KorovanFaction = 'elf' | 'guard' | 'evil';

export type KorovanZoneId = 1 | 2 | 3 | 4;

export type LimbState = 'ok' | 'wounded' | 'lost' | 'prosthetic';

export type BodyPart =
  | 'leftArm'
  | 'rightArm'
  | 'leftEye'
  | 'rightEye'
  | 'leftLeg'
  | 'rightLeg'
  | 'torso';

export type KorovanItemId =
  | 'bandage'
  | 'potion'
  | 'sword'
  | 'bow'
  | 'horse'
  | 'prosthetic_arm'
  | 'glass_eye'
  | 'wooden_leg'
  | 'wheelchair'
  | 'scroll_save'
  | 'elven_cloak'
  | 'guard_shield';

export interface KorovanItem {
  id: KorovanItemId;
  name: string;       // Кириллу — на русском, с опечатками где уместно
  price: number;
  effect: string;     // human-readable
  emoji: string;
}

export interface KorovanState {
  active: boolean;
  faction: KorovanFaction | null;
  evilName: string;            // user-entered name for "Злой ____"
  zone: KorovanZoneId | null;  // current zone, null = world map
  body: Record<BodyPart, LimbState>;
  bleeding: number | null;     // ms-timestamp when bleeding started, null = ok
  gold: number;
  inventory: KorovanItemId[];
  korovansLooted: number;
  enemiesSlain: number;
  finished: boolean;           // true after seeing "ДЖВА ГОДА" finale
  visitedAt: number;           // ms-timestamp of first entry
}

export interface GameState {
  stage: Stage;
  player: { name: string; nickname: string };
  currentMissionIndex: number;
  results: Record<string, MissionResult>;
  streetcred: number;
  hp: number;
  muted: boolean;
  replayUsed: Record<string, boolean>;
  // Picked variant index per mission id. Random on first goToMission.
  selectedVariant: Record<string, number>;
  // Currently selected subject. Filters missions on map.
  selectedSubject: Subject;
  // Active backend run id (set on JACK IN, cleared on Finale submit/reset).
  runId: string | null;
  // Cached server-computed score after submission.
  serverScore: number | null;
  // Last variants chosen per subject — used to ask server to NOT repeat them
  // on next /run/start of same subject. Persisted via zustand.
  lastVariants: Partial<Record<Subject, Record<string, string>>>;
  // Secret legacy-RPG mode (see KorovanState above).
  korovan: KorovanState;
}
