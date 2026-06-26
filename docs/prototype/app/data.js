// data.js — TEMPLE seed content for the sample lifter.
// 35, intermediate, ~180lb, PPL split, building toward 200lb lean.
// Working around: right hip (chronic), lower-back strain (healing), left sternum (mild).

window.TEMPLE_DATA = {
  user: {
    name: 'Marcus',
    goal: 'Build strength & size',
    target: '200 lb lean',
    level: 'Intermediate',
    streak: 11,
  },

  // ── Today: a Push session, authored by the coach ──
  session: {
    title: 'Push · Incline Focus',
    note: 'Built around your sternum — no deep pec stretch today. Strength over heroics.',
    durationMin: 48,
    exercises: [
      { id: 'e1', name: 'Incline Barbell Press', sets: 4, reps: '5', weight: '155 lb',
        details: [{ k: 'Grip', v: 'Just outside shoulders' }, { k: 'Bar path', v: 'To upper chest' }], last: '150 × 5',
        cue: 'Elbows ~45°. Stop a hair above a full stretch to protect the sternum.', done: true,
        alt: { name: 'Machine Incline Press', sets: 4, reps: '8', weight: '120 lb',
          cue: 'Fixed path — easy on the shoulder and sternum.',
          why: 'Swapped to a machine incline — same chest focus, far less strain while you’re tender.' } },
      { id: 'e2', name: 'Weighted Dip', sets: 3, reps: '8', weight: '+45 lb',
        details: [{ k: 'Torso', v: 'Slight forward lean' }, { k: 'Depth', v: 'Upper arm parallel' }], last: '+40 × 8',
        cue: 'Stay tall, slight lean. End a rep early if anything pinches.', done: true,
        alt: { name: 'Close-Grip Incline Press', sets: 3, reps: '10', weight: '95 lb',
          cue: 'Triceps and lower chest without the deep stretch.',
          why: 'Traded dips for a close-grip incline — protects the sternum, keeps the triceps work.' } },
      { id: 'e3', name: 'Seated DB Shoulder Press', sets: 3, reps: '10', weight: '50 lb',
        details: [{ k: 'Grip', v: 'Palms forward' }, { k: 'Range', v: 'Ears to lockout' }], last: '50 × 9',
        cue: 'Ribs down — don’t arch into the low back.', done: false,
        alt: { name: 'Neutral-Grip DB Press', sets: 3, reps: '12', weight: '45 lb',
          cue: 'Palms facing in — kinder on the shoulder joint.',
          why: 'Switched to neutral-grip — palms in takes the pressure off a cranky shoulder.' } },
      { id: 'e4', name: 'Cable Lateral Raise', sets: 3, reps: '15', weight: '15 lb',
        details: [{ k: 'Grip', v: 'Neutral, lead the elbow' }, { k: 'Range', v: 'To shoulder height' }], last: '15 × 15',
        cue: 'Lead with the elbow, pinkie a touch high. Smooth, not swung.', done: false,
        alt: { name: 'Machine Lateral Raise', sets: 3, reps: '15', weight: '40 lb',
          cue: 'Supported path — just the side delt, no momentum.',
          why: 'Machine raises instead — same delt, no shoulder strain from stabilizing.' } },
      { id: 'e5', name: 'Overhead Triceps Extension', sets: 3, reps: '12', weight: '70 lb',
        details: [{ k: 'Grip', v: 'Rope, thumbs back' }, { k: 'Range', v: 'Full stretch to lockout' }], last: '65 × 12',
        cue: 'Full lockout, slow negative. This is the finisher.', done: false,
        alt: { name: 'Rope Pushdown', sets: 3, reps: '15', weight: '60 lb',
          cue: 'Elbows pinned — no overhead position to aggravate anything.',
          why: 'Pushdowns instead — keeps the arms out of any painful overhead stretch.' } },
    ],
  },

  // ── Exercise library: what a user can manually add to a session ──
  // Grouped by region. `last` is the user's prior top set when they have history
  // with that lift (drawn from logs); null = never logged.
  library: [
    { group: 'Chest', items: [
      { name: 'Flat Barbell Bench', last: '185 × 5' },
      { name: 'Flat Dumbbell Press', last: '70 × 8' },
      { name: 'Cable Fly', last: '25 × 15' },
      { name: 'Push-Up', last: null },
    ] },
    { group: 'Back', items: [
      { name: 'Pull-Up', last: '+25 × 6' },
      { name: 'Barbell Row', last: '155 × 8' },
      { name: 'Lat Pulldown', last: '130 × 10' },
      { name: 'Seated Cable Row', last: '140 × 10' },
      { name: 'Face Pull', last: '40 × 15' },
    ] },
    { group: 'Shoulders', items: [
      { name: 'Overhead Press', last: '105 × 5' },
      { name: 'Cable Lateral Raise', last: '15 × 15' },
      { name: 'Rear Delt Fly', last: '20 × 15' },
    ] },
    { group: 'Arms', items: [
      { name: 'Skull Crushers', last: null },
      { name: 'Rope Pushdown', last: '60 × 15' },
      { name: 'Overhead Triceps Extension', last: '65 × 12' },
      { name: 'Barbell Curl', last: '65 × 10' },
      { name: 'Incline DB Curl', last: '30 × 10' },
      { name: 'Hammer Curl', last: '35 × 12' },
    ] },
    { group: 'Legs', items: [
      { name: 'Back Squat', last: '225 × 5' },
      { name: 'Romanian Deadlift', last: '205 × 8' },
      { name: 'Leg Press', last: '360 × 10' },
      { name: 'Walking Lunge', last: '40 × 12' },
      { name: 'Leg Curl', last: '90 × 12' },
      { name: 'Calf Raise', last: '180 × 15' },
    ] },
    { group: 'Core', items: [
      { name: 'Hanging Leg Raise', last: null },
      { name: 'Cable Crunch', last: '70 × 15' },
      { name: 'Plank', last: null },
    ] },
  ],

  // ── Coach: three example threads to showcase the coach's range ──
  conversations: {
    program: {
      label: 'Programming today',
      messages: [
        { from: 'coach', text: 'Morning, Marcus. Today is push — incline leads. How’s the sternum feeling after Saturday’s session?' },
        { from: 'user', text: 'A little tender but okay. Slept well.' },
        { from: 'coach', text: 'Good. We’ll keep the incline shy of a deep stretch and stop dips a rep early if anything pinches. Strength over heroics. Want to see what I pulled together?' },
        { from: 'user', text: 'Yeah, load it up.' },
        { from: 'coach', text: 'Five movements, about 48 minutes. I nudged your incline top set to 155 × 5 — you owned 150 last week with two left in the tank. The rest supports it without taxing your back.', card: 'session' },
      ],
    },
    injury: {
      label: 'Working around pain',
      messages: [
        { from: 'coach', text: 'Before we start — anything talking to you today?' },
        { from: 'user', text: 'Lower back is a little cranky this morning.' },
        { from: 'coach', text: 'Thank you for flagging it early — that’s exactly the move. Let’s pull anything that loads the spine under fatigue. I’ll swap standing press for seated, drop the dip weight, and we skip hinging entirely. Nothing today should ask your back to brace hard.' },
        { from: 'user', text: 'Will I lose progress?' },
        { from: 'coach', text: 'No. One protective session costs you nothing. One aggravated back costs you months. We train around it, not through it — that patience is what gets you to 200 lean.' },
      ],
    },
    ego: {
      label: 'A gentle line',
      messages: [
        { from: 'user', text: 'Feeling strong today. Thinking I might max out the incline.' },
        { from: 'coach', text: 'I hear you — and I’m going to gently hold the line. You’ve been back about two months. Your strength is climbing faster than your tendons can follow right now.' },
        { from: 'user', text: 'I feel ready though.' },
        { from: 'coach', text: 'I believe you feel ready. A true one-rep max this early buys risk, not muscle. Let’s take 155 for a crisp top set of five and leave one in reserve. That builds the physique you’re after faster than a heroic single — and keeps your sternum out of it.' },
      ],
    },
  },

  quickReplies: ['How’s my back looking?', 'Swap an exercise', 'I’m short on time today', 'Make it harder'],

  // ── Progress: estimated 1RM trend per lift ──
  progress: {
    exercises: [
      { id: 'incline', name: 'Incline Press', unit: 'lb' },
      { id: 'squat',   name: 'Back Squat', unit: 'lb' },
      { id: 'ohp',     name: 'Shoulder Press', unit: 'lb' },
      { id: 'dip',     name: 'Weighted Dip', unit: 'lb' },
      { id: 'pullup',  name: 'Pull-Up', unit: 'reps' },
      { id: 'row',     name: 'Chest-Supported Row', unit: 'lb' },
    ],
    // e1RM series, oldest→newest, roughly weekly
    series: {
      incline: [162,160,164,166,165,169,171,170,174,176,175,179,178,182,180,184], // rising
      squat:   [245,250,248,254,258,256,262,265,260,250,242,236,232,230,232,234], // peaked, then deloaded for the back
      ohp:     [124,126,125,127,126,124,123,125,124,122,123,124,123,124,122,123], // flat — plateau
      dip:     [70,72,71,74,76,75,78,80,79,82,84,83,86,88,87,90],                 // rising
      pullup:  [9,9,10,10,11,11,12,12,13,13,13,14,14,14,15,15],                   // rising
      row:     [150,152,155,158,160,162,164,166,167,167,166,168,167,168,167,168], // rose, now holding
    },
    // why a lift is or isn't moving — drives the coach's reflection & tone
    meta: {
      incline: { reason: null,          adherence: { done: 12, planned: 12 } },
      squat:   { reason: 'injury',      adherence: { done: 8,  planned: 10 } },
      ohp:     { reason: 'consistency', adherence: { done: 5,  planned: 12 } },
      dip:     { reason: null,          adherence: { done: 11, planned: 12 } },
      pullup:  { reason: null,          adherence: { done: 12, planned: 12 } },
      row:     { reason: 'stimulus',    adherence: { done: 11, planned: 12 } },
    },
  },

  // ── Body: tracked issues ──
  issues: [
    { id: 'hip',     region: 'hip-r',   label: 'Right hip',  severity: 'moderate',
      note: 'Chronic tightness from years of figure-4 desk sitting. Avoid deep ATG squats under load.', since: 'Tracking 3 mo' },
    { id: 'back',    region: 'lowback', label: 'Lower back', severity: 'mild',
      note: 'Healing strain, ~1 week in. No heavy hinging; bracing drills only for now.', since: 'Tracking 6 d' },
    { id: 'sternum', region: 'chest',   label: 'Left sternum', severity: 'mild',
      note: 'Costochondral joint flares on deep chest stretch. Limiting flat bench & deep flyes.', since: 'Tracking 5 wk' },
  ],

  severities: [
    { id: 'mild',        label: 'Mild',        hue: 'sage',     desc: 'Aware of it, training continues' },
    { id: 'moderate',    label: 'Moderate',    hue: 'gold',     desc: 'Working around it deliberately' },
    { id: 'significant', label: 'Significant', hue: 'lavender', desc: 'Protecting it — coach adapts fully' },
  ],

  // ── Body: training soreness (recovery, not injury — auto-fades) ──
  soreness: [
    { id: 's-knee', region: 'knee', label: 'Legs', level: 'moderate', note: 'From Sunday’s leg day. Normal — easing.', fades: 'Fresh in ~1 day' },
  ],
  sorenessLevels: [
    { id: 'light',    label: 'Light',    hue: 'sage', desc: 'A little tender — good to train' },
    { id: 'moderate', label: 'Moderate', hue: 'gold', desc: 'Noticeably sore — train smart' },
    { id: 'heavy',    label: 'Heavy',    hue: 'lavender', desc: 'Very sore — coach eases the volume' },
  ],

  // Coach openers when the user taps "talk to coach about this" from Body.
  bodyTopicReplies: ['It’s sharp', 'Only on certain movements', 'A dull ache', 'It’s easing'],

  // ── Apple Health / Health Connect recovery signals (when connected) ──
  recovery: {
    status: 'low', // low | fair | good — drives readiness when Health is connected
    metrics: [
      { id: 'hrv',   label: 'HRV',        value: '42', unit: 'ms',  trend: 'down', baseline: '58 avg' },
      { id: 'sleep', label: 'Sleep',      value: '5h 20m',          trend: 'down', baseline: '7h goal' },
      { id: 'rhr',   label: 'Resting HR', value: '58', unit: 'bpm', trend: 'up',   baseline: '52 avg' },
    ],
    line: 'Your HRV is down and you slept 5h 20m — today leans toward a deload, not a PR. I’ve already lightened the plan.',
    word: 'Recover',
  },

  // ── Circle: the temple courtyard. Presence over performance. ──
  // Each friend carries their own lightsaber hue — their saber color.
  circle: {
    // people you train alongside. `now` = mid-session right now.
    friends: [
      { id: 'theo',  name: 'Theo Reyes',    initials: 'TR', hue: 'sage',     streak: 6,  now: { session: 'Legs', startedMin: 18 }, withYou: false },
      { id: 'lena',  name: 'Lena Marsh',    initials: 'LM', hue: 'sky',      streak: 17, withYou: true },
      { id: 'dana',  name: 'Dana Okafor',   initials: 'DO', hue: 'lavender', streak: 23, withYou: true },
      { id: 'wes',   name: 'Wes Andersson', initials: 'WA', hue: 'gold',     streak: 9,  withYou: false },
      { id: 'priya', name: 'Priya Sharma',  initials: 'PS', hue: 'sky',      streak: 41, withYou: false },
      { id: 'sam',   name: 'Sam Oduya',     initials: 'SO', hue: 'sage',     streak: 2,  withYou: false },
    ],

    // the courtyard feed — newest first. `kind` shapes tone & icon.
    //   session  — finished a workout
    //   pr       — a quiet personal best
    //   protected— eased a session to protect something (the honest culture)
    //   rest     — chose recovery
    //   returned — came back after time away
    //   streak   — a consistency milestone
    feed: [
      { id: 'f1', who: 'theo',  kind: 'training', when: '18 min',  title: 'Legs', line: 'In the middle of it right now.' },
      { id: 'f2', who: 'lena',  kind: 'pr',       when: '1 hr',    title: 'Deadlift · 365 lb', line: 'First time past 360. Clean, no grind.', kudos: 4, milestone: 'New best' },
      { id: 'f3', who: 'dana',  kind: 'session',  when: '2 hr',    title: 'Pull · Back focus', line: 'Kept the rhythm — 23 days running.', kudos: 2 },
      { id: 'f4', who: 'wes',   kind: 'protected',when: 'Yesterday',title: 'Push, eased',       line: 'Shoulder felt off, so he pulled the pressing volume. Smart.', kudos: 3 },
      { id: 'f5', who: 'priya', kind: 'rest',     when: 'Yesterday',title: 'Rest day',          line: 'HRV was low — chose to recover. The long path.' },
      { id: 'f6', who: 'sam',   kind: 'returned', when: '2 days',  title: 'Back in the gym',    line: 'First session after three weeks away.', kudos: 5 },
    ],

    // quiet words you can send — no typing, just presence
    words: ['Strong work.', 'Proud of that streak.', 'Welcome back.', 'That’s patience.', 'Earned it.'],

    // your own line in the courtyard
    me: { initials: 'MA', hue: 'sage', streak: 11 },

    inviteLink: 'temple.fit/marcus',

    // phone contacts for the invite flow. onTemple → already here (Add); else Invite.
    contacts: [
      { id: 'c1', name: 'Coach Ray',     initials: 'CR', onTemple: true,  hint: 'Trains at your gym' },
      { id: 'c2', name: 'Jordan Pace',   initials: 'JP', onTemple: true,  hint: '3 mutual friends' },
      { id: 'c3', name: 'Mom',           initials: 'M',  onTemple: false },
      { id: 'c4', name: 'Eli Booker',    initials: 'EB', onTemple: false },
      { id: 'c5', name: 'Nadia Hassan',  initials: 'NH', onTemple: true,  hint: '1 mutual friend' },
      { id: 'c6', name: 'Tom Whitaker',  initials: 'TW', onTemple: false },
      { id: 'c7', name: 'Grace Lin',     initials: 'GL', onTemple: false },
      { id: 'c8', name: 'Marco Vitale',  initials: 'MV', onTemple: false },
      { id: 'c9', name: 'Sophie Reyes',  initials: 'SR', onTemple: false },
    ],
  },

  // ── Onboarding ──
  onboarding: {
    goals: [
      { id: 'strength', label: 'Build strength & size', desc: 'Get stronger, add muscle' },
      { id: 'lean',     label: 'Lose fat, stay strong', desc: 'Leaner without losing power' },
      { id: 'mobility', label: 'Move well & mobile',    desc: 'Flexibility, control, longevity' },
      { id: 'health',   label: 'General health',        desc: 'Consistent, balanced training' },
      { id: 'rebuild',  label: 'Rebuild after a break', desc: 'Ease back in, carefully' },
    ],
    levels: [
      { id: 'new',      label: 'New',         desc: 'Lead me — I’ll follow the plan' },
      { id: 'return',   label: 'Returning',   desc: 'I’ve trained before; easing back' },
      { id: 'inter',    label: 'Intermediate',desc: 'I know the lifts; refine and push me' },
      { id: 'advanced', label: 'Advanced',    desc: 'Assist, don’t get in my way' },
    ],
    equipment: [
      'Full gym', 'Barbell & rack', 'Dumbbells', 'Cables & machines', 'Bodyweight only', 'Resistance bands',
    ],
    regions: [
      { id: 'neck',    label: 'Neck' }, { id: 'shoulder', label: 'Shoulders' },
      { id: 'chest',   label: 'Chest / sternum' }, { id: 'elbow', label: 'Elbows' },
      { id: 'lowback', label: 'Lower back' }, { id: 'hip', label: 'Hips' },
      { id: 'knee',    label: 'Knees' }, { id: 'ankle', label: 'Ankles' },
    ],
  },
};
