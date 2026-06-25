-- Temple — initial schema (Milestone 1, backend-first)
-- Source: spec §6. Every user-owned table has Row-Level Security keyed to auth.uid().
-- Notes / deviations from spec, documented for when we build the UI:
--   * messages."from" is a reserved SQL word -> column named `sender` ('coach' | 'lifter').
--   * issues carries `kind` ('injury' | 'soreness') since soreness shares this shape (§6).
--   * progress is DERIVED from set_logs (no table), per spec.

-- ========================= profiles =========================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  goal          text,
  target        text,
  level         text,
  coaching_mode text,
  equipment     text[] not null default '{}',
  units         text not null default 'lb',
  created_at    timestamptz not null default now()
);

-- ========================= issues (injuries / soreness) =========================
create table if not exists public.issues (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null default 'injury',  -- 'injury' | 'soreness'
  region     text,
  label      text,
  severity   text,
  note       text,
  since      date,
  created_at timestamptz not null default now()
);
create index if not exists issues_user_id_idx on public.issues(user_id);

-- ========================= movements (shared catalog; one per lift) =========================
create table if not exists public.movements (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  region text,
  unit   text not null default 'lb'
);

-- ========================= sessions =========================
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null default current_date,
  title      text,
  note       text,
  status     text not null default 'planned',  -- 'planned' | 'active' | 'done'
  duration   integer,                          -- minutes
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions(user_id);

-- ========================= session_exercises =========================
create table if not exists public.session_exercises (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  movement      text not null,
  target_sets   integer,
  target_reps   integer,
  target_weight numeric,
  cue           text,
  done          boolean not null default false,
  alt           text,
  position      integer
);
create index if not exists session_exercises_session_id_idx on public.session_exercises(session_id);

-- ========================= set_logs (the row everything builds on) =========================
create table if not exists public.set_logs (
  id                  uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  weight              numeric,
  reps                integer,
  logged_at           timestamptz not null default now()
);
create index if not exists set_logs_se_idx on public.set_logs(session_exercise_id);

-- ========================= coach_threads =========================
create table if not exists public.coach_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text,
  created_at timestamptz not null default now()
);
create index if not exists coach_threads_user_id_idx on public.coach_threads(user_id);

-- ========================= messages (the memory lives here) =========================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.coach_threads(id) on delete cascade,
  sender     text not null,   -- 'coach' | 'lifter'  (spec's "from")
  text       text,
  card       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_id_idx on public.messages(thread_id);

-- ========================= Row-Level Security =========================
alter table public.profiles          enable row level security;
alter table public.issues            enable row level security;
alter table public.movements         enable row level security;
alter table public.sessions          enable row level security;
alter table public.session_exercises enable row level security;
alter table public.set_logs          enable row level security;
alter table public.coach_threads     enable row level security;
alter table public.messages          enable row level security;

-- Directly user-owned tables: auth.uid() must match the owner column.
create policy "own profile" on public.profiles
  for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "own issues" on public.issues
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on public.sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own threads" on public.coach_threads
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Shared, read-only catalog for any signed-in user.
create policy "read movements" on public.movements
  for select to authenticated using (true);

-- Child tables: ownership flows through the parent.
create policy "own session_exercises" on public.session_exercises
  for all to authenticated
  using (exists (select 1 from public.sessions s
                 where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sessions s
                      where s.id = session_id and s.user_id = auth.uid()));

create policy "own set_logs" on public.set_logs
  for all to authenticated
  using (exists (select 1 from public.session_exercises se
                 join public.sessions s on s.id = se.session_id
                 where se.id = session_exercise_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.session_exercises se
                      join public.sessions s on s.id = se.session_id
                      where se.id = session_exercise_id and s.user_id = auth.uid()));

create policy "own messages" on public.messages
  for all to authenticated
  using (exists (select 1 from public.coach_threads t
                 where t.id = thread_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.coach_threads t
                      where t.id = thread_id and t.user_id = auth.uid()));

-- ========================= auto-create a profile on signup =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
