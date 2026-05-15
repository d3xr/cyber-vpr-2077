import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { db, RunRow, LeaderboardEntryRow } from './db.js';
import { computeScore, pickVariants, computeMaxScore } from './scoring.js';
import { missionsForSubject, reloadMissions } from './missions.js';

const PORT = Number(process.env.PORT) || 5001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const RUN_TTL_MS = 60 * 60 * 1000; // 1 hour
const VALID_SUBJECTS = new Set(['english', 'russian', 'literature', 'math', 'cyberpunk_history']);
const CALLSIGN_RE = /^[A-Za-zА-Яа-яЁё0-9 \-_'.]{2,16}$/;

// Lightweight profanity filter — substring matches, case-insensitive.
// Public leaderboard for kids → minimal blacklist. Not a security feature, just hygiene.
const BANNED_FRAGMENTS = [
  'fuck', 'shit', 'cunt', 'bitch', 'dick', 'pussy', 'asshole', 'bastard', 'slut', 'whore', 'nigger', 'fag',
  'хуй', 'хер', 'пизд', 'еба', 'ебё', 'ёба', 'ёбу', 'ёбл', 'бляд', 'блят', 'мудак', 'муда', 'сука', 'суки',
  'хуе', 'хуя', 'манда', 'долбоё', 'долбое', 'пидор', 'пидар', 'педик', 'педер', 'жопа', 'хуёв', 'хуев',
  'еблан', 'ебло', 'гондон', 'гавно', 'говно', 'педик',
];
const isCleanCallsign = (s: string): boolean => {
  const lower = s.toLowerCase().replace(/[\s\-_'.0-9]/g, '');
  return !BANNED_FRAGMENTS.some((bad) => lower.includes(bad));
};

const app = express();
app.set('trust proxy', 1); // behind nginx
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    // Expose rate-limit + build headers so frontend can react gracefully.
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'X-Build-Version'],
  }),
);
app.use(express.json({ limit: '8kb' }));
app.use((_req, res, next) => {
  res.set('X-Build-Version', BUILD_VERSION);
  next();
});

const startLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: 'rate_limit' },
  standardHeaders: true,
});

const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: { error: 'rate_limit' },
  standardHeaders: true,
});

// =================== ROUTES ===================

// Build identification — bumped manually on each deploy that changes API surface.
const BUILD_VERSION = process.env.BUILD_VERSION || '2026.05.15-r4-variant-exclude';
const BUILD_SHA = process.env.BUILD_SHA || 'local';
const SERVER_STARTED_AT = Date.now();

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    time: Date.now(),
    version: BUILD_VERSION,
    sha: BUILD_SHA,
    uptime_ms: Date.now() - SERVER_STARTED_AT,
  });
});

app.post('/api/run/start', startLimiter, (req, res) => {
  const { callsign, subject, exclude_variants } = req.body as {
    callsign?: unknown;
    subject?: unknown;
    exclude_variants?: unknown;
  };

  // Verbose validation: tell the user EXACTLY why callsign rejected.
  // NEON KAT + DELAMAIN: silent rejects pushed players into OFFLINE_MODE without explanation.
  if (typeof callsign !== 'string') {
    return res.status(400).json({ error: 'bad_callsign', reason: 'callsign_missing' });
  }
  const trimmed = callsign.trim();
  if (trimmed.length < 2) {
    return res.status(400).json({ error: 'bad_callsign', reason: 'too_short', min: 2 });
  }
  if (trimmed.length > 16) {
    return res.status(400).json({ error: 'bad_callsign', reason: 'too_long', max: 16 });
  }
  if (!CALLSIGN_RE.test(trimmed)) {
    return res.status(400).json({
      error: 'bad_callsign',
      reason: 'invalid_chars',
      allowed: 'A-Z, a-z, А-Я, а-я, 0-9, space, - _ . \'',
    });
  }
  if (!isCleanCallsign(trimmed)) {
    return res.status(400).json({ error: 'callsign_not_allowed', reason: 'profanity' });
  }
  if (typeof subject !== 'string' || !VALID_SUBJECTS.has(subject)) {
    return res.status(400).json({ error: 'bad_subject', allowed: [...VALID_SUBJECTS] });
  }

  // DELAMAIN E05: exclude the variants the player just played so back-to-back
  // runs of the same subject don't serve identical questions. Type-validate
  // shape — must be {string: string} object.
  let exclude: Record<string, string> = {};
  if (exclude_variants && typeof exclude_variants === 'object' && !Array.isArray(exclude_variants)) {
    for (const [k, v] of Object.entries(exclude_variants as Record<string, unknown>)) {
      if (typeof k === 'string' && typeof v === 'string' && k.length < 50 && v.length < 50) {
        exclude[k] = v;
      }
    }
  }

  const variantIds = pickVariants(subject, exclude);
  if (Object.keys(variantIds).length === 0) {
    return res.status(404).json({ error: 'no_missions_for_subject' });
  }
  const maxScore = computeMaxScore(subject);
  const id = randomUUID();
  const now = Date.now();
  const ip = (req.ip || '').slice(0, 50);

  db.prepare(`INSERT INTO runs
    (id, callsign, subject, variant_ids, max_score, status, client_ip, started_at)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`)
    .run(id, callsign.trim(), subject, JSON.stringify(variantIds), maxScore, ip, now);

  const variants = missionsForSubject(subject).map((m) => ({
    mission_id: m.id,
    variant_id: variantIds[m.id],
  }));

  res.status(201).json({
    run_id: id,
    subject,
    variants,
    max_score: maxScore,
    started_at: now,
  });
});

app.post('/api/run/submit', submitLimiter, (req, res) => {
  const { run_id, answers } = req.body as { run_id?: unknown; answers?: unknown };
  if (typeof run_id !== 'string' || !run_id) {
    return res.status(400).json({ error: 'bad_request' });
  }
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'bad_answers' });
  }

  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(run_id) as RunRow | undefined;
  if (!run) return res.status(404).json({ error: 'run_not_found' });
  if (run.status !== 'open') return res.status(409).json({ error: 'run_already_submitted' });

  const ageMs = Date.now() - run.started_at;
  if (ageMs > RUN_TTL_MS) {
    db.prepare("UPDATE runs SET status='expired' WHERE id=?").run(run_id);
    return res.status(410).json({ error: 'run_expired' });
  }

  const variantIds = JSON.parse(run.variant_ids) as Record<string, string>;
  const result = computeScore(run.subject, variantIds, answers as Record<string, Record<string, number>>);
  const submittedAt = Date.now();
  const durationMs = submittedAt - run.started_at;
  const flagged = durationMs < 15_000 ? 1 : 0;

  db.transaction(() => {
    db.prepare(`UPDATE runs
                SET status='submitted', score=?, submitted_at=?, duration_ms=?, flagged=?
                WHERE id=?`)
      .run(result.total, submittedAt, durationMs, flagged, run_id);

    db.prepare(`INSERT INTO leaderboard_entries
                (run_id, callsign, subject, score, max_score, duration_ms, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(run_id, run.callsign, run.subject, result.total, run.max_score, durationMs, submittedAt);
  })();

  res.json({
    run_id,
    score: result.total,
    max_score: run.max_score,
    per_mission: result.perMission,
    duration_ms: durationMs,
  });
});

app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const entries = db
    .prepare(`SELECT * FROM leaderboard_entries
              ORDER BY score DESC, duration_ms ASC, created_at ASC
              LIMIT ? OFFSET ?`)
    .all(limit, offset) as LeaderboardEntryRow[];

  const total = (db.prepare('SELECT COUNT(*) as c FROM leaderboard_entries').get() as { c: number }).c;

  // Aggregate per-callsign totals (best run per subject + sum)
  const aggregates = db
    .prepare(`SELECT callsign,
                     SUM(score) as total_score,
                     SUM(max_score) as total_max,
                     COUNT(*) as runs
              FROM (
                SELECT callsign, subject, MAX(score) as score, max_score
                FROM leaderboard_entries
                GROUP BY callsign, subject
              )
              GROUP BY callsign
              -- NEON KAT: explicit tiebreakers so leaderboard isn't dependent on SQLite internals.
              ORDER BY total_score DESC, runs ASC, callsign ASC
              LIMIT 50`)
    .all() as Array<{ callsign: string; total_score: number; total_max: number; runs: number }>;

  res.set('Cache-Control', 'public, max-age=15');
  res.json({ total, entries, aggregates });
});

app.get('/api/leaderboard/:subject', (req, res) => {
  const subject = req.params.subject;
  if (!VALID_SUBJECTS.has(subject)) return res.status(400).json({ error: 'bad_subject' });

  const limit = Math.min(Number(req.query.limit) || 100, 200);

  // Best run per callsign for this subject — deterministic via window function.
  // (Previous version used HAVING with two aggregates which is undefined behaviour
  // when callsign has multiple equally-best rows.)
  const entries = db
    .prepare(`WITH ranked AS (
                SELECT *,
                       ROW_NUMBER() OVER (
                         PARTITION BY callsign
                         ORDER BY score DESC, duration_ms ASC, created_at ASC
                       ) AS rn
                FROM leaderboard_entries
                WHERE subject = ?
              )
              SELECT id, run_id, callsign, subject, score, max_score, duration_ms, created_at
              FROM ranked
              WHERE rn = 1
              ORDER BY score DESC, duration_ms ASC, created_at ASC
              LIMIT ?`)
    .all(subject, limit) as LeaderboardEntryRow[];

  res.set('Cache-Control', 'public, max-age=15');
  res.json({ subject, entries });
});

app.post('/api/admin/reload', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'forbidden' });
  }
  reloadMissions();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[cybervpr] listening on :${PORT}`);
});
