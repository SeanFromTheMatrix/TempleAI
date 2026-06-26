# Temple — resume point (2026-06-25, ~6pm)

Pick up here. **Milestone 2 (onboarding) is built, pushed, and visually verified on the
iOS simulator.** Exactly ONE thing is left to make it persist: apply migration `0002`.

## What's done (commit `3f6e4a1`, on origin/main)
- Full 4-screen onboarding flow (`src/components/onboarding.tsx`, route `src/app/onboarding.tsx`),
  built verbatim to spec §3: welcome → goals → experience+equipment → protect (injuries).
  Progress dots, back chevron, disabled-until-valid Continue, bodyweight-exclusive equipment
  rule, live note placeholder/reassurance. Screen 4 (Apple Health) deferred per spec.
- `src/lib/profile.tsx` — `ProfileProvider`/`useProfile`; derives `onboarded` from a non-empty
  `goal`, survives restart; `refresh()` flips the gate after onboarding.
- `src/lib/onboarding.ts` — spec option lists, `coachingModeForLevel`, `completeOnboarding()`
  (writes `profiles` + one `issues` row per flagged region; RLS-scoped).
- `src/app/_layout.tsx` — third routing gate: signed-in & not-onboarded → onboarding;
  SplashGate waits on the profile fetch (no flash).
- typecheck clean; lint clean for these files (one PRE-EXISTING lint error in
  `use-color-scheme.web.ts`, not ours). eslint got wired in by `expo lint`.

## Verified on simulator (iPhone 16 Pro, iOS 18.3, Debug build w/ Metro)
- App already had a persisted session (M1) → landed straight in onboarding. Auth is NOT a blocker.
- Drove all screens; selections, accents (clay/lavender/sage/gold), copy, dots, chevron all render.
- Final **Continue → "Could not save: could not find the 'health_connected' column of 'profiles'
  in the schema cache."**  ← this is the missing migration, nothing else.

## THE ONE BLOCKER: migration 0002 is not applied to the live DB
Confirmed via REST introspection: live `profiles.goal` is still `text` (needs `text[]`) and
`health_connected` does not exist. The committed `supabase/migrations/0002_onboarding.sql` fixes
both. It was NOT applied because there is **no Supabase admin credential on this machine** — no
CLI, no `config.toml`, no `~/.supabase`, no Keychain token, no DB password, nothing in shell
history. The service-role key in `supabase/.env` can read/write rows but CANNOT run DDL.

### Pick ONE to finish (in order of cleanliness)
1. **Access token (best).** supabase.com → Account → Access Tokens → Generate (`sbp_…`). Then,
   without committing the token:
   ```bash
   # ref = eekawfoehyweyfgqiroa
   curl -s -X POST "https://api.supabase.com/v1/projects/eekawfoehyweyfgqiroa/database/query" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
     --data @- <<'JSON'
   { "query": "do $$ begin if (select data_type from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='goal')='text' then alter table public.profiles alter column goal type text[] using case when goal is null then null else array[goal] end; end if; end $$; alter table public.profiles add column if not exists health_connected boolean not null default false;" }
   JSON
   ```
2. **DB password** → install psql / use a node `pg` script against the pooler and run the same SQL.
3. **Dashboard** → paste `supabase/migrations/0002_onboarding.sql` into Supabase SQL Editor, Run.
4. **No-migration code adaptation (zero credential).** Change `completeOnboarding` to store goals
   as a comma-joined string in the existing `goal text` column and drop the `health_connected`
   write; update `Profile.goal` + the `onboarded` check to parse it. Works immediately; recover
   to the array column later. (Sean was asked to choose 1–4 but left before deciding.)

After applying via 1–3: relaunch, finish onboarding, force-quit, relaunch → profile + issues
persist (the spec §3 acceptance). Then PostgREST may need a schema-cache reload (it auto-reloads;
or `notify pgrst, 'reload schema';`).

## Re-run the app at home
```bash
cd ~/Documents/Personal/temple
# Xcode must be 26.2: xcodebuild -version  (if wrong: sudo xcode-select -s "/Applications/Xcode 2.app/Contents/Developer")
npx expo run:ios --device "iPhone 16 Pro"      # Debug + Metro; simulator shares the Mac network
```
Open question for Sean still pending: per-screen accent hex values (clay/lavender/sage/gold) are
my interpretation — spec named the accents, not exact colors. Tune in `ACCENT` in
`src/components/onboarding.tsx` once approved.

## After M2 lands → M3 (core loop), then M4 coach (needs ANTHROPIC_API_KEY in supabase/.env).
