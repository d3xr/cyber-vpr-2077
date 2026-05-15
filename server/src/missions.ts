import fs from 'node:fs';
import path from 'node:path';

// Path to missions.json — same file as frontend uses, single source of truth.
// In dev: ../src/data/missions.json. In prod: provided via MISSIONS_PATH env.
const MISSIONS_PATH =
  process.env.MISSIONS_PATH ||
  path.resolve(process.cwd(), '..', 'src', 'data', 'missions.json');

interface MCQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
}

interface BlankOption {
  id: number;
  options: string[];
  answer: number;
}

interface ProfileField {
  id: string;
  points: number;
}

interface MissionVariant {
  id: string;
  questions?: MCQuestion[];
  blanks?: BlankOption[];
}

export interface Mission {
  id: string;
  skill: 'listening' | 'reading' | 'grammar' | 'writing' | 'quiz';
  subject?: 'english' | 'russian' | 'literature' | 'math' | 'cyberpunk_history';
  maxPoints: number;
  variants?: MissionVariant[];
  questions?: MCQuestion[];
  blanks?: BlankOption[];
  fields?: ProfileField[];
}

export const loadMissions = (): Mission[] => {
  const raw = fs.readFileSync(MISSIONS_PATH, 'utf-8');
  const data = JSON.parse(raw) as { missions: Mission[] };
  return data.missions;
};

let cache: Mission[] | null = null;
export const missions = (): Mission[] => {
  if (!cache) cache = loadMissions();
  return cache;
};

export const reloadMissions = () => {
  cache = null;
  return missions();
};

export const subjectOf = (m: Mission) => m.subject ?? 'english';

export const missionsForSubject = (subject: string): Mission[] =>
  missions().filter((m) => subjectOf(m) === subject);

export const findMission = (id: string): Mission | undefined =>
  missions().find((m) => m.id === id);

export const findVariant = (m: Mission, variantId: string): MissionVariant | undefined =>
  m.variants?.find((v) => v.id === variantId);
