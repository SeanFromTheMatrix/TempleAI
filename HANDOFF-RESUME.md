# Temple — resume point (2026-06-26)

**Milestone 2 (onboarding) is COMPLETE and VERIFIED end-to-end on the iOS simulator.**

## What's done
- Migration `0002` (goal→text[], add health_connected) **applied to the live DB** via the
  Supabase Management API. Confirmed: `profiles.goal` is `text[]`, `health_connected` is `boolean`.
- Full 4-screen onboarding flow (spec §3): welcome → goals → experience+equipment → protect.
  Progress dots, back chevron, disabled-until-valid Continue, bodyweight-exclusive equipment rule,
  live note placeholder/reassurance. Screen 4 (Apple Health) deferred per spec.
  - `src/components/onboarding.tsx`, route `src/app/onboarding.tsx`
  - `src/lib/profile.tsx` (`useProfile`, `onboarded` from non-empty goal, survives restart)
  - `src/lib/onboarding.ts` (option lists, `coachingModeForLevel`, `completeOnboarding`)
  - `src/app/_layout.tsx` (third routing gate: signed-in & !onboarded → onboarding)
- **Verified:** completed onboarding on sim → wrote `profiles` (goal `["strength","lean","mobility"]`,
  level `inter`, coaching_mode `refine`, equipment[4], health_connected false) + 3 `issues` rows
  (lowback/shoulder/chest, severity moderate, note, since). Force-quit + cold relaunch → routes
  straight to home (onboarded). RLS-scoped writes succeed under the authenticated user.

## Open / minor follow-ups
- The authed home is still the **Expo template** ("Welcome to Expo") — real home screens are a
  later milestone, not M2.
- Sim logs show repeated `[CoreGraphics] ... invalid numeric value (NaN)` warnings during render
  (value ignored, non-fatal). Worth tracking down later — check onboarding/template styles.
- Per-screen accent hexes (clay/lavender/sage/gold) in `ACCENT` (`src/components/onboarding.tsx`)
  are an interpretation of the spec's named accents — tune if Sean wants different colors.
- Migrations are applied via the Supabase Management API with an access token (no CLI/cred stored
  on the Mac). Token is NOT saved anywhere; provide a fresh `sbp_…` when the next migration is needed.

## Re-run the app
```bash
cd ~/Documents/Personal/temple
# Xcode must be 26.2: xcodebuild -version
npx expo run:ios --device "iPhone 16 Pro"   # Debug + Metro; simulator shares the Mac network
```

## NEXT — Milestone 3 (core loop)
Seeded session → log `set_logs` → last target set marks the lift done → summary + coach reflection
→ Save to history; survives backgrounding/restart. (Then M4 coach Edge Function — needs
ANTHROPIC_API_KEY in supabase/.env, not yet available.)
