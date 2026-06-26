import { supabase } from './supabase';

// Reads the lifter's current authored session + its exercises for the Today screen (§5.3).
// Progress/done-state come straight from the DB so they survive force-quit (§6.2).

export type Alt = {
  movement: string;
  sets?: number;
  reps?: number;
  weight?: string;
  cue?: string;
  why?: string;
};

export type SessionExercise = {
  id: string;
  movement: string;
  position: number | null;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  cue: string | null;
  last: string | null;
  alt: Alt | null;
  done: boolean;
};

export type TodaySession = {
  id: string;
  title: string | null;
  note: string | null;
  duration: number | null;
  status: string;
  exercises: SessionExercise[];
};

export async function getTodaySession(userId: string): Promise<TodaySession | null> {
  const { data: sess, error } = await supabase
    .from('sessions')
    .select('id, title, note, duration, status')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !sess) return null;

  const { data: exercises } = await supabase
    .from('session_exercises')
    .select('id, movement, position, target_sets, target_reps, target_weight, cue, last, alt, done')
    .eq('session_id', sess.id)
    .order('position', { ascending: true });

  return { ...(sess as Omit<TodaySession, 'exercises'>), exercises: (exercises as SessionExercise[]) ?? [] };
}

// Bodyweight-plus lifts display their target as "+NN lb" (spec §5.4).
const PLUS_LIFTS = /\b(dip|pull-?up|chin-?up)\b/i;

export function formatTarget(ex: SessionExercise): string {
  const w = ex.target_weight;
  const weight = w == null ? '' : PLUS_LIFTS.test(ex.movement) ? ` @ +${w} lb` : ` @ ${w} lb`;
  return `${ex.target_sets ?? '?'} × ${ex.target_reps ?? '?'}${weight}`;
}
