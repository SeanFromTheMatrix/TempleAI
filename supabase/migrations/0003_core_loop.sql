-- Temple — Milestone 3/4 prep: reconcile the live schema with Master Build Spec §4 so the
-- seed-on-signup (§4) and the core loop (§5.3–5.5, §6) can be built. Apply via the Supabase
-- Management API (no CLI on this Mac). Idempotent / safe to re-run.
--
-- Locked naming/enum decisions (spec-aligned, no existing rows depend on them yet):
--   * sessions.status uses 'authored' | 'active' | 'done' (spec §4). Default flips planned->authored.
--   * messages.sender value convention is 'coach' | 'user' (spec §4 "from"); column stays `sender`
--     because `from` is a reserved word. (No DDL — convention enforced in app/edge code.)

-- ───────── issues: distinguish live vs healed (§7 memory assembles ACTIVE issues) ─────────
alter table public.issues
  add column if not exists active boolean not null default true;

-- ───────── session_exercises: the Today card needs `last`; Swap needs structured `alt{movement,why}` ─────────
alter table public.session_exercises
  add column if not exists last text;

-- alt text -> jsonb ({ "movement": ..., "why": ... }). Guarded; no rows exist yet so cast is a no-op.
do $$
begin
  if (select data_type from information_schema.columns
      where table_schema='public' and table_name='session_exercises' and column_name='alt') = 'text' then
    alter table public.session_exercises
      alter column alt type jsonb using (case when alt is null or alt = '' then null else alt::jsonb end);
  end if;
end $$;

-- ───────── set_logs: §5.4 set dots + RIR + history line; final target set marks the lift done ─────────
alter table public.set_logs
  add column if not exists set_index integer;
-- rir stored 0–4 (4 represents the selector's "4+ / plenty left"); app maps the label.
alter table public.set_logs
  add column if not exists rir smallint;

-- ───────── sessions: align status default with the spec's 'authored' authored-session model ─────────
alter table public.sessions
  alter column status set default 'authored';

-- ───────── messages: the coach turn attaches structured context (e.g. a session reference) ─────────
alter table public.messages
  add column if not exists context jsonb;
