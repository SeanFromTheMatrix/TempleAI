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

// Honest, not a trophy: the reflection is tiered by what actually happened. Earned praise belongs
// only to a session carried start-to-finish; a partial is recorded factually (what's done, what's
// left) and a near-empty one plainly — no spin, but no scolding either. (Skipped lifts are removed
// from the session at §5.3, so `total` is what was actually on the table after skips.)
export function buildReflection(profile: Profile | null, stats: SessionStats): string {
  const goal = (profile?.goal?.[0] && GOAL_PHRASE[profile.goal[0]]) || 'the long path';
  const { doneExercises: done, totalExercises: total, setsLogged } = stats;
  const sets = `${setsLogged} ${setsLogged === 1 ? 'set' : 'sets'} logged`;
  const movements = `${done} of ${total} movements`;

  // Nothing actually trained — record it plainly. No spin, no guilt.
  if (setsLogged === 0 || total === 0) {
    return `Session closed — nothing logged this time. No spin on it; the work's here when you come back.`;
  }

  // Carried start to finish — the one place earned praise belongs.
  if (done >= total) {
    const head = total === 1 ? `Your one movement, ${sets}` : `All ${total} movements, ${sets}`;
    return (
      `${head} — start to finish. ` +
      `That's the patient work that compounds toward ${goal}. Logged and remembered.`
    );
  }

  // Most of it done — acknowledge the work, name what's left, don't dress it up.
  if (done * 2 >= total) {
    return `${movements}, ${sets}. Solid chunk done, the rest left on the table — we pick those up next time. Logged.`;
  }

  // A short one — honest and neutral. Not a trophy, not a telling-off.
  return `${movements}, ${sets}. A short session today — logged as it was, not dressed up. The rest is waiting when you are.`;
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
