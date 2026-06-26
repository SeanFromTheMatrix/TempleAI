import { supabase } from './supabase';

// Set logging (Master Build Spec §5.4 / §6). Each logged set writes a set_logs row immediately,
// so logged work survives a force-quit (§6.2). Logging the final target set flips the exercise's
// done flag (§6.1) — there is no separate "mark done" step.

export type SetLog = {
  id: string;
  set_index: number | null;
  weight: number | null;
  reps: number | null;
  rir: number | null;
};

export async function getSetLogs(sessionExerciseId: string): Promise<SetLog[]> {
  const { data } = await supabase
    .from('set_logs')
    .select('id, set_index, weight, reps, rir')
    .eq('session_exercise_id', sessionExerciseId)
    .order('set_index', { ascending: true });
  return (data as SetLog[]) ?? [];
}

export async function logSet(p: {
  sessionExerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
  rir: number;
}): Promise<SetLog | null> {
  const { data, error } = await supabase
    .from('set_logs')
    .insert({
      session_exercise_id: p.sessionExerciseId,
      set_index: p.setIndex,
      weight: p.weight,
      reps: p.reps,
      rir: p.rir,
    })
    .select('id, set_index, weight, reps, rir')
    .single();
  if (error) return null;
  return data as SetLog;
}

export async function markExerciseDone(sessionExerciseId: string): Promise<void> {
  await supabase.from('session_exercises').update({ done: true }).eq('id', sessionExerciseId);
}
