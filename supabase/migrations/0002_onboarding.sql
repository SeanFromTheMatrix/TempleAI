-- Temple — Milestone 2 (onboarding) schema deltas.
-- Apply in the Supabase SQL editor (same as 0001 — no CLI in this project).
-- Reconciles spec §3 "On completion → write to Supabase" with the 0001 schema:
--   * goal must hold one-or-more goal ids (array; element 0 = primary) — was single text.
--   * health_connected records the deferred Apple Health step (always false this build).

-- goal: text -> text[].  Existing rows have goal = null, so the cast is a no-op for them.
-- Guarded so the migration is safe to re-run (the cast would fail on an already-array column).
do $$
begin
  if (
    select data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'goal'
  ) = 'text' then
    alter table public.profiles
      alter column goal type text[]
      using case when goal is null then null else array[goal] end;
  end if;
end $$;

-- Deferred Apple Health connection flag (spec §3 screen 4 — not wired this build).
alter table public.profiles
  add column if not exists health_connected boolean not null default false;
