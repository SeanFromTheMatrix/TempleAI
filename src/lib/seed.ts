import { supabase } from './supabase';

// Seed-on-signup (Master Build Spec §4) — ported from the prototype's data.js: the authored
// "Push · Incline Focus" session with its 5 session_exercises (cue/last/alt), plus one coach_thread.
// Idempotent: skips if the user already has a session, so it's safe to call on every app entry
// (covers users who onboarded before seeding existed). The shared `movements` catalog (for the
// deferred manual-add flow) is NOT seeded here — it needs admin/service insert, out of the core loop.

type SeedAlt = { movement: string; sets: number; reps: number; weight: string; cue: string; why: string };
type SeedExercise = {
  movement: string;
  sets: number;
  reps: number;
  weight: number; // numeric target; bodyweight-plus lifts noted via plus:true
  plus?: boolean;
  last: string;
  cue: string;
  alt: SeedAlt;
};

const SEED_SESSION = {
  title: 'Push · Incline Focus',
  note: 'Built around your sternum — no deep pec stretch today. Strength over heroics.',
  duration: 48,
  exercises: [
    {
      movement: 'Incline Barbell Press', sets: 4, reps: 5, weight: 155, last: '150 × 5',
      cue: 'Elbows ~45°. Stop a hair above a full stretch to protect the sternum.',
      alt: { movement: 'Machine Incline Press', sets: 4, reps: 8, weight: '120 lb',
        cue: 'Fixed path — easy on the shoulder and sternum.',
        why: 'Swapped to a machine incline — same chest focus, far less strain while you’re tender.' },
    },
    {
      movement: 'Weighted Dip', sets: 3, reps: 8, weight: 45, plus: true, last: '+40 × 8',
      cue: 'Stay tall, slight lean. End a rep early if anything pinches.',
      alt: { movement: 'Close-Grip Incline Press', sets: 3, reps: 10, weight: '95 lb',
        cue: 'Triceps and lower chest without the deep stretch.',
        why: 'Traded dips for a close-grip incline — protects the sternum, keeps the triceps work.' },
    },
    {
      movement: 'Seated DB Shoulder Press', sets: 3, reps: 10, weight: 50, last: '50 × 9',
      cue: 'Ribs down — don’t arch into the low back.',
      alt: { movement: 'Neutral-Grip DB Press', sets: 3, reps: 12, weight: '45 lb',
        cue: 'Palms facing in — kinder on the shoulder joint.',
        why: 'Switched to neutral-grip — palms in takes the pressure off a cranky shoulder.' },
    },
    {
      movement: 'Cable Lateral Raise', sets: 3, reps: 15, weight: 15, last: '15 × 15',
      cue: 'Lead with the elbow, pinkie a touch high. Smooth, not swung.',
      alt: { movement: 'Machine Lateral Raise', sets: 3, reps: 15, weight: '40 lb',
        cue: 'Supported path — just the side delt, no momentum.',
        why: 'Machine raises instead — same delt, no shoulder strain from stabilizing.' },
    },
    {
      movement: 'Overhead Triceps Extension', sets: 3, reps: 12, weight: 70, last: '65 × 12',
      cue: 'Full lockout, slow negative. This is the finisher.',
      alt: { movement: 'Rope Pushdown', sets: 3, reps: 15, weight: '60 lb',
        cue: 'Elbows pinned — no overhead position to aggravate anything.',
        why: 'Pushdowns instead — keeps the arms out of any painful overhead stretch.' },
    },
  ] as SeedExercise[],
};

export async function seedIfNeeded(userId: string): Promise<void> {
  // Idempotent guard: a seeded user always has at least one session.
  const { data: existing, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (error || (existing && existing.length > 0)) return;

  // One coach thread per user ("one coach, one memory").
  const { data: thread } = await supabase
    .from('coach_threads')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (!thread || thread.length === 0) {
    await supabase.from('coach_threads').insert({ user_id: userId, label: 'Coach' });
  }

  // The authored session.
  const { data: sess, error: sErr } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      title: SEED_SESSION.title,
      note: SEED_SESSION.note,
      status: 'authored',
      duration: SEED_SESSION.duration,
    })
    .select('id')
    .single();
  if (sErr || !sess) return;

  // Its exercises (all start not-done — logging is what marks them done, §6.1).
  const rows = SEED_SESSION.exercises.map((e, i) => ({
    session_id: sess.id,
    movement: e.movement,
    position: i,
    target_sets: e.sets,
    target_reps: e.reps,
    target_weight: e.weight,
    cue: e.cue,
    last: e.last,
    alt: e.alt,
    done: false,
  }));
  await supabase.from('session_exercises').insert(rows);
}
