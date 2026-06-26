# Temple — MVP TestFlight Kickoff (Sprint Zero)

> Hand this whole file to Claude Code as the opening prompt. It is self-contained.
> Goal: an **internal TestFlight build** of the Temple MVP in ~2 working days that real
> lifters can use as the baseline test point — not a clickable prototype, a real app
> with real persistence and a real coach.

---

## 0. Your job

You are building the **first real, installable build of Temple** — an iOS app, distributed
via internal TestFlight, that a handful of lifters will actually train with. This is the
baseline we test against, so it must persist real data and have a working AI coach. It does
**not** need to be feature-complete or pretty-everywhere. Build to the cut in §3 exactly —
do not add features beyond it, and flag anything you think is missing rather than building it.

Work in vertical slices that are runnable at every step. After each milestone in §8, stop,
tell me what's working, and how to see it on a simulator/device.

---

## 1. What Temple is

A strength coach in your pocket that **remembers you**. It programs the day, trains around
your body's injuries and readiness, and holds the line when you'd overreach. The tone is
calm and judgment-led — **not gamified, no streaks, no confetti**. The persona we build for:
an intermediate lifter, ~35, training seriously around real injuries, who wants a coach's
judgment without a coach's price.

The entire product is one loop:

**Coach authors today → lifter trains & logs → coach reflects on it → it shapes tomorrow.**

"One coach, one memory." Everything in this build exists to make that single loop real and
trustworthy. Nothing else.

There is an existing **React prototype of this UI in the `app/` folder of this repo**
(`coach.jsx`, `body.jsx`, `log.jsx`, `progress.jsx`, `onboarding.jsx`, `shell.jsx`,
`data.js`, etc.). **Read it first.** It is the source of truth for screen layout, component
structure, copy/tone, and the seed data shapes. You are porting its experience to a real
React Native app — not redesigning it.

---

## 2. The stack (decided — don't relitigate)

- **Client:** React Native + Expo (Expo Router). The prototype's component model ports over.
- **Backend:** Supabase — Postgres + Auth + Storage + Edge Functions.
- **Coach:** an **Edge Function** that calls a hosted LLM (Anthropic Claude — use the API
  key in env). **Never call the model from the device.** The function owns the prompt,
  the assembled memory, the cost ceiling, and the safety guardrails.
- **Auth (this build):** **Sign in with Apple only.** Skip email OTP for now.
- **Data privacy:** Row-Level Security on from day one. A user can only ever read/write
  their own rows. This is a product promise, enforce it at the database.

Deferred to later builds, do **not** add now: HealthKit, payments/RevenueCat, Android.

---

## 3. The cut — exactly what's in THIS build

**In:**
1. Sign in with Apple → real session.
2. Onboarding: 4 questions — goal, experience level, equipment, **what to protect (injuries)**.
   Writes a real `profile` row and `issues` rows. The injuries must visibly reach the coach.
3. **The core loop, persisted:** a seeded "today" session → log sets (fast entry) → logging
   the last target set marks the lift done → at 100% a summary screen with a coach reflection
   → **Save** writes it to history. Logged work must survive backgrounding and app restart.
4. **The coach chat** — real, text-only, wired to the LLM via the edge function, with memory
   (§4) and safety guardrails (§5).
5. Bare Settings: show profile, edit onboarding answers, **sign out**.

**Out of this build (flag if you think one is truly needed, otherwise skip):**
HealthKit / readiness, Progress charts, Body as its own surface, dynamic load programming,
exercise variants, Circle/social, Pro/payments, email auth, Android.

---

## 4. The coach — how it works in THIS build

Ship the **seeded-session coach**: it conversationally guides a **pre-authored** session and
reflects on logged work. It does **not** yet compute loads from a rules engine — that's the
next build (§9). Be honest about this in the system prompt: it coaches around a given plan.

Every coach call, the edge function assembles a compact **memory context** and injects it:
- `profile` (name, goal, level, equipment)
- active `issues` (e.g. "protect lower back & sternum")
- the **last N sessions** (titles, dates, how they went)
- **today's plan** (the seeded session)
- the **recent message thread**

The "it remembers me" magic is disciplined context assembly, not a bigger model. The coach
should naturally reference the lifter's injuries and last session in its first message.

---

## 5. Safety — non-negotiable, even in 2 days

The coach talks to people about their bodies. Even in a fast baseline build it must be safe.
Bake this into the system prompt and verify it before anyone installs:

- **Never program through pain.** If the lifter reports pain, it backs off / suggests
  regression or rest — it does not push load.
- **Defer red-flag symptoms** (chest pain, numbness, dizziness, sharp joint pain, etc.) to a
  medical professional. It is a training coach, not a doctor — stay in scope.
- **Hold the line on ego lifts.** Refuse to cheerlead an unsafe max attempt.
- Conservative by default when unsure.

Before handing me the build: run **15–20 adversarial prompts** through the coach (pain
reports, red-flag symptoms, "let me max out today," out-of-scope medical questions) and show
me the responses. This is the lightweight stand-in for the full eval harness, which comes in
the next build. **Distribution is internal TestFlight only** — testers must understand this
is pre-alpha and not medical advice.

---

## 6. Data model (port from `app/data.js`)

Read `data.js` for exact field shapes; these become Postgres tables, all with RLS keyed to
`user_id`:

- `profiles` — id · name · goal · target · level · coaching_mode · equipment[] · units
- `issues` — id · user_id · region · label · severity · note · since  *(soreness = same shape)*
- `sessions` — id · user_id · date · title · note · status · duration
- `session_exercises` — id · session_id · movement · target_sets · target_reps · target_weight · cue · done · alt
- `set_logs` — id · session_exercise_id · weight · reps · logged_at   ← **the row everything builds on**
- `movements` — id · name · region · unit   *(single movement per lift; no variants yet)*
- `coach_threads` — id · user_id · label
- `messages` — id · thread_id · from · text · card · created_at   ← **the memory lives here**

Progress is **derived** (computed from `set_logs`), not a table. Do not create
circle_*/subscriptions tables in this build.

---

## 7. Repo shape to aim for

```
temple/
  app/              # Expo Router screens — map 1:1 to the prototype
  components/       # Coach, Today, Log, Onboarding, Summary, Settings…
  supabase/
    migrations/     # the §6 tables + RLS policies
    functions/
      coach/        # assemble memory → prompt → LLM → safety guard → persist
      session/      # log / complete / save
  coach/
    prompt.ts       # system prompt incl. §5 safety
    memory.ts       # §4 context assembly
    guard.ts        # response safety pass
  .env              # SUPABASE_URL · SUPABASE_SERVICE_KEY · ANTHROPIC_API_KEY  (server only)
```

---

## 8. Build sequence — vertical slices, runnable at each stop

Do these in order. After each, stop and report what runs.

1. **Scaffold** — Expo app + Supabase project + Sign in with Apple working end to end.
   RLS enabled. I can sign in and land on an empty home.
2. **Onboarding → persisted** — 4 questions write `profile` + `issues`. Re-open app: my
   answers are still there.
3. **The core loop** — a seeded session renders in Today; I can log sets; the last set marks
   the lift done; finishing shows a summary; Save writes to history. Kill and relaunch
   mid-session: my logged sets survive.
4. **The coach** — chat screen wired to the `coach` edge function with memory (§4). Its first
   message references my goal and my injuries.
5. **Safety pass** — guardrails in the prompt + the 15–20 adversarial-prompt check (§5).
   Show me the transcript.
6. **Settings + sign out**, then **internal TestFlight**: build, upload, get it on my device.

---

## 9. Explicitly NOT now (the next build, after baseline test)

Don't build these, but leave clean seams for them: the `/program` **load-computing rules
engine** (this is the very next thing), the full **coach eval harness in CI**, HealthKit
readiness, Progress charts, Body surface, then Circle and Pro per the roadmap.

---

## 10. Logistics to surface to me on day one

- Confirm there's an **Apple Developer account** ($99/yr) — internal TestFlight needs it, and
  it's the thing most likely to silently block day one. (Internal testers need **no** Apple
  review; external testers do — we're internal-only for this baseline.)
- Confirm Supabase project + Anthropic API key are available, or tell me what you need from me.
- Flag any decision where the fast path and the right path diverge, and let me choose.

Start by reading `app/` and `data.js`, then give me your build plan for milestone 1 before
you write code.
```
