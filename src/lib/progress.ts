import { supabase } from './supabase';

// Progress data (Master Build Spec §6 / progress.jsx). Each lift's line is its estimated 1RM over
// time, derived from the set_logs we already write — no separate tracking. RLS scopes set_logs to
// the owner through the session_exercise → session chain, so a bare select returns just their work.

// Epley estimated 1RM. The chart point for a (lift, day) is the best set's estimate that day.
export const epley = (weight: number, reps: number) => weight * (1 + reps / 30);

export type LiftPoint = { day: string; value: number };
export type LiftSeries = { movement: string; points: LiftPoint[] };

type SetRow = {
  weight: number | null;
  reps: number | null;
  logged_at: string;
  session_exercises: { movement: string | null } | { movement: string | null }[] | null;
};

const movementOf = (r: SetRow): string | null => {
  const se = r.session_exercises;
  const m = Array.isArray(se) ? se[0]?.movement : se?.movement;
  return m ?? null;
};

export async function getProgress(userId: string): Promise<LiftSeries[]> {
  const { data } = await supabase
    .from('set_logs')
    .select('weight, reps, logged_at, session_exercises!inner(movement)')
    .order('logged_at', { ascending: true });

  const rows = (data ?? []) as SetRow[];

  // movement -> day -> best e1RM
  const byMove = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const movement = movementOf(r);
    if (!movement || r.weight == null || r.reps == null) continue;
    const day = r.logged_at.slice(0, 10);
    const est = epley(r.weight, r.reps);
    let days = byMove.get(movement);
    if (!days) byMove.set(movement, (days = new Map()));
    days.set(day, Math.max(days.get(day) ?? 0, est));
  }

  const series: LiftSeries[] = [];
  for (const [movement, days] of byMove) {
    const points = [...days.entries()]
      .map(([day, value]) => ({ day, value: Math.round(value) }))
      .sort((a, b) => a.day.localeCompare(b.day));
    series.push({ movement, points });
  }
  // Lifts with the most history first — the richest lines lead.
  series.sort((a, b) => b.points.length - a.points.length);
  return series;
}

export type Range = '30d' | '90d' | '1y' | 'all';
export const RANGES: { id: Range; label: string; days: number | null }[] = [
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
  { id: '1y', label: '1y', days: 365 },
  { id: 'all', label: 'All', days: null },
];

// Points within the range window, measured back from the latest logged day (not wall-clock, so a
// returning lifter still sees their line rather than an empty window).
export function pointsInRange(points: LiftPoint[], range: Range): LiftPoint[] {
  const days = RANGES.find((r) => r.id === range)?.days ?? null;
  if (!days || points.length === 0) return points;
  const latest = new Date(points[points.length - 1].day).getTime();
  const cutoff = latest - days * 86_400_000;
  return points.filter((p) => new Date(p.day).getTime() >= cutoff);
}

export type Trend = 'rising' | 'holding' | 'easing';
export function trendOf(points: LiftPoint[]): Trend {
  if (points.length < 2) return 'holding';
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const ratio = (last - first) / (first || 1);
  return ratio > 0.02 ? 'rising' : ratio < -0.02 ? 'easing' : 'holding';
}
