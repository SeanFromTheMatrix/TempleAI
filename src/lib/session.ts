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

// Bodyweight-plus lifts display their target/logged weight as "+NN lb" (spec §5.4).
const PLUS_LIFTS = /\b(dip|pull-?up|chin-?up)\b/i;

export function isBodyweightPlus(movement: string): boolean {
  return PLUS_LIFTS.test(movement);
}

export function formatTarget(ex: SessionExercise): string {
  const w = ex.target_weight;
  const weight = w == null ? '' : isBodyweightPlus(ex.movement) ? ` @ +${w} lb` : ` @ ${w} lb`;
  return `${ex.target_sets ?? '?'} × ${ex.target_reps ?? '?'}${weight}`;
}

// The seeded `alt.weight` is a display string ("120 lb", "+45 lb"); the row stores a number.
function parseWeight(w?: string): number | null {
  if (!w) return null;
  const n = parseInt(w.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

// Swap (§5.3): replace the exercise with its coach-suggested alternative in place. The new movement
// has no prior history, so `last` clears; `alt` clears so the card stops offering the swap again.
export async function swapExercise(ex: SessionExercise): Promise<void> {
  if (!ex.alt) return;
  await supabase
    .from('session_exercises')
    .update({
      movement: ex.alt.movement,
      target_sets: ex.alt.sets ?? ex.target_sets,
      target_reps: ex.alt.reps ?? ex.target_reps,
      target_weight: parseWeight(ex.alt.weight) ?? ex.target_weight,
      cue: ex.alt.cue ?? ex.cue,
      last: null,
      alt: null,
    })
    .eq('id', ex.id);
}

// Skip for today (§5.3): remove the movement from this session. Drop any set_logs first
// (the FK cascades, but be explicit) so nothing is orphaned, then delete the exercise row.
export async function skipExercise(ex: SessionExercise): Promise<void> {
  await supabase.from('set_logs').delete().eq('session_exercise_id', ex.id);
  await supabase.from('session_exercises').delete().eq('id', ex.id);
}
