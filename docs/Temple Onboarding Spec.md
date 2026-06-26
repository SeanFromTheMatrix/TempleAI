# Spec §3 — Onboarding flow (verbatim from the Temple prototype)

Source of truth: `app/onboarding.jsx` (flow, copy, validation) and `app/data.js →
TEMPLE_DATA.onboarding` (option lists). Build to this exactly. Copy is intentional — keep
the wording, the apostrophes, the calm tone.

## Flow shape

A **5-screen** flow with a progress-dot indicator and a back chevron (hidden on screen 0).
Screens 1–3 each have a Continue button that is **disabled until valid** (rules below).

> **Build note for this MVP:** build screens **0–3** fully. Screen 4 (Connect Apple Health)
> is **deferred** — HealthKit is out of this build. Either skip it entirely and finish
> onboarding after screen 3, **or** render it as a static "Maybe later"-only screen that
> writes `health_connected = false` and never calls HealthKit. Do **not** wire HealthKit.

---

### Screen 0 — Welcome
- Kicker: `Welcome`
- Display title: `TEMPLE`
- Italic serif subtitle: `A coach for the long path. Calm, honest, and built around you.`
- Primary button: `Begin`
- Caption under button: `Four quiet questions. Under a minute.`

### Screen 1 — Goals  *(multi-select, ≥1 required)*
- Title: `What brings you here?`
- Sub: `Choose all that ring true. We'll shape everything around them.`
- Options (store the `id`s as an array → `profile.goal`; first selected is the primary goal):

| id | label | desc |
|----|-------|------|
| `strength` | Build strength & size | Get stronger, add muscle |
| `lean` | Lose fat, stay strong | Leaner without losing power |
| `mobility` | Move well & mobile | Flexibility, control, longevity |
| `health` | General health | Consistent, balanced training |
| `rebuild` | Rebuild after a break | Ease back in, carefully |

- **Validation:** Continue disabled until at least one goal is selected.

### Screen 2 — Experience + Equipment  *(both required)*
- Title: `Where are you on the path?`
- Sub: `This sets how much the coach leads versus assists.`
- **Experience** — single-select (lavender accent), store `id` → `profile.level`:

| id | label | desc |
|----|-------|------|
| `new` | New | Lead me — I'll follow the plan |
| `return` | Returning | I've trained before; easing back |
| `inter` | Intermediate | I know the lifts; refine and push me |
| `advanced` | Advanced | Assist, don't get in my way |

- The `level` also drives the coach's **coaching_mode** (how much it leads vs. assists) —
  carry it into the profile so the coach prompt can read it.
- **Equipment** — multi-select pills (sage accent), kicker label `What's available to you`.
  Store the selected strings as an array → `profile.equipment[]`:
  `Full gym` · `Barbell & rack` · `Dumbbells` · `Cables & machines` · `Bodyweight only` · `Resistance bands`
  - **Special rule:** `Bodyweight only` is **exclusive** — selecting it clears all other
    equipment; selecting any other clears `Bodyweight only`.
- **Validation:** Continue disabled until a level **and** ≥1 equipment are chosen.

### Screen 3 — Protect (injuries)  *(optional — this is the one that must reach the coach)*
- Title: `Anything to protect?`
- Sub: `Flag what needs care. The coach will train around it — and you can always say more later.`
- **Region pills** — multi-select (gold accent). Each selected `id` becomes an `issues` row
  (`region` = id, `label` = label, `severity` = default `moderate`, `since` = now):

| id | label |
|----|-------|
| `neck` | Neck |
| `shoulder` | Shoulders |
| `chest` | Chest / sternum |
| `elbow` | Elbows |
| `lowback` | Lower back |
| `hip` | Hips |
| `knee` | Knees |
| `ankle` | Ankles |

- **Free-text note** — kicker `In your own words · optional`, a textarea. Store on whatever
  the user typed; attach as the `note` on the issues (or a profile-level note if no region
  chosen). Placeholder copy depends on whether any region is selected:
  - if ≥1 region selected: `e.g. Right hip is tight from desk sitting — sharp on deep squats. Lower back strain healing, about a week in.`
  - if none selected: `Anything a coach should know — old injuries, surgeries, a joint that flares. Skip if there's nothing.`
- **Reassurance line** (italic serif, updates live):
  - if any region or note: `Noted with care. I'll keep these out of harm's way and adapt every session to protect them.`
  - if nothing: `Nothing to flag? Wonderful. We'll begin with a clean slate.`
- **Validation:** none — Continue always enabled (injuries are optional).

### Screen 4 — Connect Apple Health  *(DEFERRED — see build note above)*
Original copy preserved for the later build: title `Train with your recovery`, three benefit
rows (Sleep & HRV / Resting heart rate / Workouts sync both ways), primary `Connect Apple
Health`, secondary `Maybe later`. **Do not build the HealthKit wiring now.**

---

## On completion → write to Supabase

One `profiles` row + zero-or-more `issues` rows for the signed-in user:

- `profiles.goal` ← selected goal id(s) (array; element 0 = primary)
- `profiles.level` ← level id  →  also derive `coaching_mode` from it
- `profiles.equipment[]` ← selected equipment strings
- `profiles.units` ← default `lb`
- `profiles.health_connected` ← `false` (deferred)
- one `issues` row per selected region (+ the free-text note); none if nothing flagged

**Acceptance:** complete onboarding, force-quit, relaunch → the profile and issues are still
there, and the coach's first message references the goal and any flagged injury.
