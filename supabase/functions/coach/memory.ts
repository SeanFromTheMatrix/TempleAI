// memory.ts — per-turn memory assembly (Master Build Spec §7). Reads the lifter's own rows through
// an RLS-scoped client (the caller's JWT), so the function can only ever see one user's data. It
// returns (a) a compact MEMORY block injected as a system message, (b) the recent thread mapped to
// Anthropic message turns, and (c) today's session for the optional inline session card.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOAL_PHRASE: Record<string, string> = {
  strength: 'build strength & size',
  lean: 'get leaner while staying strong',
  mobility: 'move well and stay mobile',
  health: 'steady, balanced health',
  rebuild: 'rebuild carefully after a break',
};

const LEVEL_PHRASE: Record<string, string> = {
  new: 'new (lead them; they follow the plan)',
  return: 'returning (easing back in)',
  inter: 'intermediate (refine and push)',
  advanced: 'advanced (assist, stay out of the way)',
};

export type TurnMsg = { role: 'user' | 'assistant'; content: string };

export type TodayCard = {
  session_id: string;
  title: string;
  done: number;
  total: number;
  duration: number | null;
};

export type Memory = {
  block: string; // the system MEMORY block
  thread: TurnMsg[]; // recent conversation, oldest→newest
  today: TodayCard | null; // for the [[SESSION_CARD]] affordance
};

export async function assembleMemory(
  db: SupabaseClient,
  userId: string,
  threadId: string,
): Promise<Memory> {
  // Run the independent reads together.
  const [profileRes, issuesRes, sessionsRes] = await Promise.all([
    db.from('profiles').select('name, goal, target, level, coaching_mode, equipment, units').eq('id', userId).maybeSingle(),
    db.from('issues').select('label, region, severity, note, since').eq('user_id', userId).eq('active', true),
    db.from('sessions').select('id, date, title, status, duration').eq('user_id', userId).order('date', { ascending: false }).order('created_at', { ascending: false }).limit(5),
  ]);

  const profile = profileRes.data;
  const issues = issuesRes.data ?? [];
  const sessions = sessionsRes.data ?? [];

  // Today = the most recent session (mirrors getTodaySession ordering). Pull its exercises for the
  // done/total ring and so the coach knows what's programmed.
  const current = sessions[0] ?? null;
  let today: TodayCard | null = null;
  let exerciseLines: string[] = [];
  if (current) {
    const { data: exercises } = await db
      .from('session_exercises')
      .select('movement, target_sets, target_reps, target_weight, cue, last, done, position')
      .eq('session_id', current.id)
      .order('position', { ascending: true });
    const exs = exercises ?? [];
    const done = exs.filter((e: any) => e.done).length;
    today = {
      session_id: current.id,
      title: current.title ?? 'Today’s session',
      done,
      total: exs.length,
      duration: current.duration ?? null,
    };
    exerciseLines = exs.map((e: any) => {
      const target = `${e.target_sets ?? '?'}×${e.target_reps ?? '?'}${e.target_weight != null ? ` @ ${e.target_weight}lb` : ''}`;
      const bits = [`${e.movement} — ${target}`];
      if (e.last) bits.push(`last: ${e.last}`);
      if (e.cue) bits.push(`cue: ${e.cue}`);
      bits.push(e.done ? 'done' : 'not yet');
      return `  • ${bits.join('; ')}`;
    });
  }

  // Recent thread (last ~20), oldest→newest, for conversational continuity.
  const { data: msgs } = await db
    .from('messages')
    .select('sender, text, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(20);
  const thread: TurnMsg[] = (msgs ?? [])
    .reverse()
    .filter((m: any) => m.text)
    .map((m: any) => ({ role: m.sender === 'coach' ? 'assistant' : 'user', content: m.text as string }));

  // ── Compose the compact memory block ──────────────────────────────────────
  const lines: string[] = ['LIFTER MEMORY (you know this about them — use it; do not restate it verbatim):'];

  const name = profile?.name?.trim();
  if (name) lines.push(`- Name: ${name}`);
  const goals = (profile?.goal ?? []) as string[];
  if (goals.length) {
    const phrased = goals.map((g) => GOAL_PHRASE[g] ?? g).join(', ');
    lines.push(`- Goal: ${phrased}${profile?.target ? ` (target: ${profile.target})` : ''}`);
  }
  if (profile?.level) lines.push(`- Experience: ${LEVEL_PHRASE[profile.level] ?? profile.level}`);
  if (profile?.equipment?.length) lines.push(`- Equipment: ${profile.equipment.join(', ')}`);

  if (issues.length) {
    lines.push('- Protecting (train AROUND these; never load into pain):');
    for (const i of issues) {
      const sev = i.severity ? ` [${i.severity}]` : '';
      const note = i.note ? ` — ${i.note}` : '';
      lines.push(`    · ${i.label ?? i.region ?? 'issue'}${sev}${note}`);
    }
  } else {
    lines.push('- Nothing flagged to protect.');
  }

  if (sessions.length) {
    lines.push('- Recent sessions (newest first):');
    for (const s of sessions) {
      lines.push(`    · ${s.date ?? '?'} — ${s.title ?? 'session'} [${s.status}]`);
    }
  }

  if (today && exerciseLines.length) {
    lines.push(`- TODAY'S PLAN — "${today.title}" (${today.done}/${today.total} done${today.duration ? `, ~${today.duration} min` : ''}):`);
    lines.push(...exerciseLines);
  }

  lines.push('');
  lines.push(
    'If the lifter would clearly benefit from seeing today’s session inline, end your reply with the token [[SESSION_CARD]] on its own line (it will be replaced by a tappable card; do not describe the token).',
  );

  return { block: lines.join('\n'), thread, today };
}
