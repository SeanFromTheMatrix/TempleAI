// body.jsx — daily body check-in. Readiness + soreness for everyone; injuries when present.

const SEV_HUE = { mild: 'sage', moderate: 'gold', significant: 'lavender' };
const SORE_HUE = { light: 'sage', moderate: 'gold', heavy: 'lavender' };

function shapeEl(s, props, key) {
  if (s.type === 'circle') return <circle key={key} cx={s.cx} cy={s.cy} r={s.r} {...props} />;
  if (s.type === 'ellipse') return <ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...props} />;
  return <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} ry={s.r} {...props} />;
}

const BODY_PARTS = [
  { type: 'circle', cx: 130, cy: 48, r: 25 },
  { type: 'rect', x: 121, y: 68, w: 18, h: 20, r: 8 },
  { type: 'ellipse', cx: 82, cy: 110, rx: 20, ry: 19 },
  { type: 'ellipse', cx: 178, cy: 110, rx: 20, ry: 19 },
  { type: 'rect', x: 86, y: 98, w: 88, h: 150, r: 34 },
  { type: 'rect', x: 55, y: 108, w: 24, h: 128, r: 12 },
  { type: 'rect', x: 181, y: 108, w: 24, h: 128, r: 12 },
  { type: 'rect', x: 90, y: 236, w: 80, h: 52, r: 24 },
  { type: 'rect', x: 95, y: 280, w: 32, h: 168, r: 16 },
  { type: 'rect', x: 133, y: 280, w: 32, h: 168, r: 16 },
];

const REGIONS = [
  { id: 'neck',     label: 'Neck',          shape: { type: 'rect', x: 113, y: 60, w: 34, h: 30, r: 14 } },
  { id: 'shoulder', label: 'Shoulders',     shape: { type: 'rect', x: 60, y: 92, w: 140, h: 32, r: 16 } },
  { id: 'chest',    label: 'Chest',         shape: { type: 'rect', x: 92, y: 116, w: 76, h: 50, r: 22 } },
  { id: 'elbow',    label: 'Arms',          shape: { type: 'rect', x: 52, y: 168, w: 156, h: 30, r: 14 } },
  { id: 'lowback',  label: 'Lower back / core', shape: { type: 'rect', x: 92, y: 188, w: 76, h: 56, r: 22 } },
  { id: 'hip',      label: 'Hips',          shape: { type: 'rect', x: 90, y: 240, w: 80, h: 46, r: 22 } },
  { id: 'knee',     label: 'Legs',          shape: { type: 'rect', x: 92, y: 300, w: 76, h: 120, r: 16 } },
  { id: 'ankle',    label: 'Ankles',        shape: { type: 'rect', x: 92, y: 422, w: 76, h: 30, r: 12 } },
];

function BodyFigure({ marks, selected, onSelect }) {
  return (
    <svg width="100%" viewBox="0 0 260 480" style={{ display: 'block', overflow: 'visible', maxHeight: 330 }}>
      <defs>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fbf8f2" /><stop offset="100%" stopColor="#ece4d6" />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="464" rx="70" ry="9" fill="rgba(70,58,40,0.06)" style={{ filter: 'blur(4px)' }} />
      {BODY_PARTS.map((s, i) => shapeEl(s, { fill: 'url(#bodyFill)', stroke: 'rgba(44,40,35,0.07)', strokeWidth: 1 }, 'b' + i))}

      {REGIONS.map(r => {
        const m = marks[r.id];
        if (!m) return null;
        const hue = `var(--${m.hue})`;
        return (
          <g key={'g' + r.id}>
            {shapeEl(r.shape, { fill: hue, opacity: m.strong ? 0.55 : 0.32, style: { filter: 'blur(7px)' } }, 'glow' + r.id)}
            {shapeEl(r.shape, { fill: 'none', stroke: hue, strokeWidth: 1.5,
              strokeDasharray: m.strong ? '0' : '3 4', opacity: m.strong ? 0.9 : 0.7 }, 'ring' + r.id)}
          </g>
        );
      })}
      {selected && (() => { const r = REGIONS.find(x => x.id === selected);
        return shapeEl(r.shape, { fill: 'none', stroke: 'var(--ink)', strokeWidth: 1.5, strokeDasharray: '3 4', opacity: 0.5 }, 'sel'); })()}
      {REGIONS.map(r => shapeEl(r.shape, { fill: 'transparent', style: { cursor: 'pointer' }, onClick: () => onSelect(r.id) }, 'h' + r.id))}
    </svg>
  );
}

// Big choice / scale buttons reused by the panel
function ScaleButton({ hue, label, desc, on, onClick }) {
  return (
    <button className="tm-btn" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13,
      padding: '14px 16px', borderRadius: 16, textAlign: 'left', width: '100%',
      background: on ? `var(--${hue}-tint)` : 'var(--surface)',
      border: on ? `0.5px solid var(--${hue})` : '0.5px solid var(--line)' }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: `var(--${hue})`,
        boxShadow: `0 0 8px var(--${hue})`, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 1 }}>{desc}</div>
      </div>
      {on && <span style={{ color: `var(--${hue}-deep)` }}><IcCheck size={18} /></span>}
    </button>
  );
}

function Readiness({ issues, soreness, recovery }) {
  const sig = issues.some(i => i.severity === 'significant');
  const heavy = soreness.some(s => s.level === 'heavy');
  const lowRec = recovery && recovery.status === 'low';
  let hue = 'sage', word = 'Recovered', line = 'Nothing sore, nothing flagged — a green light to train hard today.';
  if (lowRec) { hue = 'lavender'; word = recovery.word || 'Recover'; line = recovery.line; }
  else if (sig) { hue = 'lavender'; word = 'Adapted'; line = `Protecting ${issues.length} issue${issues.length>1?'s':''} — today’s plan is built around them.`; }
  else if (issues.length) { hue = 'sky'; word = 'Mindful'; line = `Working around ${issues.length} issue${issues.length>1?'s':''}. The coach keeps load off them.`; }
  else if (heavy) { hue = 'lavender'; word = 'Recovering'; line = 'Heavily sore — ease into today and let the volume come down.'; }
  else if (soreness.length) { hue = 'gold'; word = 'Primed'; line = 'A little sore from recent work — train smart and it’ll settle.'; }
  else if (recovery && recovery.status === 'good') { hue = 'sage'; word = 'Charged'; line = 'Recovery’s strong — sleep and HRV are where we want them. Go earn it.'; }
  return (
    <div className="tm-glass" style={{ borderRadius: 'var(--radius-lg)', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <Halo hue={hue} size={180} opacity={0.4} style={{ right: -50, top: -60 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: `var(--${hue})`, boxShadow: `0 0 7px var(--${hue})` }} />
          <span className="tm-kicker" style={{ fontSize: 10.5 }}>Today’s readiness</span>
          {recovery && <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
            <IcHeart size={12} sw={1.6} /> Apple Health</span>}
        </div>
        <div className="tm-display" style={{ fontSize: 30, lineHeight: 1.04 }}>{word}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic',
          color: 'var(--ink-soft)', marginTop: 5, lineHeight: 1.34, textWrap: 'pretty' }}>{line}</div>

        {recovery && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 15, borderTop: '1px solid var(--line)' }}>
            {recovery.metrics.map(m => {
              const arrow = m.trend === 'down' ? '↓' : m.trend === 'up' ? '↑' : '→';
              const aHue = (m.id === 'rhr' ? m.trend === 'up' : m.trend === 'down') ? 'gold' : 'sage';
              return (
                <div key={m.id} style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--ink-faint)', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 18, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
                    {m.unit && <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{m.unit}</span>}
                    <span style={{ fontSize: 12, color: `var(--${aHue}-deep)` }}>{arrow}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 2 }}>{m.baseline}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectHealthCard({ onConnect }) {
  return (
    <button className="tm-btn tm-card" onClick={onConnect} style={{ width: '100%', textAlign: 'left',
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: 'var(--accent-tint)',
        border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}><IcHeart size={22} sw={1.6} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>Connect Apple Health</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 1 }}>
          Let the coach read your sleep & HRV to set your readiness</div>
      </div>
      <span style={{ color: 'var(--accent-deep)' }}><IcChevR size={18} /></span>
    </button>
  );
}

function BodyScreen({ onTalkToCoach, health, onConnectHealth }) {
  const [issues, setIssues] = React.useState(TEMPLE_DATA.issues);
  const [soreness, setSoreness] = React.useState(TEMPLE_DATA.soreness);
  const [selected, setSelected] = React.useState(null);
  const [intent, setIntent] = React.useState(null); // 'choose' | 'sore' | 'pain' | 'region'
  const [addTarget, setAddTarget] = React.useState('choose'); // where a region pick lands
  const recovery = health ? TEMPLE_DATA.recovery : null;

  const region = REGIONS.find(r => r.id === selected);
  const baseRegion = (x) => x.region.replace(/-[lr]$/, '');
  const existingIssue = issues.find(i => baseRegion(i) === selected);
  const existingSore = soreness.find(s => s.region === selected);

  // figure marks: injuries strong, soreness soft
  const marks = {};
  soreness.forEach(s => { marks[s.region] = { hue: SORE_HUE[s.level], strong: false }; });
  issues.forEach(i => { marks[baseRegion(i)] = { hue: SEV_HUE[i.severity], strong: true }; });

  const open = (id) => {
    setSelected(id);
    const iss = issues.find(i => baseRegion(i) === id);
    setIntent(iss ? 'pain' : 'choose');
  };
  const close = () => { setSelected(null); setIntent(null); };

  // Non-spatial entry: pick a target section, then choose the area from a list.
  const addArea = (target) => { setAddTarget(target); setSelected(null); setIntent('region'); };
  const pickRegion = (id) => { setSelected(id); setIntent(addTarget); };

  const saveInjury = (sev) => {
    setIssues(list => {
      const others = list.filter(i => baseRegion(i) !== selected);
      return [...others, { id: selected, region: selected, label: region.label, severity: sev,
        note: existingIssue?.note || 'Flagged just now — the coach will adapt your sessions around it.',
        since: existingIssue?.since || 'Tracking 1 d' }];
    });
    setSoreness(list => list.filter(s => s.region !== selected));
    close();
  };
  const saveSore = (lvl) => {
    setSoreness(list => {
      const others = list.filter(s => s.region !== selected);
      return [...others, { id: 's-' + selected, region: selected, label: region.label, level: lvl,
        note: 'Logged just now — recovery, not injury.', fades: lvl === 'heavy' ? 'Fresh in ~2 days' : 'Fresh in ~1 day' }];
    });
    close();
  };
  const clearIssue = () => { setIssues(list => list.filter(i => baseRegion(i) !== selected)); close(); };
  const clearSore = (id) => setSoreness(list => list.filter(s => s.id !== id));

  return (
    <div className="tm-scroll" style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
      <ScreenHeader kicker="Body" title="How’s your body?"
        sub="Tap the figure, or check in below — what’s sore, what’s hurting." />

      <div style={{ padding: '4px 24px 0' }}><Readiness issues={issues} soreness={soreness} recovery={recovery} /></div>

      {!health && (
        <div style={{ padding: '10px 24px 0' }}><ConnectHealthCard onConnect={onConnectHealth} /></div>
      )}

      <div style={{ position: 'relative', padding: '12px 24px 0' }}>
        <Halo hue="sky" size={280} opacity={0.22} style={{ left: '50%', top: 20, transform: 'translateX(-50%)' }} />
        <div style={{ position: 'relative' }}>
          <BodyFigure marks={marks} selected={selected} onSelect={open} />
        </div>
      </div>

      {/* PANEL */}
      {(selected || intent === 'region') ? (
        <div className="tm-fade" style={{ padding: '0 24px' }}>
          <div className="tm-glass" style={{ borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="tm-display" style={{ fontSize: 26 }}>
                {intent === 'region'
                  ? (addTarget === 'sore' ? 'Log soreness' : addTarget === 'pain' ? 'Track an injury' : 'Check in an area')
                  : region.label}</div>
              <button className="tm-btn" onClick={close} style={{ width: 40, height: 40, borderRadius: '50%',
                background: 'var(--surface)', border: '0.5px solid var(--line)', color: 'var(--ink-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={20} /></button>
            </div>

            {intent === 'region' && (
              <>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 14px', fontWeight: 300 }}>
                  {addTarget === 'sore' ? 'Which area is sore?'
                    : addTarget === 'pain' ? 'Which area needs protecting?'
                    : 'Which area? Then tell me what’s going on.'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                  {REGIONS.map(r => {
                    const m = marks[r.id];
                    return (
                      <button key={r.id} className="tm-btn" onClick={() => pickRegion(r.id)} style={{
                        padding: '12px 16px', borderRadius: 14, fontSize: 14.5, fontWeight: 400,
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        color: 'var(--ink)', background: 'var(--surface)', border: '0.5px solid var(--line)' }}>
                        {m && <span style={{ width: 7, height: 7, borderRadius: '50%', background: `var(--${m.hue})`,
                          boxShadow: `0 0 6px var(--${m.hue})` }} />}
                        {r.label}</button>
                    );
                  })}
                </div>
              </>
            )}

            {intent === 'choose' && (
              <>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4, fontWeight: 300 }}>What’s going on here?</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="tm-btn" onClick={() => setIntent('sore')} style={{ flex: 1, padding: '18px 14px',
                    borderRadius: 16, background: 'var(--surface)', border: '0.5px solid var(--line)', textAlign: 'left' }}>
                    <IcLeaf size={22} sw={1.5} />
                    <div style={{ fontSize: 16, color: 'var(--ink)', marginTop: 8 }}>Just sore</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 2 }}>Training soreness — fades</div>
                  </button>
                  <button className="tm-btn" onClick={() => setIntent('pain')} style={{ flex: 1, padding: '18px 14px',
                    borderRadius: 16, background: 'var(--surface)', border: '0.5px solid var(--line)', textAlign: 'left' }}>
                    <IcSpark size={22} sw={1.5} />
                    <div style={{ fontSize: 16, color: 'var(--ink)', marginTop: 8 }}>Something hurts</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 2 }}>Pain to track & protect</div>
                  </button>
                </div>
              </>
            )}

            {intent === 'sore' && (
              <>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 14px', fontWeight: 300 }}>How sore is it?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {TEMPLE_DATA.sorenessLevels.map(l => (
                    <ScaleButton key={l.id} hue={l.hue} label={l.label} desc={l.desc}
                      on={existingSore?.level === l.id} onClick={() => saveSore(l.id)} />
                  ))}
                </div>
              </>
            )}

            {intent === 'pain' && (
              <>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 14px', fontWeight: 300 }}>How is it today?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {TEMPLE_DATA.severities.map(sv => (
                    <ScaleButton key={sv.id} hue={sv.hue} label={sv.label} desc={sv.desc}
                      on={existingIssue?.severity === sv.id} onClick={() => saveInjury(sv.id)} />
                  ))}
                </div>
                {/* talk to coach — always available for pain */}
                <button className="tm-btn" onClick={() => onTalkToCoach && onTalkToCoach(region.label)} style={{
                  marginTop: 14, width: '100%', height: 52, borderRadius: 16, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 9, background: 'var(--accent-deep)', color: '#fff', fontSize: 15,
                  boxShadow: '0 0 18px var(--accent)' }}>
                  <IcCoach size={19} sw={1.6} /> Talk to coach about this</button>
                {existingIssue && (
                  <button className="tm-btn" onClick={clearIssue} style={{ marginTop: 9, width: '100%', padding: '11px',
                    borderRadius: 14, background: 'transparent', border: '0.5px solid var(--line)', color: 'var(--ink-soft)',
                    fontSize: 13.5 }}>It’s better — clear this</button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px 24px 0' }}>
          <button className="tm-btn" onClick={() => addArea('choose')} style={{ width: '100%', height: 54,
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            background: 'var(--surface)', border: '0.5px solid var(--accent)', color: 'var(--accent-deep)',
            fontSize: 15, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            boxShadow: 'var(--shadow-sm)' }}>
            <IcPlus size={20} sw={1.7} /> Check in an area</button>
          {soreness.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 4px' }}>
                <div className="tm-kicker">Recovering · {soreness.length}</div>
                <button className="tm-btn" onClick={() => addArea('sore')} style={{ display: 'inline-flex',
                  alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9999, background: 'transparent',
                  border: '0.5px solid var(--line)', color: 'var(--ink-soft)', fontSize: 12 }}>
                  <IcPlus size={13} sw={1.7} /> Add</button>
              </div>
              {soreness.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="tm-tap" onClick={() => { setSelected(s.region); setIntent('sore'); }}
                    style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 2px' }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
                      background: `var(--${SORE_HUE[s.level]})`, boxShadow: `0 0 7px var(--${SORE_HUE[s.level]})` }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 16, color: 'var(--ink)' }}>{s.label}</span>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', textTransform: 'capitalize' }}>{s.level} · sore</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 3 }}>{s.fades}</div>
                    </div>
                    <button className="tm-btn" onClick={(e) => { e.stopPropagation(); clearSore(s.id); }} style={{ width: 30, height: 30,
                      borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--ink-faint)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={16} /></button>
                  </div>
                  {i < soreness.length - 1 && <div className="tm-divider" style={{ opacity: 0.6 }} />}
                </React.Fragment>
              ))}
            </>
          )}

          {issues.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 4px' }}>
                <div className="tm-kicker">Tracked · {issues.length}</div>
                <button className="tm-btn" onClick={() => addArea('pain')} style={{ display: 'inline-flex',
                  alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9999, background: 'transparent',
                  border: '0.5px solid var(--line)', color: 'var(--ink-soft)', fontSize: 12 }}>
                  <IcPlus size={13} sw={1.7} /> Add</button>
              </div>
              {issues.map((iss, i) => (
                <React.Fragment key={iss.id}>
                  <div style={{ padding: '14px 2px' }}>
                    <div className="tm-tap" onClick={() => open(baseRegion(iss))}
                      style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                        background: `var(--${SEV_HUE[iss.severity]})`, boxShadow: `0 0 8px var(--${SEV_HUE[iss.severity]})` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 16.5, color: 'var(--ink)' }}>{iss.label}</span>
                          <SeverityChip sev={iss.severity} />
                        </div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16.5, fontStyle: 'italic',
                          color: 'var(--ink-soft)', marginTop: 5, lineHeight: 1.35, textWrap: 'pretty' }}>{iss.note}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 6, fontWeight: 300 }}>{iss.since}</div>
                      </div>
                    </div>
                    <button className="tm-btn" onClick={() => onTalkToCoach && onTalkToCoach(iss.label)} style={{
                      marginTop: 10, marginLeft: 26, display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '8px 14px', borderRadius: 9999, background: 'var(--surface)',
                      border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', fontSize: 13 }}>
                      <IcCoach size={16} sw={1.6} /> Talk to coach about this</button>
                  </div>
                  {i < issues.length - 1 && <div className="tm-divider" style={{ opacity: 0.6 }} />}
                </React.Fragment>
              ))}
            </>
          )}

          {issues.length === 0 && soreness.length === 0 && (
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: 'italic',
              color: 'var(--ink-faint)', padding: '22px 0', textAlign: 'center' }}>
              All clear. Check in above if anything needs attention.</div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { BodyScreen });
