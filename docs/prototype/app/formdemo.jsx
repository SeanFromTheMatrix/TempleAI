// formdemo.jsx — Form Focus Pro: an animated, looping demonstration of a lift,
// performed by the same warm figure used in the body check-in. The figure is
// rigged (forward kinematics from joint angles) and tweened between a "top" and
// "bottom" pose to show one clean rep on a loop, tracing the movement path.

// ── Rig: a pose is a set of absolute segment angles (deg, y-down) + root pos. ──
const DEMO_BASE = { rootX: 120, rootY: 130, torso: -90, head: null, uArm: 90, fArm: 90, thigh: 90, shin: 90 };
const SEG_LEN = { torso: 54, neck: 30, uArm: 30, fArm: 28, thigh: 40, shin: 40 };

function poseToJoints(p) {
  const d = (deg) => deg * Math.PI / 180;
  const step = (from, ang, len) => ({ x: from.x + Math.cos(d(ang)) * len, y: from.y + Math.sin(d(ang)) * len });
  const hip = { x: p.rootX, y: p.rootY };
  const torsoA = p.torso, headA = p.head == null ? p.torso : p.head;
  const shoulder = step(hip, torsoA, SEG_LEN.torso);
  const neck = step(shoulder, headA, SEG_LEN.neck);
  const elbow = step(shoulder, p.uArm, SEG_LEN.uArm);
  const wrist = step(elbow, p.fArm, SEG_LEN.fArm);
  const knee = step(hip, p.thigh, SEG_LEN.thigh);
  const ankle = step(knee, p.shin, SEG_LEN.shin);
  return { hip, shoulder, neck, elbow, wrist, knee, ankle };
}

const lerp = (a, b, t) => a + (b - a) * t;
function lerpPose(A, B, t) {
  const out = {};
  for (const k of Object.keys(DEMO_BASE)) {
    const a = A[k] == null ? DEMO_BASE[k] : A[k];
    const b = B[k] == null ? DEMO_BASE[k] : B[k];
    if (k === 'head') { out[k] = (A.head == null && B.head == null) ? null : lerp(a === null ? A.torso : a, b === null ? B.torso : b, t); }
    else out[k] = lerp(a, b, t);
  }
  return out;
}

// ── Movement archetypes. Each maps to top/bottom poses + equipment + cues. ──
const ARCHETYPES = {
  squat: { view: 'stand', equip: 'bar-back', floor: 212, trace: 'hip', period: 2800,
    top:    { rootX: 120, rootY: 116, torso: -88, uArm: -148, fArm: -150, thigh: 90, shin: 90 },
    bottom: { rootX: 116, rootY: 150, torso: -62, uArm: -150, fArm: -152, thigh: 52, shin: 122 },
    cue: { down: 'Sit back and down — knees track over toes', up: 'Drive through the floor, chest tall' } },
  press: { view: 'stand', equip: 'bar', floor: 212, trace: 'wrist', period: 2600,
    top:    { rootY: 124, torso: -90, uArm: -90, fArm: -90 },
    bottom: { rootY: 124, torso: -90, uArm: 44, fArm: -122 },
    cue: { down: 'Bar to the collarbone, elbows under', up: 'Press up, finish with ribs stacked' } },
  curl: { view: 'stand', equip: 'db', floor: 212, trace: 'wrist', period: 2400,
    top:    { rootY: 130, torso: -90, uArm: 82, fArm: -36 },
    bottom: { rootY: 130, torso: -90, uArm: 82, fArm: 82 },
    cue: { down: 'Lower slow — keep tension', up: 'Curl up, elbows pinned to your sides' } },
  pushdown: { view: 'stand', equip: 'bar', floor: 212, trace: 'wrist', period: 2300,
    top:    { rootY: 130, torso: -88, uArm: 74, fArm: 4 },
    bottom: { rootY: 130, torso: -88, uArm: 74, fArm: 80 },
    cue: { down: 'Let it rise only to 90° — elbows locked in place', up: 'Push down to a full lockout' } },
  pull: { view: 'stand', equip: 'bar-high', floor: 212, trace: 'wrist', period: 2700,
    top:    { rootY: 130, torso: -86, uArm: -82, fArm: -84 },
    bottom: { rootY: 130, torso: -74, uArm: -126, fArm: -150 },
    cue: { down: 'Control the bar back up — full stretch', up: 'Pull to the chest, lead with the elbows' } },
  hinge: { view: 'stand', equip: 'bar-hang', floor: 212, trace: 'wrist', period: 2800,
    top:    { rootX: 120, rootY: 126, torso: -90, uArm: 90, fArm: 90, thigh: 90, shin: 90 },
    bottom: { rootX: 128, rootY: 132, torso: -34, uArm: 92, fArm: 92, thigh: 84, shin: 96 },
    cue: { down: 'Push the hips back, soft knees, flat back', up: 'Stand tall — squeeze the glutes' } },
  raise: { view: 'stand', equip: 'db', floor: 212, trace: 'wrist', period: 2500,
    top:    { rootY: 130, torso: -90, uArm: 2, fArm: 2 },
    bottom: { rootY: 130, torso: -90, uArm: 80, fArm: 80 },
    cue: { down: 'Lower with control — resist gravity', up: 'Lead with the elbow to shoulder height' } },
  benchpress: { view: 'lie', equip: 'bar', bench: true, floor: 214, trace: 'wrist', period: 2600,
    top:    { rootX: 84, rootY: 150, torso: 0, head: 0, uArm: -90, fArm: -90, thigh: 36, shin: 100 },
    bottom: { rootX: 84, rootY: 150, torso: 0, head: 0, uArm: -72, fArm: -150, thigh: 36, shin: 100 },
    cue: { down: 'Lower to the chest, elbows ~45°', up: 'Press up and slightly back over the shoulders' } },
  skullcrusher: { view: 'lie', equip: 'bar', bench: true, floor: 214, trace: 'wrist', period: 2400,
    top:    { rootX: 84, rootY: 150, torso: 0, head: 0, uArm: -86, fArm: -90, thigh: 36, shin: 100 },
    bottom: { rootX: 84, rootY: 150, torso: 0, head: 0, uArm: -86, fArm: -150, thigh: 36, shin: 100 },
    cue: { down: 'Bend at the elbow — bar toward the forehead', up: 'Extend to lockout, upper arms still' } },
  core: { view: 'lie', equip: 'none', bench: false, floor: 196, trace: 'shoulder', period: 2600,
    top:    { rootX: 96, rootY: 168, torso: -26, head: -26, uArm: -54, fArm: -40, thigh: 44, shin: 96 },
    bottom: { rootX: 96, rootY: 168, torso: 2, head: 2, uArm: -40, fArm: -30, thigh: 40, shin: 100 },
    cue: { down: 'Lower slow, ribs down', up: 'Curl up — exhale, brace the core' } },
};

// Map a movement name → archetype key.
function archForName(name) {
  const n = (name || '').toLowerCase();
  const has = (...ws) => ws.some(w => n.includes(w));
  if (has('squat', 'leg press', 'lunge')) return 'squat';
  if (has('skull')) return 'skullcrusher';
  if (has('overhead triceps')) return 'skullcrusher';
  if (has('bench', 'push-up', 'push up', 'dip', 'chest press', 'dumbbell press')) return 'benchpress';
  if (has('fly')) return 'raise';
  if (has('overhead press', 'shoulder press', 'ohp', 'military')) return 'press';
  if (has('pushdown')) return 'pushdown';
  if (has('curl')) return 'curl';
  if (has('pulldown', 'pull-up', 'pull up', 'chin', 'row', 'face pull')) return 'pull';
  if (has('deadlift', 'rdl', 'romanian', 'hinge', 'good morning')) return 'hinge';
  if (has('lateral', 'raise')) return n.includes('calf') ? 'squat' : 'raise';
  if (has('press')) return 'press';
  if (has('plank', 'crunch', 'leg raise', 'sit-up', 'sit up', 'ab ')) return 'core';
  return 'press';
}

// ── The animated figure ──
function DemoFigure({ arch, playing, speed }) {
  const A = ARCHETYPES[arch] || ARCHETYPES.press;
  const [u, setU] = React.useState(0);       // 0 = top, 1 = bottom
  const raf = React.useRef(0);
  const t0 = React.useRef(null);

  React.useEffect(() => {
    if (!playing) { cancelAnimationFrame(raf.current); return; }
    const period = A.period / speed;
    const tick = (ts) => {
      if (t0.current == null) t0.current = ts;
      const phase = ((ts - t0.current) % period) / period;     // 0..1
      const uu = (1 - Math.cos(phase * 2 * Math.PI)) / 2;       // smooth top→bottom→top
      setU(uu);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf.current); t0.current = null; };
  }, [playing, speed, arch]);

  const pose = lerpPose(A.top, A.bottom, u);
  const J = poseToJoints(pose);

  // movement path trace (sampled across the cycle)
  const tracePts = React.useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const uu = (1 - Math.cos((i / 24) * 2 * Math.PI)) / 2;
      const j = poseToJoints(lerpPose(A.top, A.bottom, uu));
      pts.push(j[A.trace]);
    }
    return pts;
  }, [arch]);
  const tracePath = tracePts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const marker = J[A.trace];

  const limb = (a, b, w, opacity = 1) => (
    <g opacity={opacity}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(44,40,35,0.13)" strokeWidth={w + 2.5} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#tmLimb)" strokeWidth={w} strokeLinecap="round" />
    </g>
  );
  const farO = 0.4, off = 5;
  const shift = (p) => ({ x: p.x - off, y: p.y + off });

  const equip = () => {
    const w = J.wrist;
    if (A.equip === 'none') return null;
    if (A.equip === 'db') {
      return <g>
        <rect x={w.x - 7} y={w.y - 13} width={14} height={26} rx={5} fill="var(--ink-soft)" />
      </g>;
    }
    // barbell variants: a bar through the wrists with plates
    const horiz = A.view === 'stand' && (A.equip === 'bar' || A.equip === 'bar-high' || A.equip === 'bar-hang' || A.equip === 'bar-back');
    const len = 46;
    if (horiz) {
      return <g stroke="var(--ink-soft)" strokeLinecap="round">
        <line x1={w.x - len/2} y1={w.y} x2={w.x + len/2} y2={w.y} strokeWidth={4} />
        <line x1={w.x - len/2} y1={w.y - 9} x2={w.x - len/2} y2={w.y + 9} strokeWidth={7} />
        <line x1={w.x + len/2} y1={w.y - 9} x2={w.x + len/2} y2={w.y + 9} strokeWidth={7} />
      </g>;
    }
    // lying: bar is horizontal too (front view of bar = a dot/short bar). draw small bar across wrist
    return <g stroke="var(--ink-soft)" strokeLinecap="round">
      <line x1={w.x - 22} y1={w.y} x2={w.x + 22} y2={w.y} strokeWidth={4} />
      <line x1={w.x - 22} y1={w.y - 8} x2={w.x - 22} y2={w.y + 8} strokeWidth={6} />
      <line x1={w.x + 22} y1={w.y - 8} x2={w.x + 22} y2={w.y + 8} strokeWidth={6} />
    </g>;
  };

  return (
    <svg width="100%" viewBox="34 -10 172 254" style={{ display: 'block', overflow: 'visible', maxHeight: 360 }}>
      <defs>
        <linearGradient id="tmLimb" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#f7f1e6" /><stop offset="100%" stopColor="#dccfb8" />
        </linearGradient>
      </defs>

      {/* floor / bench */}
      <line x1="34" y1={A.floor} x2="206" y2={A.floor} stroke="rgba(44,40,35,0.12)" strokeWidth="1.5" strokeLinecap="round" />
      {A.bench && <rect x={J.hip.x - 14} y={J.hip.y + 12} width={120} height={9} rx={4} fill="rgba(44,40,35,0.08)" />}

      {/* movement path trace */}
      <path d={tracePath} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="2 5"
        strokeLinecap="round" opacity="0.6" />

      {/* far limbs */}
      <g>
        {limb(shift(J.hip), shift(J.knee), 15, farO)}
        {limb(shift(J.knee), shift(J.ankle), 12, farO)}
        {limb(shift(J.shoulder), shift(J.elbow), 12, farO)}
        {limb(shift(J.elbow), shift(J.wrist), 10, farO)}
      </g>

      {/* torso + neck */}
      {limb(J.hip, J.shoulder, 19)}
      {limb(J.shoulder, J.neck, 12)}
      {/* head */}
      <circle cx={J.neck.x} cy={J.neck.y} r={15} fill="url(#tmLimb)" stroke="rgba(44,40,35,0.13)" strokeWidth="1.5" />

      {/* near limbs */}
      {limb(J.hip, J.knee, 16)}
      {limb(J.knee, J.ankle, 13)}
      {limb(J.shoulder, J.elbow, 13)}
      {limb(J.elbow, J.wrist, 11)}

      {/* joints */}
      {[J.shoulder, J.elbow, J.hip, J.knee].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="rgba(44,40,35,0.14)" />
      ))}

      {/* equipment */}
      {equip()}

      {/* moving marker on the trace */}
      <circle cx={marker.x} cy={marker.y} r={6} fill="var(--accent-deep)" opacity="0.9">
        <animate attributeName="r" values="6;8;6" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={marker.x} cy={marker.y} r={11} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function MovementDemoSheet({ exercise, pro, onUnlock, onClose }) {
  const arch = archForName(exercise ? exercise.name : '');
  const A = ARCHETYPES[arch];
  const [playing, setPlaying] = React.useState(true);
  const [speed, setSpeed] = React.useState(0.6);
  const [phaseUp, setPhaseUp] = React.useState(false);
  const name = exercise ? exercise.name : 'this movement';

  // caption flips with the rep direction
  React.useEffect(() => {
    if (!playing) return;
    const period = A.period / speed;
    let last = 0;
    const id = setInterval(() => {
      const t = performance.now();
      const phase = (t % period) / period;
      setPhaseUp(phase > 0.5);
      last = phase;
    }, 120);
    return () => clearInterval(id);
  }, [playing, speed, arch]);

  const showPaywall = !pro;

  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 75, display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(44,40,35,0.2)',
        backdropFilter: 'blur(2px)' }} />
      <div className="tm-glass tm-scroll" style={{ position: 'relative', borderRadius: '34px 34px 0 0',
        padding: '14px 22px 30px', maxHeight: '94%', overflowY: 'auto',
        animation: 'tm-rise 0.34s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--ink-ghost)', margin: '0 auto 16px' }} />

        {showPaywall ? (
          <div className="tm-rise">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px',
              borderRadius: 9999, background: 'var(--gold-tint)', border: '0.5px solid var(--gold)',
              color: 'var(--gold-deep)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              <IcSpark size={13} sw={1.5} /> Form Focus Pro</span>
            <div className="tm-display" style={{ fontSize: 36, lineHeight: 1.05, marginTop: 14 }}>See the movement</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic',
              color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.35, textWrap: 'pretty' }}>
              Watch a clean rep, looped — so you know exactly how the lift should look before you load it.</div>

            {/* teaser: the figure under a soft veil */}
            <div className="tm-card" style={{ marginTop: 20, padding: '10px 10px 0', position: 'relative',
              overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none' }}>
                <DemoFigure arch={arch} playing={true} speed={0.6} />
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center' }}>
                <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--paper)',
                  border: '0.5px solid var(--line)', boxShadow: 'var(--shadow-md)', color: 'var(--accent-deep)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, margin: '22px 0 8px' }}>
              {['Animated demo for every movement in your plan',
                'Form cues synced to each phase of the rep',
                'AI form check — film a set, get specific fixes'].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: 'var(--accent-tint)', border: '0.5px solid var(--accent)', color: 'var(--accent-deep)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcCheck size={14} sw={2} /></span>
                  <span style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 300, lineHeight: 1.4 }}>{b}</span>
                </div>
              ))}
            </div>

            <div className="tm-card" style={{ padding: '16px 18px', margin: '18px 0', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, color: 'var(--ink)' }}>Form Focus Pro</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 2 }}>
                  Demos + form checks · cancel anytime</div>
              </div>
              <div className="tm-display" style={{ fontSize: 26, lineHeight: 1 }}>$9<span style={{ fontSize: 15, color: 'var(--ink-faint)' }}>/mo</span></div>
            </div>

            <button className="tm-btn" onClick={() => onUnlock && onUnlock()} style={{ width: '100%', height: 58,
              borderRadius: 18, fontSize: 16.5, color: '#fff', background: 'var(--accent-deep)',
              boxShadow: '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)' }}>Start 7-day free trial</button>
            <button className="tm-btn" onClick={onClose} style={{ width: '100%', height: 48, marginTop: 8,
              borderRadius: 16, background: 'transparent', border: 'none', color: 'var(--ink-soft)', fontSize: 14 }}>
              Maybe later</button>
          </div>
        ) : (
          <div className="tm-rise">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="tm-kicker" style={{ marginBottom: 6 }}>Form Focus · Movement demo</div>
                <div className="tm-display" style={{ fontSize: 30, lineHeight: 1.05 }}>{name}</div>
              </div>
              <button className="tm-btn" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%',
                background: 'var(--surface)', border: '0.5px solid var(--line)', color: 'var(--ink-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IcClose size={20} /></button>
            </div>

            {/* the stage */}
            <div className="tm-card" style={{ marginTop: 16, padding: '8px 8px 0', position: 'relative',
              overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
              <Halo hue="sky" size={220} opacity={0.3} style={{ right: -60, top: -80 }} />
              <DemoFigure arch={arch} playing={playing} speed={speed} />
            </div>

            {/* phase caption */}
            <div className="tm-glass" style={{ marginTop: 14, borderRadius: 'var(--radius)', padding: '13px 15px',
              display: 'flex', gap: 11, alignItems: 'center', minHeight: 54 }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'var(--accent-tint)',
                border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
                {phaseUp ? <IcChevR size={16} sw={2} style={{ transform: 'rotate(-90deg)' }} />
                         : <IcChevR size={16} sw={2} style={{ transform: 'rotate(90deg)' }} />}</span>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic',
                color: 'var(--ink-soft)', lineHeight: 1.3, textWrap: 'pretty' }}>
                {phaseUp ? A.cue.up : A.cue.down}</div>
            </div>

            {/* controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <button className="tm-btn" onClick={() => setPlaying(p => !p)} style={{ width: 52, height: 52,
                borderRadius: '50%', flexShrink: 0, background: 'var(--accent-deep)', color: '#fff',
                boxShadow: '0 0 18px var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {playing
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
              </button>
              <div className="tm-glass" style={{ flex: 1, borderRadius: 9999, padding: 4, display: 'flex', gap: 4 }}>
                {[{ v: 0.4, l: '0.4×' }, { v: 0.6, l: '0.6×' }, { v: 1, l: '1×' }].map(s => {
                  const on = speed === s.v;
                  return (
                    <button key={s.v} className="tm-btn" onClick={() => setSpeed(s.v)} style={{ flex: 1, height: 42,
                      borderRadius: 9999, fontSize: 14, fontWeight: on ? 500 : 400,
                      color: on ? 'var(--ink)' : 'var(--ink-soft)', background: on ? 'var(--paper)' : 'transparent',
                      border: on ? '0.5px solid var(--line)' : '0.5px solid transparent',
                      boxShadow: on ? 'var(--shadow-sm)' : 'none' }}>{s.l}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 13,
              textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <span style={{ width: 14, height: 0, borderTop: '1.5px dashed var(--accent)' }} />
              The dotted line traces the path your hands should follow</div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MovementDemoSheet, DemoFigure, archForName });
