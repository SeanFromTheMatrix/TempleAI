# Temple — Master Build Spec (MVP)

The single source of truth for building the Temple MVP to an internal TestFlight build.
Hand this to the coding agent together with two companion files already in the repo:

- **`Temple Code Kickoff.md`** — the kickoff prompt, build sequence, repo shape, logistics.
- **`Temple Onboarding Spec.md`** — the verbatim onboarding flow (§ Onboarding below points to it).

The React prototype in **`app/`** is the visual + behavioral source of truth. **Read it first**
(`shell.jsx`, `coach.jsx`, `log.jsx`, `onboarding.jsx`, `body.jsx`, `progress.jsx`, `data.js`).
You are porting its experience to React Native — not redesigning it. When this spec and the
prototype disagree, the prototype wins on look/copy; this spec wins on scope (what's in v1).

---

## 1. Product

A strength coach in your pocket that **remembers you**. It programs the day, trains around the
lifter's injuries and readiness, and holds the line when they'd overreach. Tone is **calm,
honest, judgment-led — never gamified.** No streaks, no confetti, no badges.

The whole product is **one loop**, and the MVP is nothing but this loop made real and safe:

> **Coach authors today → lifter trains & logs → coach reflects → it shapes tomorrow.**
> *One coach, one memory.*

Persona we build for (the seed lifter in `data.js`): **Marcus**, 35, intermediate, ~180lb on a
push/pull/legs split, building toward "200 lb lean," training around a chronic right hip, a
healing lower-back strain, and a mild left-sternum (costochondral) issue.

---

## 2. Scope — the cut

### In the MVP
1. **Auth** — Sign in with Apple only.
2. **Onboarding** — the 4-question calibration (→ `Temple Onboarding Spec.md`), persisted.
3. **Coach** — real, text-only, LLM-backed chat with assembled memory + safety guardrails.
4. **Today + the log→done→save loop** — the core circle, fully persisted.
5. **Settings** — profile, edit onboarding answers, sign out.

### Deferred — do NOT build now (leave clean seams)
HealthKit / readiness · Progress charts as a full surface · Body as its own tab · dynamic
**load-computing** programming engine · exercise variants · **Circle / social** (entire tab) ·
**Temple Pro** / form-check / payments · email-OTP auth · voice mode · Android.

> The boldest, most important cut: **the entire Circle social tab is out.** The prototype's
> 4th tab (`Circle`) is not built in v1. The tab bar ships with **Coach · Today** (+ a minimal
> Settings entry) — not the prototype's four tabs.

### The coach in THIS build: "seeded-session" not "computed"
Ship a coach that **conversationally guides a pre-authored session** and reflects on logged
work. It does **not** yet compute loads from a rules engine — that's the very next build. Be
honest about this in the system prompt: it coaches around a given plan. The seed session in
`data.js` (`Push · Incline Focus`, 5 movements) is the lifter's first authored day.

---

## 3. Stack (decided)

| Layer | Choice | Notes |
|-------|--------|-------|
| Client | **React Native + Expo** (Expo Router) | Ports the prototype's component model. |
| Backend | **Supabase** — Postgres · Auth · Storage · Edge Functions | RLS on from day one. |
| Coach | **Edge Function → hosted LLM (Anthropic Claude)** | **Never call the model from the device.** Function owns prompt, memory, cost cap, safety. |
| Auth | **Sign in with Apple** | Only path this build. |
| Distribution | **Internal TestFlight** | No Apple review needed; needs an Apple Developer account. |

Deferred infra: HealthKit, RevenueCat/StoreKit, Android. Don't wire them.

---

## 4. Data model

Port the shapes from `data.js`. Every table has a `user_id` and **Row-Level Security** so a
user can only read/write their own rows. Enable RLS in the first migration, not later.

```
profiles          id · user_id · name · goal[] · target · level · coaching_mode
                  · equipment[] · units(default 'lb') · health_connected(false) · created_at

issues            id · user_id · region · label · severity('mild'|'moderate'|'significant')
                  · note · since · active           -- the "what to protect" rows

movements         id · name · region · unit('lb'|'reps')   -- exercise library; single
                                                            -- movement per lift, no variants

sessions          id · user_id · date · title · note · status('authored'|'active'|'done')
                  · duration_min

session_exercises id · session_id · movement · order · target_sets · target_reps
                  · target_weight · cue · last(prior top set, text) · done · alt(jsonb)

set_logs          id · session_exercise_id · set_index · weight · reps · rir · logged_at
                  --  ★ the row everything else is built on

coach_threads     id · user_id · label
messages          id · thread_id · from('coach'|'user') · text · card(nullable, e.g.'session')
                  · context(nullable) · created_at
                  --  ★ the memory lives here. "One coach, one memory" = ONE thread per user.
```

**Derived, not stored:** Progress (e1RM series) is computed from `set_logs` when needed — no
table. **Not in this build:** any `circle_*` or `subscriptions` tables.

**Seeds on signup:** after onboarding completes, seed the user with (a) the `movements`
library from `data.js`, (b) one authored `session` = the `Push · Incline Focus` day with its 5
`session_exercises` (each carrying its `cue`, `last`, and `alt`), and (c) one `coach_thread`.

---

## 5. Screens

Build these four screens + onboarding. Match the prototype's layout, copy, and the calm
aesthetic (§8). Phone-only, portrait.

### 5.1 Onboarding
Full spec in **`Temple Onboarding Spec.md`** — 4 questions (goals, level+equipment, injuries),
verbatim copy and option lists. Writes `profiles` + `issues`. The Apple-Health screen in the
prototype is **deferred** — skip it or stub as "Maybe later" only (no HealthKit).

### 5.2 Coach  *(the hero — `coach.jsx`)*
- A single scrolling thread: coach messages (left, with the breathing "spark" mark) and user
  messages (right bubble). A composer at the bottom: text input + send. **No voice button, no
  form-check camera button** in this build (both deferred — omit them from the composer).
- **Quick-reply chips** above the composer. First-run set: `Build me a push day` ·
  `I'm easing back in` · `I've got 45 minutes` · `Full gym today`. Running set (from `data.js
  quickReplies`): `How's my back looking?` · `Swap an exercise` · `I'm short on time today` ·
  `Make it harder`.
- **First message** must be generated from the user's real profile — it references their goal
  and any flagged injury (e.g. names the sternum). This is the cheapest magic; get it right.
- **Session card:** when the coach references today's session, it can render an inline
  **session preview card** (progress ring `done/total`, title, `N movements · ~X min`) that
  taps through to Today. Mirror `SessionPreviewCard`.
- **Thinking state:** show the "considering…" breathing dots while awaiting the LLM.
- Sending a message → optimistic append → call the `coach` edge function → append reply →
  persist both to `messages`. The thread is the same one forever (one coach, one memory).

### 5.3 Today  *(`body.jsx`/Today in the prototype)*
- Header: session title (`Push · Incline Focus`) + the coach's note
  (`Built around your sternum — no deep pec stretch today. Strength over heroics.`) +
  `N movements · ~X min` and an overall progress ring.
- A list of **exercise cards**, each: name, target `sets × reps @ weight`, the `last` top set,
  the coach `cue`, a **done** state, and a **Swap** affordance that reveals the pre-authored
  `alt` (alternate movement + its `why` rationale). Logging is opened from the card → Log sheet.
- **Finish:** when all exercises are done (or the user taps Finish) → the **Session Summary**
  sheet (§5.5).
- Promote nothing else here — Body-as-its-own-surface and readiness are deferred.

### 5.4 Log a set  *(bottom sheet — `log.jsx`)*
- Opened per exercise. Shows target `sets × reps @ weight` and a row of **set dots** (filled as
  sets are logged).
- Two big **steppers**: Weight (±5, shows `+lb` for weighted-bodyweight lifts like dips) and
  Reps (±1, min 1). A **RIR** selector `0–4+` (0 = "To failure", 4+ = "Plenty left").
- **Log button**: `Log set N · M to go`; flashes `Logged`; when the last set is logged it marks
  the exercise **done** and reads `Done · back to session`.
- **Logged history** list below, newest first: `weight × reps · RIR`.
- Each logged set writes a `set_logs` row immediately. **Logging the final target set sets
  `session_exercises.done = true`.** (This is the single most important behavior — see §6.)

### 5.5 Session Summary  *(sheet — on finish)*
- A recap of the session: movements completed, sets logged. A **coach reflection** (generated
  — honest, not a trophy; references how the work went and ties to the goal). A **Save** action.
- Save → writes `sessions.status = 'done'` (+ duration), ensures all `set_logs` persisted, and
  appends the reflection to the coach thread so tomorrow's context can read it. Toast:
  `Session saved to history`. (No "share to circle" — social is deferred.)

### 5.6 Settings  *(new — minimal; the prototype lacks it, Audit 08)*
- Show profile (name, goal, level, equipment). **Edit onboarding answers** (reuse onboarding
  screens to update `profiles`/`issues`). **Sign out.** One notification toggle (the training
  nudge) is optional. Nothing more.

### Navigation
Tab bar = **Coach · Today**, with Settings reachable from a header affordance. Coach is the
home tab. (The prototype's `Progress` and `Circle` tabs are **not** in v1.)

---

## 6. The non-negotiable behaviors (acceptance-critical)

These come straight from the UX audit. The build is not done until all pass:

1. **Logging marks work done.** Logging the last target set of an exercise sets it done — there
   is no second, separate "mark done" mechanism to forget. *(Audit 01/02)*
2. **Logged work survives.** Force-quit mid-session and relaunch → every logged set and every
   done-state is still there. Losing logged work is the one unforgivable bug. *(Audit 04)*
3. **Finish closes the loop.** Reaching 100% (or tapping Finish) produces a summary with a coach
   reflection and a Save that writes to history. *(Audit 03)*
4. **Onboarding reaches the app.** Flagged injuries seed `issues` and the coach's first message
   references them; the goal colors that message. *(Audit 05)*
5. **One coach, one memory.** All coach messages live in a single thread; context from Today
   (a completed session) is readable by the next coach turn. *(the core promise)*

---

## 7. The coach service (the defensible core)

A Supabase **Edge Function** (`functions/coach/`). The model **speaks**; deterministic code
**decides**. Keep that line bright.

**Per-turn memory assembly** (`memory.ts`) — inject a compact context every call:
- `profile` (name, goal, level → coaching_mode, equipment, units)
- active `issues` (the hip, back, sternum — with notes)
- the **last N sessions** (titles, dates, status, how they went)
- **today's plan** (the seeded session + done-state)
- the **recent message thread** (last ~20 messages)

**Prompt** (`prompt.ts`) — the calm Temple voice + the safety policy in §7.1. Tell the model it
coaches **around a given plan** (seeded-session mode); it does not invent loads/numbers.

**Response guard** (`guard.ts`) — a safety pass over the model's reply before it's persisted
(§7.1). Then write the user + coach messages to `messages`.

**Cost/secrets:** the LLM key lives server-side only (`.env`), never in the app. Cap tokens.

### 7.1 Safety — non-negotiable even in 2 days
Bake into the system prompt **and** verify before anyone installs:
- **Never program through pain.** On a pain report → back off / regress / rest; never add load.
- **Defer red-flag symptoms** (chest pain, numbness, dizziness, sharp joint pain) to a medical
  professional. The coach is a training coach, not a doctor — stay in scope.
- **Hold the line on ego lifts.** Refuse to cheerlead an unsafe max attempt (mirror the `ego`
  example thread in `data.js`).
- Conservative by default when unsure.

**Pre-install gate:** run **15–20 adversarial prompts** (pain reports, red-flag symptoms,
"let me max today," out-of-scope medical questions) and review every response. This is the
lightweight stand-in for the full **eval harness**, which is the next build and **gates every
prompt change in CI** thereafter. Distribution stays **internal testers only** who understand
this is pre-alpha, not medical advice.

---

## 8. Design system (port the tokens from the prototype)

Lift these from the prototype's CSS variables so the app matches the calm, marble aesthetic.

- **Type:** display/UI **Jost** (300/400/500); accent/italic **Cormorant Garamond** (serif
  italic) for reflective lines, reassurances, "considering…", section flavor.
- **Palette:** warm paper background (`--paper` ≈ `#f4efe6`), ink `#2c2823` / soft / faint /
  ghost; surfaces are frosted glass (`--surface`, `blur`). Accents are four hues —
  **sky · sage · lavender · gold** (each with `-deep` and `-tint`); the app's primary accent is
  one of them (default gold/warm). Sage = healthy/recovery, gold = caution/protect,
  lavender = experience/advanced.
- **Shape:** generous radii (cards ~18px, sheets ~34px top corners, pills 9999), soft shadows
  (`--shadow-sm/-md`), thin `0.5px` hairline borders (`--line`).
- **Motion:** gentle. `tm-rise` for entrances, `tm-breathe` for the coach mark / orbs / dots.
  Respect reduced-motion. **No gamified motion** (no confetti/streak fireworks).
- **Touch targets** ≥ 44px (the steppers are 56px, log button 62px — keep them generous).

---

## 9. Build sequence (vertical slices — runnable at every stop)

From `Temple Code Kickoff.md`; reproduced as the checklist. Stop and report after each.

1. **Scaffold** — Expo + Supabase + Sign in with Apple end-to-end; RLS on; land on empty home.
2. **Onboarding → persisted** — 4 questions write `profiles` + `issues`; survive relaunch.
3. **Seed on signup** — movements library, the authored session, the coach thread.
4. **Core loop** — Today → Log (set_logs) → last set marks done → Finish → Summary → Save to
   history; **survives force-quit mid-session** (acceptance §6.1–6.3).
5. **Coach** — `coach` edge function + memory + the thread UI; first message references goal +
   injury (§6.4–6.5).
6. **Safety pass** — guardrails in prompt + the 15–20 adversarial-prompt check (§7.1); show me
   the transcript.
7. **Settings + sign out**, then **internal TestFlight**: build, upload, on-device.

---

## 10. Definition of done (MVP)

- A new lifter can: sign in with Apple → calibrate → open the coach (who knows their goal and
  injuries) → open Today → train and log a full session that **persists across a force-quit** →
  finish → get a coach reflection → save to history → see that the next coach turn remembers it.
- All five behaviors in §6 pass. The coach passes the §7.1 safety check.
- It's installed on a real device via internal TestFlight.

Everything else — Progress, Body, the `/program` load engine, Circle, Pro, HealthKit — is the
**next** build, with seams left clean. Flag anything you believe is truly required for the loop
to function that isn't listed here, rather than building beyond the cut.

---

## 11. Day-one logistics to confirm with me
- **Apple Developer account** ($99/yr) exists — internal TestFlight needs it; most likely
  silent day-one blocker. (Internal testers: no Apple review. External: Beta App Review ~1 day —
  we're internal-only.)
- **Supabase project** + **Anthropic API key** available, or tell me what you need.
- Surface any fork where the fast path and the right path diverge, and let me choose.

**Start by reading `app/` and `data.js`, then give me your plan for milestone 1 before writing code.**
