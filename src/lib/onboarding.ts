import { seedIfNeeded } from './seed';
import { supabase } from './supabase';

// Option lists + completion write for the onboarding flow (spec §3).
// Mirrors the prototype's TEMPLE_DATA.onboarding. Copy is intentional — keep it verbatim.

export type Option = { id: string; label: string; desc?: string };

// Screen 1 — Goals (multi-select, ≥1). Stored as ids → profiles.goal[]; [0] = primary.
export const GOALS: Option[] = [
  { id: 'strength', label: 'Build strength & size', desc: 'Get stronger, add muscle' },
  { id: 'lean', label: 'Lose fat, stay strong', desc: 'Leaner without losing power' },
  { id: 'mobility', label: 'Move well & mobile', desc: 'Flexibility, control, longevity' },
  { id: 'health', label: 'General health', desc: 'Consistent, balanced training' },
  { id: 'rebuild', label: 'Rebuild after a break', desc: 'Ease back in, carefully' },
];

// Screen 2 — Experience (single-select). Stored as id → profiles.level.
export const LEVELS: Option[] = [
  { id: 'new', label: 'New', desc: "Lead me — I'll follow the plan" },
  { id: 'return', label: 'Returning', desc: "I've trained before; easing back" },
  { id: 'inter', label: 'Intermediate', desc: 'I know the lifts; refine and push me' },
  { id: 'advanced', label: 'Advanced', desc: "Assist, don't get in my way" },
];

// Screen 2 — Equipment (multi-select). Stored as the label strings → profiles.equipment[].
export const EQUIPMENT: string[] = [
  'Full gym',
  'Barbell & rack',
  'Dumbbells',
  'Cables & machines',
  'Bodyweight only',
  'Resistance bands',
];

// `Bodyweight only` is exclusive — it clears the rest, and any other clears it.
export const BODYWEIGHT_ONLY = 'Bodyweight only';

// Screen 3 — Protect (multi-select). Each selected region becomes an issues row.
export const REGIONS: Option[] = [
  { id: 'neck', label: 'Neck' },
  { id: 'shoulder', label: 'Shoulders' },
  { id: 'chest', label: 'Chest / sternum' },
  { id: 'elbow', label: 'Elbows' },
  { id: 'lowback', label: 'Lower back' },
  { id: 'hip', label: 'Hips' },
  { id: 'knee', label: 'Knees' },
  { id: 'ankle', label: 'Ankles' },
];

// `level` drives how much the coach leads vs. assists. Carried into the profile so
// the coach prompt (M4) can read it without re-deriving.
export function coachingModeForLevel(level: string): string {
  switch (level) {
    case 'new':
      return 'lead';
    case 'return':
      return 'guide';
    case 'inter':
      return 'refine';
    case 'advanced':
      return 'assist';
    default:
      return 'guide';
  }
}

export type OnboardingDraft = {
  goals: string[]; // ordered by selection; [0] = primary
  level: string;
  equipment: string[];
  regions: Option[]; // selected region pills
  note: string;
};

// Writes one profiles row (update — the signup trigger already created it) plus
// zero-or-more issues rows for the signed-in user. Throws on any error so the
// caller can surface it and keep the user on the flow.
export async function completeOnboarding(userId: string, draft: OnboardingDraft) {
  const note = draft.note.trim();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      goal: draft.goals,
      level: draft.level,
      coaching_mode: coachingModeForLevel(draft.level),
      equipment: draft.equipment,
      units: 'lb',
      health_connected: false,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  // `since = now` per spec; severity defaults to moderate (the flow doesn't ask).
  const since = new Date().toISOString().slice(0, 10);

  if (draft.regions.length > 0) {
    // One issue per flagged region; the free-text note rides along on each.
    const rows = draft.regions.map((r) => ({
      user_id: userId,
      kind: 'injury',
      region: r.id,
      label: r.label,
      severity: 'moderate',
      note: note || null,
      since,
    }));
    const { error } = await supabase.from('issues').insert(rows);
    if (error) throw error;
  } else if (note) {
    // No region chosen but the user wrote something — keep it as a profile-level
    // issue so the coach still sees it (spec §3: "or a profile-level note").
    const { error } = await supabase.from('issues').insert({
      user_id: userId,
      kind: 'injury',
      label: 'General note',
      severity: 'moderate',
      note,
      since,
    });
    if (error) throw error;
  }

  // Seed the authored session + coach thread (§4 "seeds on signup"). Idempotent;
  // failure here shouldn't block onboarding from completing.
  await seedIfNeeded(userId);
}
