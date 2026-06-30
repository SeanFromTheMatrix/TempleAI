# Temple — resume point (2026-06-29)

## ⏳ PICK UP HERE TOMORROW — Apple Health (HealthKit), slice 1, committed as **WIP / UNVERIFIED**
Code is complete + `tsc`/eslint clean, but **never run/verified** — the native rebuild was still
compiling when we stopped.
- **What's built:** `src/lib/health.ts` (`isHealthAvailable`, `connectHealth` → requests read auth +
  sets `profiles.health_connected`, `getRecovery` → latest **HRV (SDNN)** + **resting HR** via
  `getMostRecentQuantitySample`). Body screen (`src/app/(app)/body.tsx`) now shows a **Connect Apple
  Health** card when not connected, and a **recovery metrics row** in the Readiness card when it is.
- **Library:** `@kingstinct/react-native-healthkit@^14.0.2` + `react-native-nitro-modules@^0.35.10`
  (Nitro → needs New Arch, which RN 0.85/SDK 56 has). Config plugin + `NSHealthShareUsageDescription`
  added to `app.json`.
- **GOTCHA (important):** `expo run:ios` **skipped the config-plugin sync** — the HealthKit Info.plist
  usage string + entitlement were NOT applied until I ran **`npx expo prebuild -p ios`** explicitly.
  Confirmed present now in `ios/temple/Info.plist` (`NSHealthShareUsageDescription`) + `temple.entitlements`
  (`com.apple.developer.healthkit`). `ios/` is gitignored, so after any fresh clone you must
  `npx expo prebuild -p ios` again before building.
- **RESUME STEPS:**
  1. Finish/redo the native build: `export PATH="$HOME/.n/bin:$PATH"; npx expo run:ios --device "iPhone 15 Pro"`.
  2. On the **Body** tab tap **Connect Apple Health** → grant read access (no crash = plist worked).
  3. The iOS sim has **no Health data** by default → add some in the sim **Health app** (Browse →
     Heart → Heart Rate Variability / Resting Heart Rate → Add Data), then revisit Body.
  4. ✅ Verify the **HRV + Resting HR metrics row** renders on the Readiness card; then **commit as verified**.
  5. Slice 2 (later): **sleep** (needs sleep-stage aggregation) + **baseline/trend** arrows +
     readiness-word integration + the **onboarding Apple-Health step**.

## Also still open (parked)
- **Coach prompt change is committed but NOT deployed** (`8e7297b`, frees up general training knowledge).
  Needs `functions deploy coach` → give the agent a fresh `sbp_` access token OR run `! supabase login`
  (no supabase CLI installed on this Mac yet). Until then the live coach still says "I can't look anything up".
- **Reflection honest-tiers** (`8d2d216`) shipped but never eyeballed on the sim — finish a *partial*
  session on the re-seeded "Push · Incline Focus" to see the non-trophy copy.
- **Progress demo data:** 60 `__history` sessions (title=`'__history'`) were backfilled into the live DB
  via the service key so the charts render — **removable** (`DELETE FROM sessions WHERE title='__history'`).

✅ **This session's work (2026-06-29) is committed** — the Today Adjust sheet (Swap/hurt/Skip) +
CoachNotice (`today.tsx`), `swapExercise`/`skipExercise` (`session.ts`), and `flagDiscomfort`
(`coach.ts`); the **Body tab** (`body.tsx`+`body.ts`); the **Progress tab** (`progress.tsx`+`progress.ts`);
honest reflection tiers (`summary.ts`); coach-prompt knowledge loosening (`prompt.ts`). The `.env` files
are gitignored. On branch `main` with origin. Tabs are now: Coach · Today · Body · Progress.

✅ **Core loop verified on the iPhone 15 Pro sim (2026-06-29).** Signed in via Apple ID (sim must be
signed into iCloud first, else `AuthorizationError 1000`). Swap/hurt/Skip exercised; **Finish→Save
confirmed end-to-end** — checked the live DB with the service key: session `ff7928fb…` flipped to
`status='done'` and the reflection was appended to the coach thread (`messages`, `context.kind=reflection`).
Note: the persisted Apple session does NOT survive a fresh sim/app reinstall — you re-hit the sign-in wall.

## Done this session (2026-06-29) — Today core-loop gaps closed
- **Swap is now real.** The "···" Adjust sheet's *Swap* replaces the exercise in place
  (`swapExercise` in `src/lib/session.ts`: writes movement/sets/reps/weight/cue, clears `last`+`alt`)
  and drops the coach's `alt.why` into an inline **CoachNotice** banner. (Was: preview-only "INSTEAD" box.)
- **"Something doesn't feel right"** (hurt): eases the lift to its alt if one exists, posts a protective notice.
- **Skip for today**: `skipExercise` deletes the session_exercise (+its set_logs) → drops off the list.
- RLS confirmed `for all` on session_exercises/set_logs, so update+delete are allowed for the owner.
- New UI: `ExerciseActionSheet` + `CoachNotice` in `today.tsx`; the per-card "Swap" pill is now an
  ellipsis Adjust button. `tsc --noEmit` and eslint clean on `src/`.
- **Finish → Save (§6.3): code path verified by reading** (Today→SummarySheet→saveSession sets
  status='done' + appends reflection to the thread). **Still needs a device tap-through** on the sim.

## Done & working
- **M1 auth** (Apple sign-in) + **M2 onboarding** (writes profiles + issues) — verified.
- **Migrations applied to live DB:** 0002 (goal text[], health_connected), 0003 (issues.active,
  session_exercises.last + alt jsonb, set_logs.set_index/rir, messages.context). Applied via the
  Supabase Management API with a fresh `sbp_` token each time (no CLI/cred on the Mac).
- **Design system ported from the prototype** (`docs/prototype/`): real fonts **Cormorant Garamond +
  Jost** (expo-font), exact marble/ink/gold palette in `src/constants/temple.ts`.
- **Nav:** Coach · Today tabs + Settings (modal). Coach is home.
- **Coach home** (`src/app/(app)/index.tsx`): profile-derived first message (names real goal +
  injuries), session card reads the **real** session (live done/total), quick-reply chips, composer
  disabled until the LLM lands.
- **Seed-on-signup** (`src/lib/seed.ts`): the real data.js Push·Incline session (5 exercises w/
  cue/last/alt) + coach thread. Idempotent; runs on onboarding + on app entry.
- **Core loop (M3) — built & largely verified:**
  - Today renders the real session (cards: target, last, cue, done, Swap→alt+why, ring).
  - Log sheet (`log-sheet.tsx`): steppers, RIR, set dots, history; each set writes set_logs;
    final target set marks the lift done. **Verified on device** (logged to done; survived restart).
  - Summary (`summary-sheet.tsx`): recap + reflection + Save (status='done', appends reflection to
    the coach thread). Built; Finish→Save not yet tapped through end-to-end.
  - Shared `BottomSheet` (static backdrop, only the panel slides).

## Decisions made
- **Monetization: hosted subscription (~$9.99/mo), NOT BYOK.** Prompt-caching + model-routing
  server-side; fair-use cap ~300 turns/mo. Typical-user LLM COGS ~$0.50/mo → ~90%+ margin. The
  Edge Function stays the only key-holder. (Full unit-economics memo was produced this session.)

## Done this session (2026-06-27)
- **Onboarding ported to the Temple design** (`src/components/onboarding.tsx`): marble field + light
  shaft, Cormorant/Jost, per-step accents (goals sky · experience lavender · equipment sage · protect
  gold), SF-Symbol icons, breathing spark on welcome, gold/sky glow primary button, glass note +
  reassurance cards. Logic unchanged (still 4 steps; prototype's Apple-Health step 5 still deferred).
- **Coach Edge Function built** (`supabase/functions/coach/`): `index.ts` (JWT/RLS-scoped handler +
  Anthropic call + persist), `memory.ts` (§7 assembly), `prompt.ts` (Temple voice + §7.1 + Haiku/
  Sonnet routing + prompt-cache on the static system block), `guard.ts` (medical-deferral backstop).
  Client: `src/lib/coach.ts` + Coach screen wired (live thread, working composer, optimistic send,
  "considering…" breath, inline `[[SESSION_CARD]]`, running vs first-run quick replies).
- **ANTHROPIC_API_KEY** is in `supabase/.env` (gitignored), validated live (Haiku 200 OK).
- **§7.1 safety gate ran (prompt-level), all passed** — see `supabase/functions/coach/README.md`.

## Local build state — THIS Mac (`~/Documents/GitHub/TempleAI`) — ✅ RUNNING
The iOS simulator build is **up and the Coach chat is live end-to-end** (2026-06-27). **Fresh clone
from today** — needed `node_modules` + root `.env`. What got it running:
- **`npm install`** done (876 pkgs). **`npx expo run:ios --device "iPhone 16 Pro"`** built clean
  (0 errors) → app installed + launched on the **iPhone 16 Pro** sim; Metro serving on :8081.
  Relaunch the app any time with `xcrun simctl launch booted com.seanbukich.temple` (no Xcode needed).
- **Coach Edge Function DEPLOYED & VERIFIED:** `supabase login` (browser) → `link` → `secrets set`
  (Anthropic key, count 1) → `functions deploy coach`. No-auth POST → clean `401`; in-app chat
  returns real, memory-aware replies (it cited the user's actual incline history). §7 chain confirmed:
  handler → Anthropic → memory assembly → persistence.
- **Apple Sign-In fails in the sim** (`AuthorizationError 1000`) — simulator isn't signed into iCloud;
  not a code bug. App carried a persisted session, so it lands on Coach home (onboarding not re-seen).
  To eyeball the restyled onboarding: sign the sim into iCloud, then sign out in-app.

Original first-run notes:
- **Root `.env` created** (gitignored) with the public Supabase URL + publishable key from
  `HANDOFF-MAC.md` (ref `eekawfoehyweyfgqiroa`).
- **Node was 18.14.0 (too old for Expo 56).** Installed **Node 20.20.2 via `n`** into a user dir to
  avoid sudo: it lives at `~/.n`. **Activate it each shell with:** `export PATH="$HOME/.n/bin:$PATH"`
  (the default `/usr/local/bin/node` is still 18 — `/usr/local` is root-owned, hence the N_PREFIX
  trick: `export N_PREFIX="$HOME/.n"; n 20`).
- Env present: **Xcode 26.2**, **CocoaPods 1.14.2**. **No watchman** (Expo will warn, not fatal).

### Resume the build from here (in order)
```bash
cd ~/Documents/GitHub/TempleAI
export PATH="$HOME/.n/bin:$PATH"      # ← Node 20; REQUIRED every shell
node -v                               # expect v20.20.2
npm install                           # not yet run — fresh clone, ~few min
npx expo run:ios --device "iPhone 16 Pro"   # prebuild + pod install + xcodebuild; first run slow
```
Once it launches: new user → Apple/Google sign-in → **the restyled onboarding** (the main thing to
eyeball) → Today/log loop. **Coach chat will error on send until the Edge Function is deployed** (below).

## NEXT (in priority order)
1. ✅ **DONE — simulator build runs** + Coach screen eyeballed (looks great).
2. ✅ **DONE — coach deployed**, chat verified end-to-end in the app.
3. ✅ **DONE (code) — Swap/Hurt/Skip Adjust sheet** + CoachNotice on Today (2026-06-29).
4. ✅ **DONE — device check passed** (2026-06-29): Finish→Save + Adjust→Swap/hurt/Skip tapped through on
   the sim; DB writes confirmed via service key. This session's work committed/pushed.
5. Eyeball the restyled **onboarding** (needs sim signed into iCloud, then sign out in-app).
6. ✅ **DONE — Body tab** (2026-06-29): anatomical react-native-svg figure (tappable regions),
   readiness card, check-in panel (sore vs hurt → level/severity), Recovering/Tracked lists.
   `src/app/(app)/body.tsx` + `src/lib/body.ts` (issues CRUD: kind disambiguates injury/soreness,
   severity doubles as sore level, soft-clear keeps healed history). Onboarding injuries now have a
   viewer/editor. Required `react-native-svg` (15.15.4) + a native rebuild. Verified on sim + DB.
   Apple-Health readiness metrics still deferred (no ConnectHealth card wired yet).
7. **Bigger prototype gaps still missing**: **Progress** tab (e1RM charts), **Circle** (social feed
   + invite), **Form Focus Pro** (form check + movement demos), onboarding's **Apple-Health step**.
   Coach voice/camera + manual add-exercise also deferred.
7. Parked: reflection must not reward quitting an unfinished session (Sean's note) — handle in §7 prompt.
8. Then M6 Settings polish → internal TestFlight.
