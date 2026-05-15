import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'data.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS runs (
  id            TEXT PRIMARY KEY,
  callsign      TEXT NOT NULL,
  subject       TEXT NOT NULL,
  variant_ids   TEXT NOT NULL,
  score         INTEGER,
  max_score     INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open',
  client_ip     TEXT,
  started_at    INTEGER NOT NULL,
  submitted_at  INTEGER,
  duration_ms   INTEGER,
  flagged       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id       TEXT NOT NULL UNIQUE,
  callsign     TEXT NOT NULL,
  subject      TEXT NOT NULL,
  score        INTEGER NOT NULL,
  max_score    INTEGER NOT NULL,
  duration_ms  INTEGER NOT NULL,
  created_at   INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE INDEX IF NOT EXISTS idx_lb_subject_score    ON leaderboard_entries(subject, score DESC, duration_ms ASC);
CREATE INDEX IF NOT EXISTS idx_lb_global_score     ON leaderboard_entries(score DESC, duration_ms ASC);
CREATE INDEX IF NOT EXISTS idx_lb_callsign         ON leaderboard_entries(callsign);
CREATE INDEX IF NOT EXISTS idx_runs_status_started ON runs(status, started_at);
`;

db.exec(SCHEMA);

export interface RunRow {
  id: string;
  callsign: string;
  subject: string;
  variant_ids: string;
  score: number | null;
  max_score: number;
  status: 'open' | 'submitted' | 'expired';
  client_ip: string | null;
  started_at: number;
  submitted_at: number | null;
  duration_ms: number | null;
  flagged: number;
}

export interface LeaderboardEntryRow {
  id: number;
  run_id: string;
  callsign: string;
  subject: string;
  score: number;
  max_score: number;
  duration_ms: number;
  created_at: number;
}
