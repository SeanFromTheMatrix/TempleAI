# Temple — resume point (2026-06-26, late)

Everything below is committed + pushed to origin/main. Build runs on the iOS simulator.

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

## NEXT (in priority order)
1. **Coach chat (step 5) — the big one. BLOCKED on the Anthropic API key.** Build the Supabase Edge
   Function `coach/` (assemble memory §7 → Claude → safety guard §7.1 → persist to messages), then
   the live thread UI + enable the composer. Use prompt caching + Haiku/Sonnet routing per the memo.
2. **Onboarding screens** still use the old black/white theme — port to Temple fonts/colors (unblocked).
3. **Tap through Finish → Save** to confirm §6.3 (or grant Terminal Accessibility so the agent can
   drive simulator taps itself).
4. Parked (out of current scope): reflection must not reward quitting an unfinished session
   (Sean's note) — handle in the §7 coach prompt; see memory.
5. Then M6 Settings polish → internal TestFlight.

## Run it
```bash
cd ~/Documents/Personal/temple
npx expo run:ios --device "iPhone 16 Pro"   # Debug + Metro; Xcode must be 26.2
```
