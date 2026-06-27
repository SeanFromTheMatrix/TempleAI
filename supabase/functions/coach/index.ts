// coach/index.ts — the Temple coach service (Master Build Spec §7). "The model speaks;
// deterministic code decides." Flow per turn:
//   verify caller (JWT, RLS-scoped) → assemble memory → call Claude (cached system + memory)
//   → strip the optional session-card token → safety guard → persist user+coach messages → return.
//
// Secrets: ANTHROPIC_API_KEY (set via `supabase secrets set`). SUPABASE_URL / SUPABASE_ANON_KEY
// are injected by the Edge runtime. The model key never leaves the server.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { assembleMemory } from './memory.ts';
import { SYSTEM_PROMPT, pickModel } from './prompt.ts';
import { guardReply } from './guard.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MAX_TOKENS = 700;
const CARD_TOKEN = '[[SESSION_CARD]]';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'missing_auth' }, 401);

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) return json({ error: 'server_misconfigured' }, 500);

  // RLS-scoped client: every read/write below is constrained to this user's rows.
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );

  const { data: userData, error: userErr } = await db.auth.getUser();
  const userId = userData?.user?.id;
  if (userErr || !userId) return json({ error: 'invalid_token' }, 401);

  let message = '';
  try {
    const body = await req.json();
    message = (body?.message ?? '').toString().trim();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!message) return json({ error: 'empty_message' }, 400);
  if (message.length > 2000) message = message.slice(0, 2000); // cheap input cap

  // One coach, one memory: find the user's single thread (create if somehow missing).
  let threadId: string | undefined;
  const { data: thread } = await db.from('coach_threads').select('id').eq('user_id', userId).limit(1).maybeSingle();
  threadId = thread?.id;
  if (!threadId) {
    const { data: created, error } = await db
      .from('coach_threads')
      .insert({ user_id: userId, label: 'Coach' })
      .select('id')
      .single();
    if (error || !created) return json({ error: 'thread_unavailable' }, 500);
    threadId = created.id;
  }

  // Assemble memory and call the model.
  const memory = await assembleMemory(db, userId, threadId);
  const model = pickModel(message);

  const payload = {
    model,
    max_tokens: MAX_TOKENS,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: memory.block },
    ],
    messages: [...memory.thread, { role: 'user', content: message }],
  };

  let rawReply = '';
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error('anthropic error', res.status, detail);
      return json({ error: 'model_unavailable' }, 502);
    }
    const data = await res.json();
    rawReply = (data?.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
  } catch (e) {
    console.error('anthropic fetch failed', e);
    return json({ error: 'model_unavailable' }, 502);
  }
  if (!rawReply) return json({ error: 'empty_reply' }, 502);

  // The model may request the inline session card by ending with the token.
  let card: Record<string, unknown> | null = null;
  if (rawReply.includes(CARD_TOKEN)) {
    rawReply = rawReply.replaceAll(CARD_TOKEN, '').trim();
    if (memory.today) card = { kind: 'session', ...memory.today };
  }

  // Safety backstop, then persist both turns (user first so ordering reads correctly).
  const guarded = guardReply(message, rawReply);

  await db.from('messages').insert({ thread_id: threadId, sender: 'user', text: message });
  const { data: coachMsg } = await db
    .from('messages')
    .insert({ thread_id: threadId, sender: 'coach', text: guarded.text, card })
    .select('id, created_at')
    .single();

  return json({
    reply: guarded.text,
    card,
    flagged: guarded.flagged,
    model,
    message_id: coachMsg?.id ?? null,
    created_at: coachMsg?.created_at ?? null,
  });
});
