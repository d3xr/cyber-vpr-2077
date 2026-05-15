import { Layout } from '../components/Layout';
import { useGame } from '../store/gameStore';
import missionsRaw from '../data/missions.json';
import type { Mission } from '../types';
import { Mission1Braindance } from '../missions/Mission1Braindance';
import { Mission2Datashard } from '../missions/Mission2Datashard';
import { Mission3IceBreaker } from '../missions/Mission3IceBreaker';
import { Mission4NCPDProfile } from '../missions/Mission4NCPDProfile';
import { MissionGenericQuiz } from '../missions/MissionGenericQuiz';

const missions = (missionsRaw.missions as Mission[]) ?? [];

export const MissionScreen = () => {
  const idx = useGame((s) => s.currentMissionIndex);
  const m = missions[idx];

  if (!m) return null;

  return (
    <Layout>
      {m.skill === 'listening' && <Mission1Braindance mission={m} />}
      {m.skill === 'reading' && <Mission2Datashard mission={m} />}
      {m.skill === 'grammar' && <Mission3IceBreaker mission={m} />}
      {m.skill === 'writing' && <Mission4NCPDProfile mission={m} />}
      {m.skill === 'quiz' && <MissionGenericQuiz mission={m} />}
    </Layout>
  );
};
