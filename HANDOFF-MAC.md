# Temple — handoff to the Mac agent (2026-06-25)

You are picking up an in-progress iOS/Android strength-coaching app
(React Native + Expo SDK 56, Supabase). Work happened last night on a **Windows
PC** (code only — no iOS build possible there). Your job is on the **Mac**:
pull, finish the dashboard config, build, and test sign-in end-to-end.

**FIRST: read `AGENTS.md` in the repo root.** Hard rule: read the exact versioned
Expo docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

## Project facts
- Repo (this Mac): `~/Documents/Personal/temple` — origin is
  github.com/SeanFromTheMatrix/TempleAI (branch `main`).
- Expo SDK 56, RN 0.85, React 19.2, Expo Router, routes in `src/app/`.
- Supabase project ref: `eekawfoehyweyfgqiroa`
- Supabase URL: `https://eekawfoehyweyfgqiroa.supabase.co`
- Publishable (client) key: `sb_publishable_oY2nh2I8XR4lmHsMUHtxFg_LkG0K0oI`
- Secret key: in `supabase/.env` on this Mac (gitignored).
- iOS bundle id: `com.seanbukich.temple`
- Git identity: Sean / seanbukich@gmail.com, **GPG signing OFF**.

## Decision change made last night (don't relitigate)
- Auth is **no longer Apple-only**. The app ships to **iOS *and* Android**, so it
  now supports **Apple (iOS) + Google (both platforms)**. Apple stays because
  App Store guideline 4.8 requires offering Apple sign-in alongside Google on iOS.

---

## What last night's commit (`c845fe5`) did — CODE ONLY, UNVERIFIED
Could not compile on Windows (no node_modules), so this is written + doc-checked
but **not yet proven to build**. Your first build is the real test.

- `src/app/_layout.tsx` — root now renders a navigator via **`Stack.Protected`**
  (Expo Router v56 docs pattern; a bare conditional over NativeTabs was avoided
  on purpose). `AuthProvider` wraps everything; native splash is held via
  `SplashScreen.preventAutoHideAsync()` until the persisted-session check
  resolves, then `SplashScreen.hide()`.
- Authed tabs moved into a route group: `src/app/(app)/_layout.tsx` (renders
  `AppTabs`), `(app)/index.tsx`, `(app)/explore.tsx`.
- `src/app/sign-in.tsx` — sign-in route (renders `src/components/sign-in.tsx`).
- `src/components/sign-in.tsx` — **Apple** button (iOS-only, gated on
  `AppleAuthentication.isAvailableAsync()`) + **Google** button (web OAuth, PKCE).
- `src/lib/supabase.ts` — client switched to `flowType: 'pkce'` (Google returns
  `?code=`, exchanged via `exchangeCodeForSession`). Uses already-installed
  `expo-web-browser` + `expo-linking` — no new deps.

---

## DO THIS, IN ORDER

### 0. Sync
```bash
cd ~/Documents/Personal/temple
git pull            # should fast-forward to c845fe5; resolve if the Mac had local edits
npm install         # no new deps were added, but run it to be safe
```

### 1. Finish the dashboard config (cannot be done from code)

**Apple (confirm these are done — Sean may have already):**
- Apple Developer portal: App ID `com.seanbukich.temple` registered + "Sign In
  with Apple" enabled.
- Supabase → Authentication → Providers → **Apple** ON, authorized client ID
  `com.seanbukich.temple` (native flow needs only the client ID, no secret).

**Google (NEW — required for the Google button to work):**
- **Google Cloud Console** → create an OAuth **Web application** client +
  configure the OAuth consent screen. The one Authorized redirect URI it needs is
  Supabase's callback:
  `https://eekawfoehyweyfgqiroa.supabase.co/auth/v1/callback`
  (The app's own deep link is handled by Supabase, not Google.)
- **Supabase → Authentication → Providers → Google** ON; paste the Google
  **client ID + client secret**.
- **Supabase → Authentication → URL Configuration → Redirect URLs**: add the
  app's deep link so Supabase will redirect back into the app. The code uses
  `Linking.createURL('/')`. **On first run, `console.log` that value** and add
  exactly it; adding `temple://*` as a wildcard is the robust catch-all.

### 2. Build a dev build (Expo Go can't do native Apple auth)
```bash
npx expo run:ios          # first compile takes several minutes
# Android also works now (Google-only on Android): npx expo run:android
```

### 3. Test end-to-end
- Simulator must be signed into an Apple ID (Settings → Sign in) for the Apple path.
- **Apple (iOS):** tap Apple → real Supabase session created + an auto-created row
  appears in `profiles` (a signup trigger creates it).
- **Google (iOS + Android):** tap Continue with Google → browser flow → lands back
  in the app authenticated, `profiles` row created.
- **Persistence:** force-quit & relaunch → should skip sign-in (session persists
  via AsyncStorage). This is a Milestone 1 acceptance criterion.
- If the Google redirect doesn't return to the app, the redirect URL isn't
  allow-listed in Supabase (see step 1) or the scheme is wrong — check the logged
  `redirectTo` value.

### 4. Report back to Sean
Confirm: builds clean? Apple works? Google works (iOS + Android)? `profiles` rows
created? Session survives restart? Note anything that needed fixing.

---

## After M1 is verified — remaining milestones (in order)
- **M2 Onboarding** — 4 Qs (goal, level, equipment, injuries) → write `profiles`
  + `issues` rows; survives restart.
- **M3 Core loop** — seeded session → log `set_logs` → last target set marks the
  lift done → summary + coach reflection → Save to history; survives backgrounding.
- **M4 Coach** — Supabase Edge Function `coach` (assemble memory per spec §4 →
  Anthropic Claude → safety guard per spec §5 → persist). **Never call the model
  from device.** Needs `ANTHROPIC_API_KEY` in server-side `supabase/.env`. Use the
  latest Claude model. (Ask Sean to paste spec §4/§5 when you reach this.)
- **M5 Safety** — guardrails in system prompt + 15–20 adversarial prompts, show
  transcript.
- **M6 Settings + sign out**, then distribution: **internal TestFlight (iOS)** AND
  **Google Play internal testing (Android)** — cross-platform now. Needs Sean's
  Apple Team ID (and a Play Console for Android).

## Standing constraints
- RLS on every table from day one (already applied; migration
  `supabase/migrations/0001_init.sql`).
- DB note: `messages.sender` is 'coach'|'lifter'; `issues.kind` is
  'injury'|'soreness'. Child tables owned via parent; `movements` is a shared
  read-only catalog.
- Backend-first; build UI from the spec and show Sean for approval before polishing.
