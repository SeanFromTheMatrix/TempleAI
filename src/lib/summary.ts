import type { Profile } from './profile';
import type { TodaySession } from './session';
import { supabase } from './supabase';

// Session summary + save (Master Build Spec §5.5 / §6.3). On Save: mark the session done and
// append a coach reflection to the one coach thread, so the next coach turn can read how it went.
// The reflection is a deterministic stand-in until the LLM edge function lands (step 5).

export type SessionStats = { totalExercises: number; doneExercises: number; setsLogged: number };

export async function getSessionStats(session: TodaySession): Promise<SessionStats> {
  const ids = session.exercises.map((e) => e.id);
  let setsLogged = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from('set_logs')
      .select('id', { count: 'exact', head: true })
      .in('session_exercise_id', ids);
    setsLogged = count ?? 0;
  }
  return {
    totalExercises: session.exercises.length,
    doneExercises: session.exercises.filter((e) => e.done).length,
    setsLogged,
  };
}

const GOAL_PHRASE: Record<string, string> = {
  strength: 'strength & size',
  lean: 'a leaner, stronger you',
  mobility: 'moving well for the long haul',
  health: 'steady, balanced health',
  rebuild: 'a careful rebuild',
};

export function buildReflection(profile: Profile | null, stats: SessionStats): string {
  const goal = (profile?.goal?.[0] && GOAL_PHRASE[profile.goal[0]]) || 'the long path';
  const movements = `${stats.doneExercises} of ${stats.totalExercises} movements`;
  const sets = `${stats.setsLogged} ${stats.setsLogged === 1 ? 'set' : 'sets'} logged`;
  return (
    `${movements}, ${sets}. You trained around what needed protecting and left ego at the door — ` +
    `that's the patient work that compounds toward ${goal}. Logged and remembered.`
  );
}

export async function saveSession(
  userId: string,
  sessionId: string,
  reflection: string,
): Promise<void> {
  await supabase.from('sessions').update({ status: 'done' }).eq('id', sessionId);

  const { data: thread } = await supabase
    .from('coach_threads')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (thread?.id) {
    await supabase.from('messages').insert({
      thread_id: thread.id,
      sender: 'coach',
      text: reflection,
      context: { session_id: sessionId, kind: 'reflection' },
    });
  }
}
