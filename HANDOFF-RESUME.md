# Temple — resume point (2026-06-27)

⚠️ **This session's work is NOT committed or pushed.** It's all in the working tree (Sean chose
"don't commit yet" — wants to build/test on the simulator first). Uncommitted: modified
`HANDOFF-RESUME.md`, `src/app/(app)/index.tsx`, `src/components/onboarding.tsx`; new (untracked)
`src/lib/coach.ts`, `supabase/functions/`. The `.env` files are gitignored (not in git). On branch
`main`, even with origin. The "Done & working" section below was committed in prior sessions.

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
3. **Tap through Finish → Save** to confirm §6.3. ← next up
4. Eyeball the restyled **onboarding** (needs sim signed into iCloud, then sign out in-app).
5. Optional: add the prototype's **Apple-Health step 5** to onboarding (visual; HealthKit deferred).
6. Parked: reflection must not reward quitting an unfinished session (Sean's note) — handle in §7 prompt.
7. Then **commit/push** (Sean to choose branch vs main) → M6 Settings polish → internal TestFlight.
