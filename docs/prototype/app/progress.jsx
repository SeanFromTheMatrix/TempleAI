// progress.jsx — lift progression with a softly glowing line, like a saber trail.

const RANGES = [
  { id: '30d', label: '30d', n: 5 },
  { id: '90d', label: '90d', n: 12 },
  { id: '1y',  label: '1y',  n: 16 },
  { id: 'all', label: 'All', n: 16 },
];

function GlowChart({ data, unit, width = 354, height = 188, hue = 'sky' }) {
  const cMain = `var(--${hue})`;
  const cDeep = `var(--${hue}-deep)`;
  const padX = 6, padTop = 22, padBot = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const span = (max - min) || 1;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBot;
  const pts = data.map((v, i) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padTop + innerH - ((v - min) / span) * innerH;
    return [x, y];
  });
  // smooth path (catmull-rom → bezier)
  const line = React.useMemo(() => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }, [data.join(',')]);
  const area = line + ` L ${pts[pts.length-1][0]} ${padTop+innerH} L ${pts[0][0]} ${padTop+innerH} Z`;
  const last = pts[pts.length - 1];
  const uid = React.useMemo(() => 'gc' + Math.random().toString(36).slice(2, 7), [data.join(',')]);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const len = el.getTotalLength();
    el.style.transition = 'none';
    el.style.strokeDasharray = len; el.style.strokeDashoffset = len;
    el.getBoundingClientRect();
    el.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)';
    el.style.strokeDashoffset = 0;
  }, [line]);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={uid + 'a'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cDeep} stopOpacity="0.22" />
          <stop offset="100%" stopColor={cMain} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={uid + 'l'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={cMain} />
          <stop offset="100%" stopColor={cDeep} />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0, 0.5, 1].map((g, i) => (
        <line key={i} x1={padX} x2={width - padX} y1={padTop + innerH * g} y2={padTop + innerH * g}
          stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 2 ? '0' : '2 5'} />
      ))}
      <path d={area} fill={`url(#${uid}a)`} />
      {/* soft underglow */}
      <path d={line} fill="none" stroke={cMain} strokeWidth="7" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.5" style={{ filter: 'blur(7px)' }} />
      {/* crisp line */}
      <path ref={ref} d={line} fill="none" stroke={`url(#${uid}l)`} strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${cMain})` }} />
      {/* endpoint */}
      <circle cx={last[0]} cy={last[1]} r="9" fill={cMain} opacity="0.3" style={{ filter: 'blur(3px)' }} />
      <circle cx={last[0]} cy={last[1]} r="4.5" fill="var(--paper)" stroke={cDeep} strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 5px ${cMain})` }} />
    </svg>
  );
}

// Classify the visible trend, then choose the coach's reflection by trend + reason.
function reflect(trend, reason, adh, unit) {
  if (reason === 'injury' && trend !== 'rising')
    return { hue: 'sky', title: 'This dip is by design',
      body: 'We pulled load to protect your back — and the line eased with it, exactly as planned. It resumes the moment you’re cleared. Protecting the lifter always beats protecting the number.',
      primary: 'Review the plan', ghost: 'Keep protecting it',
      doneMsg: 'Pulled up your plan — load stays off the spine and we’ll retest the squat when you’re cleared.',
      doneMsgAlt: 'Good. We hold the line and keep it safe. No rush.' };
  if (reason === 'consistency' && trend !== 'rising')
    return { hue: 'gold', title: 'The graph reflects the work',
      body: `You’ve kept ${adh.done} of the last ${adh.planned} planned sessions. No shame in it — life happens. But a flat line just means the stimulus has been intermittent. Want me to rebuild a lighter, stickier rhythm?`,
      primary: 'Yes — rebuild my rhythm', ghost: 'Not right now',
      doneMsg: 'Done. Next week is lighter and shorter, and I’ll nudge you on your training days so it sticks.',
      doneMsgAlt: 'No problem — I’ll leave the plan as it is. Come back when you’re ready.' };
  if (trend === 'holding' || (reason === 'stimulus' && trend !== 'rising'))
    return { hue: 'lavender', title: 'A plateau is information',
      body: 'You’ve adapted to this stimulus — that’s not failure, it’s a signal. Let’s change one variable: tempo, range of motion, or a small, honest load jump. The line moves again.',
      primary: 'Change the stimulus', ghost: 'Hold for now',
      doneMsg: 'Set. I’ve added a slower tempo and a small load bump to your next block — enough to wake the lift up.',
      doneMsgAlt: 'Understood — we hold steady for now and revisit it next week.' };
  if (trend === 'easing')
    return { hue: 'gold', title: 'Easing, on purpose',
      body: 'Numbers drift down sometimes — fatigue, a busy stretch, a deliberate deload. We read it calmly and adjust. The long path isn’t a straight line.',
      primary: 'Adjust my plan', ghost: 'Leave it',
      doneMsg: 'I’ve eased the coming week so you can recover into it. We climb again from there.',
      doneMsgAlt: 'Fine by me — nothing changes. We keep watching it together.' };
  return { hue: 'sage', title: 'Steady, honest gains',
    body: 'No spikes, no crashes — exactly the curve that reaches your goal without breaking you. Keep showing up.',
    primary: null, ghost: null };
}

function ProgressScreen({ initialId = 'incline', initialRange = '90d', firstRun, onOpenCoach }) {
  const P = TEMPLE_DATA.progress;
  const [exId, setExId] = React.useState(initialId);
  const [range, setRange] = React.useState(initialRange);

  if (firstRun) {
    return (
      <EmptyState hue="lavender" icon={<IcProgress size={32} sw={1.4} />} kicker="Progress"
        title="The path starts here"
        line="Once you’ve logged a few sessions, your lifts trace a line right here — and the coach reads what’s moving and what’s stuck."
        action={<><IcCoach size={19} sw={1.6} /> Start your first session</>} onAction={onOpenCoach} />
    );
  }

  const ex = P.exercises.find(e => e.id === exId);
  const full = P.series[exId];
  const meta = P.meta[exId] || { reason: null, adherence: { done: 0, planned: 0 } };
  const n = RANGES.find(r => r.id === range).n;
  const data = full.slice(Math.max(0, full.length - n));
  const unit = ex.unit;
  const current = data[data.length - 1];
  const best = Math.max(...data);
  const change = current - data[0];
  const ratio = change / (data[0] || 1);
  const trend = ratio > 0.02 ? 'rising' : ratio < -0.02 ? 'easing' : 'holding';
  const TR = { rising: { hue: 'sage', mark: '▲', word: '' },
               holding: { hue: 'gold', mark: '—', word: 'holding' },
               easing: { hue: 'lavender', mark: '▼', word: '' } }[trend];
  const note = reflect(trend, meta.reason, meta.adherence, unit);
  const adh = meta.adherence;
  const adhRatio = adh.planned ? adh.done / adh.planned : 1;
  const [committed, setCommitted] = React.useState({});
  const commit = (msg) => setCommitted(c => ({ ...c, [exId]: msg }));

  return (
    <div className="tm-scroll" style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
      <ScreenHeader kicker="Progress" title="The long path" />

      {/* exercise selector */}
      <div className="tm-scroll" style={{ display: 'flex', gap: 9, padding: '4px 24px 18px',
        overflowX: 'auto' }}>
        {P.exercises.map(e => {
          const on = e.id === exId;
          return (
            <button key={e.id} className="tm-btn" onClick={() => setExId(e.id)} style={{
              whiteSpace: 'nowrap', borderRadius: 9999, padding: '9px 16px', fontSize: 13.5, fontWeight: 400,
              flexShrink: 0, color: on ? 'var(--ink)' : 'var(--ink-soft)',
              background: on ? 'var(--accent-tint)' : 'var(--surface)',
              border: on ? '0.5px solid var(--accent)' : '0.5px solid var(--line)',
              boxShadow: on ? '0 0 0 0.5px var(--accent)' : 'none',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>{e.name}</button>
          );
        })}
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* headline */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 300, marginBottom: 4 }}>
              Estimated 1RM · current</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="tm-display" style={{ fontSize: 56, lineHeight: 0.9 }}>{current}</span>
              <span style={{ fontSize: 18, color: 'var(--ink-faint)' }}>{unit}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: 6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 9999, background: `var(--${TR.hue}-tint)`, border: `0.5px solid var(--${TR.hue})` }}>
              <span style={{ color: `var(--${TR.hue}-deep)`, fontSize: 13 }}>{TR.mark}</span>
              <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500,
                fontVariantNumeric: 'tabular-nums' }}>
                {TR.word ? TR.word : `${change >= 0 ? '+' : ''}${change} ${unit}`}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 7, fontWeight: 300 }}>
              peak {best} {unit}</div>
          </div>
        </div>

        {/* chart */}
        <div className="tm-card" style={{ padding: '12px 10px 8px', marginTop: 14, position: 'relative',
          overflow: 'hidden' }}>
          <GlowChart key={exId + range} data={data} unit={unit} hue={TR.hue} />
        </div>

        {/* range tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {RANGES.map(r => {
            const on = r.id === range;
            return (
              <button key={r.id} className="tm-btn" onClick={() => setRange(r.id)} style={{
                flex: 1, height: 42, borderRadius: 13, fontSize: 13.5, fontWeight: 400,
                color: on ? 'var(--ink)' : 'var(--ink-soft)',
                background: on ? 'var(--paper)' : 'transparent',
                border: on ? '0.5px solid var(--line)' : '0.5px solid transparent',
                boxShadow: on ? 'var(--shadow-sm)' : 'none' }}>{r.label}</button>
            );
          })}
        </div>

        {/* adherence — quiet honesty about the work actually done */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, padding: '0 2px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 300 }}>Sessions kept</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                {adh.done} <span style={{ color: 'var(--ink-faint)' }}>/ {adh.planned} planned</span></span>
            </div>
            <div style={{ height: 5, borderRadius: 5, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${adhRatio * 100}%`, borderRadius: 5,
                background: adhRatio >= 0.8 ? 'var(--sage)' : adhRatio >= 0.55 ? 'var(--gold)' : 'var(--lavender)',
                boxShadow: `0 0 6px ${adhRatio >= 0.8 ? 'var(--sage)' : adhRatio >= 0.55 ? 'var(--gold)' : 'var(--lavender)'}` }} />
            </div>
          </div>
        </div>

        {/* coach reflection — tone adapts to trend + reason */}
        <div className="tm-glass" style={{ marginTop: 18, borderRadius: 'var(--radius)', padding: '16px 18px',
          display: 'flex', gap: 13, alignItems: 'flex-start' }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 1,
            background: `var(--${note.hue}-tint)`, border: `0.5px solid var(--${note.hue})`,
            color: `var(--${note.hue}-deep)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcSpark size={16} sw={1.4} /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--ink-faint)', marginBottom: 6 }}>{note.title}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18.5, fontStyle: 'italic',
              color: 'var(--ink-soft)', lineHeight: 1.4, textWrap: 'pretty' }}>{note.body}</div>

            {note.primary && (committed[exId] ? (
              <div className="tm-fade" style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 14,
                paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--sage-deep)', marginTop: 1, flexShrink: 0 }}><IcCheck size={16} sw={2} /></span>
                <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 300, lineHeight: 1.45,
                  textWrap: 'pretty' }}>{committed[exId]}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
                <button className="tm-btn" onClick={() => commit(note.doneMsg)} style={{ flex: 1, minHeight: 46,
                  borderRadius: 13, padding: '8px 12px', fontSize: 13.5, fontWeight: 400, color: '#fff',
                  background: `var(--${note.hue}-deep)`, boxShadow: `0 0 16px var(--${note.hue})` }}>{note.primary}</button>
                <button className="tm-btn" onClick={() => commit(note.doneMsgAlt)} style={{ minHeight: 46,
                  borderRadius: 13, padding: '8px 16px', fontSize: 13.5, fontWeight: 400, color: 'var(--ink-soft)',
                  background: 'var(--surface)', border: '0.5px solid var(--line)', whiteSpace: 'nowrap' }}>{note.ghost}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProgressScreen });
