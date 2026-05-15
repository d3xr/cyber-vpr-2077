import { findMission, findVariant, missionsForSubject } from './missions.js';

type AnswersByMission = Record<string, Record<string, number>>;

export interface ScoreResult {
  total: number;
  max: number;
  // correct[] added alongside wrong[] so the frontend doesn't have to
  // reconstruct "what was right" by complementing wrong against question list.
  perMission: Record<string, { earned: number; max: number; correct: string[]; wrong: string[] }>;
}

/**
 * Pure scoring function: given subject + variant_ids + client answers,
 * return total / max / per-mission breakdown.
 *
 * For writing-skill missions (m4) we don't have a "correct answer" — these are
 * scored by length validity, but the leaderboard doesn't include subject 'english'
 * writing as a graded type for that reason. If skill=writing, we skip; future
 * extension could accept a server-side validator.
 */
export const computeScore = (
  subject: string,
  variantIds: Record<string, string>,
  answers: AnswersByMission,
): ScoreResult => {
  const subjectMissions = missionsForSubject(subject);
  const perMission: ScoreResult['perMission'] = {};
  let total = 0;
  let max = 0;

  for (const m of subjectMissions) {
    const wantedVariantId = variantIds[m.id];
    const variant = wantedVariantId ? findVariant(m, wantedVariantId) : undefined;

    if (m.skill === 'writing') {
      // Skip writing — graded by parent, not auto-checked.
      // We award 0 for it on the auto-leaderboard.
      perMission[m.id] = { earned: 0, max: m.maxPoints, correct: [], wrong: [] };
      max += m.maxPoints;
      continue;
    }

    const userAnswers = answers[m.id] || {};
    const correct: string[] = [];
    const wrong: string[] = [];
    let earned = 0;

    if (m.skill === 'grammar') {
      const blanks = variant?.blanks ?? m.blanks ?? [];
      for (const b of blanks) {
        const got = userAnswers[String(b.id)];
        if (got === b.answer) {
          earned += 1;
          correct.push(String(b.id));
        } else {
          wrong.push(String(b.id));
        }
      }
    } else {
      // listening, reading, quiz — multiple choice
      const questions = variant?.questions ?? m.questions ?? [];
      for (const q of questions) {
        const got = userAnswers[q.id];
        if (got === q.answer) {
          earned += 1;
          correct.push(q.id);
        } else {
          wrong.push(q.id);
        }
      }
    }

    perMission[m.id] = { earned, max: m.maxPoints, correct, wrong };
    total += earned;
    max += m.maxPoints;
  }

  return { total, max, perMission };
};

/**
 * Pick a random variant id for each mission of the subject.
 * Returns mapping {missionId: variantId}.
 *
 * `exclude` (optional): {missionId: variantId} from the player's previous run.
 * Those variants are skipped to avoid back-to-back repeats. If excluding leaves
 * an empty pool (mission has only 1 variant), we ignore the exclude and return
 * the single available one anyway.
 */
export const pickVariants = (
  subject: string,
  exclude: Record<string, string> = {},
): Record<string, string> => {
  const subjectMissions = missionsForSubject(subject);
  const out: Record<string, string> = {};
  for (const m of subjectMissions) {
    if (m.variants && m.variants.length > 0) {
      const excluded = exclude[m.id];
      const pool = excluded
        ? m.variants.filter((v) => v.id !== excluded)
        : m.variants;
      const effectivePool = pool.length > 0 ? pool : m.variants;
      const pick = effectivePool[Math.floor(Math.random() * effectivePool.length)];
      out[m.id] = pick.id;
    } else {
      out[m.id] = 'default';
    }
  }
  return out;
};

export const computeMaxScore = (subject: string): number => {
  return missionsForSubject(subject).reduce((acc, m) => acc + m.maxPoints, 0);
};
