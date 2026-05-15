import type { Subject } from '../types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) || '/api';

export interface StartResponse {
  run_id: string;
  subject: Subject;
  variants: { mission_id: string; variant_id: string }[];
  max_score: number;
  started_at: number;
}

export interface SubmitResponse {
  run_id: string;
  score: number;
  max_score: number;
  per_mission: Record<string, { earned: number; max: number; wrong: string[] }>;
  duration_ms: number;
}

export interface LeaderboardEntry {
  id: number;
  run_id: string;
  callsign: string;
  subject: Subject;
  score: number;
  max_score: number;
  duration_ms: number;
  created_at: number;
}

export interface LeaderboardAggregate {
  callsign: string;
  total_score: number;
  total_max: number;
  runs: number;
}

export interface LeaderboardResponse {
  total: number;
  entries: LeaderboardEntry[];
  aggregates?: LeaderboardAggregate[];
}

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine;

const fetchJSON = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const r = await fetch(url, init);
  if (!r.ok) {
    let body: unknown;
    try {
      body = await r.json();
    } catch {
      body = await r.text();
    }
    throw new Error(`API ${r.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return r.json() as Promise<T>;
};

export const startRun = async (
  callsign: string,
  subject: Subject,
  excludeVariants?: Record<string, string>,
): Promise<StartResponse> => {
  const body: Record<string, unknown> = { callsign, subject };
  if (excludeVariants && Object.keys(excludeVariants).length > 0) {
    body.exclude_variants = excludeVariants;
  }
  return fetchJSON<StartResponse>(`${API_BASE}/run/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

export const submitRun = async (
  runId: string,
  answers: Record<string, Record<string, number>>,
): Promise<SubmitResponse> => {
  return fetchJSON<SubmitResponse>(`${API_BASE}/run/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ run_id: runId, answers }),
  });
};

export const fetchLeaderboard = async (subject?: Subject): Promise<LeaderboardResponse> => {
  const url = subject ? `${API_BASE}/leaderboard/${subject}` : `${API_BASE}/leaderboard`;
  return fetchJSON<LeaderboardResponse>(url);
};

export const isApiAvailable = async (): Promise<boolean> => {
  if (!isOnline()) return false;
  try {
    const r = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return r.ok;
  } catch {
    return false;
  }
};
