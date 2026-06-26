// onboarding.jsx — welcoming calibration. The threshold of the temple.

function ProgressDots({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ height: 6, borderRadius: 6, transition: 'all 0.4s',
          width: i === step ? 22 : 6,
          background: i === step ? 'var(--accent-deep)' : 'var(--ink-ghost)',
          boxShadow: i === step ? '0 0 8px var(--accent)' : 'none' }} />
      ))}
    </div>
  );
}

function OptionCard({ title, desc, selected, onClick, hue = 'sky' }) {
  return (
    <button className="tm-btn" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '17px 18px', borderRadius: 18, textAlign: 'left',
      width: '100%', background: selected ? `var(--${hue}-tint)` : 'var(--surface)',
      border: selected ? `0.5px solid var(--${hue})` : '0.5px solid var(--line)',
      boxShadow: selected ? `0 0 0 0.5px var(--${hue}), var(--shadow-sm)` : 'var(--shadow-sm)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16.5, color: 'var(--ink)', fontWeight: 400 }}>{title}</div>
        {desc && <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 2 }}>{desc}</div>}
      </div>
      <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: selected ? `var(--${hue}-deep)` : 'transparent',
        border: selected ? 'none' : '1.5px solid var(--ink-ghost)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? `0 0 10px var(--${hue})` : 'none' }}>
        {selected && <IcCheck size={14} sw={2.2} />}</span>
    </button>
  );
}

function StepShell({ children, footer }) {
  return (
    <div className="tm-rise" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="tm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 12px' }}>{children}</div>
      <div style={{ padding: '8px 28px 26px', flexShrink: 0 }}>{footer}</div>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button className="tm-btn" onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 58, borderRadius: 18, fontSize: 16.5, fontWeight: 400, letterSpacing: '0.02em',
      color: '#fff', background: disabled ? 'var(--ink-ghost)' : 'var(--accent-deep)',
      boxShadow: disabled ? 'none' : '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)',
      opacity: disabled ? 0.7 : 1 }}>{children}</button>
  );
}

function OnboardingFlow({ onComplete, initialStep = 0, seed = {} }) {
  const O = TEMPLE_DATA.onboarding;
  const [step, setStep] = React.useState(initialStep);
  const [goals, setGoals] = React.useState(seed.goals || []);
  const [level, setLevel] = React.useState(seed.level || null);
  const [equip, setEquip] = React.useState(seed.equip || []);
  const [protect, setProtect] = React.useState(seed.protect || []);
  const [protectNote, setProtectNote] = React.useState(seed.protectNote || '');
  const [health, setHealth] = React.useState(seed.health || false);
  const STEPS = 5;
  const next = () => setStep(s => Math.min(STEPS - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const toggle = (arr, set, id) => set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  // "Bodyweight only" is exclusive — it means no equipment at all.
  const toggleEquip = (eq) => {
    const BW = 'Bodyweight only';
    setEquip(prev => {
      if (eq === BW) return prev.includes(BW) ? [] : [BW];
      const without = prev.filter(x => x !== BW);
      return without.includes(eq) ? without.filter(x => x !== eq) : [...without, eq];
    });
  };

  return (
    <div className="tm-marble" style={{ height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative' }}>
      {/* light shaft */}
      <div style={{ position: 'absolute', top: -40, left: '14%', width: 160, height: 320,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.7), rgba(255,255,255,0))',
        transform: 'rotate(18deg)', filter: 'blur(24px)', pointerEvents: 'none' }} />

      {/* top: back + dots */}
      <div style={{ paddingTop: 64, padding: '64px 28px 14px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        <button className="tm-btn" onClick={back} style={{ width: 40, height: 40, borderRadius: '50%',
          background: step === 0 ? 'transparent' : 'var(--surface)',
          border: step === 0 ? '0.5px solid transparent' : '0.5px solid var(--line)',
          color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}>
          <IcChevL size={20} /></button>
        <ProgressDots step={step} total={STEPS} />
        <div style={{ width: 40 }} />
      </div>

      {/* WELCOME */}
      {step === 0 && (
        <div className="tm-rise" style={{ flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 36px 40px',
          position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 70%)',
              animation: 'tm-breathe 4s ease-in-out infinite' }} />
            <div style={{ position: 'relative', color: 'var(--accent-deep)' }}><IcSpark size={48} sw={1.2} /></div>
          </div>
          <div className="tm-kicker" style={{ marginBottom: 18 }}>Welcome</div>
          <div className="tm-display" style={{ fontSize: 64, letterSpacing: '0.08em', marginBottom: 18 }}>TEMPLE</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic',
            color: 'var(--ink-soft)', lineHeight: 1.4, maxWidth: 300, textWrap: 'balance' }}>
            A coach for the long path. Calm, honest, and built around you.</div>
          <div style={{ marginTop: 'auto' }} />
          <div style={{ width: '100%', marginTop: 44 }}>
            <PrimaryBtn onClick={next}>Begin</PrimaryBtn>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 16, fontWeight: 300 }}>
              Four quiet questions. Under a minute.</div>
          </div>
        </div>
      )}

      {/* GOALS */}
      {step === 1 && (
        <StepShell footer={<PrimaryBtn onClick={next} disabled={!goals.length}>Continue</PrimaryBtn>}>
          <div className="tm-display" style={{ fontSize: 38, marginBottom: 8 }}>What brings you here?</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 300, marginBottom: 24 }}>
            Choose all that ring true. We’ll shape everything around them.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {O.goals.map(g => (
              <OptionCard key={g.id} title={g.label} desc={g.desc}
                selected={goals.includes(g.id)} onClick={() => toggle(goals, setGoals, g.id)} />
            ))}
          </div>
        </StepShell>
      )}

      {/* EXPERIENCE + EQUIPMENT */}
      {step === 2 && (
        <StepShell footer={<PrimaryBtn onClick={next} disabled={!level || !equip.length}>Continue</PrimaryBtn>}>
          <div className="tm-display" style={{ fontSize: 38, marginBottom: 8 }}>Where are you on the path?</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 300, marginBottom: 22 }}>
            This sets how much the coach leads versus assists.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {O.levels.map(l => (
              <OptionCard key={l.id} title={l.label} desc={l.desc} hue="lavender"
                selected={level === l.id} onClick={() => setLevel(l.id)} />
            ))}
          </div>
          <div className="tm-kicker" style={{ margin: '28px 0 14px' }}>What’s available to you</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {O.equipment.map(eq => {
              const on = equip.includes(eq);
              return (
                <button key={eq} className="tm-btn" onClick={() => toggleEquip(eq)} style={{
                  padding: '11px 16px', borderRadius: 9999, fontSize: 14, fontWeight: 400,
                  color: on ? 'var(--ink)' : 'var(--ink-soft)',
                  background: on ? 'var(--sage-tint)' : 'var(--surface)',
                  border: on ? '0.5px solid var(--sage)' : '0.5px solid var(--line)' }}>{eq}</button>
              );
            })}
          </div>
        </StepShell>
      )}

      {/* PROTECT */}
      {step === 3 && (
        <StepShell footer={<PrimaryBtn onClick={next}>Continue</PrimaryBtn>}>
          <div className="tm-display" style={{ fontSize: 38, marginBottom: 8 }}>Anything to protect?</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 300, marginBottom: 24 }}>
            Flag what needs care. The coach will train around it — and you can always say more later.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {O.regions.map(r => {
              const on = protect.includes(r.id);
              return (
                <button key={r.id} className="tm-btn" onClick={() => toggle(protect, setProtect, r.id)} style={{
                  padding: '13px 18px', borderRadius: 14, fontSize: 14.5, fontWeight: 400,
                  display: 'flex', alignItems: 'center', gap: 9,
                  color: on ? 'var(--ink)' : 'var(--ink-soft)',
                  background: on ? 'var(--gold-tint)' : 'var(--surface)',
                  border: on ? '0.5px solid var(--gold)' : '0.5px solid var(--line)' }}>
                  {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)',
                    boxShadow: '0 0 6px var(--gold)' }} />}
                  {r.label}</button>
              );
            })}
          </div>
          {/* free-text: describe it in your own words */}
          <div style={{ marginTop: 26 }}>
            <div className="tm-kicker" style={{ marginBottom: 12 }}>In your own words · optional</div>
            <div className="tm-glass" style={{ borderRadius: 18, padding: '14px 16px',
              border: protectNote ? '0.5px solid var(--accent)' : undefined }}>
              <textarea value={protectNote} onChange={e => setProtectNote(e.target.value)} rows={3}
                placeholder={protect.length
                  ? 'e.g. Right hip is tight from desk sitting — sharp on deep squats. Lower back strain healing, about a week in.'
                  : 'Anything a coach should know — old injuries, surgeries, a joint that flares. Skip if there’s nothing.'}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none',
                  fontFamily: "'Jost', sans-serif", fontSize: 14.5, fontWeight: 300, color: 'var(--ink)',
                  lineHeight: 1.5, display: 'block' }} />
            </div>
          </div>

          <div className="tm-glass" style={{ marginTop: 14, borderRadius: 'var(--radius)', padding: '16px 18px',
            display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent-deep)', marginTop: 2 }}><IcSpark size={18} sw={1.4} /></span>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17.5, fontStyle: 'italic',
              color: 'var(--ink-soft)', lineHeight: 1.4, textWrap: 'pretty' }}>
              {(protect.length || protectNote.trim())
                ? 'Noted with care. I’ll keep these out of harm’s way and adapt every session to protect them.'
                : 'Nothing to flag? Wonderful. We’ll begin with a clean slate.'}</div>
          </div>
        </StepShell>
      )}

      {/* CONNECT HEALTH */}
      {step === 4 && (
        <StepShell footer={
          <>
            <PrimaryBtn onClick={() => onComplete({ level, health: true, protect, protectNote })}>
              {health ? 'Continue' : 'Connect Apple Health'}</PrimaryBtn>
            <button className="tm-btn" onClick={() => onComplete({ level, health: false, protect, protectNote })} style={{ width: '100%',
              height: 48, marginTop: 8, borderRadius: 16, background: 'transparent', border: 'none',
              color: 'var(--ink-soft)', fontSize: 14 }}>Maybe later</button>
          </>
        }>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px',
              borderRadius: 9999, background: 'var(--sage-tint)', border: '0.5px solid var(--sage)',
              color: 'var(--sage-deep)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              <IcHeart size={13} sw={1.6} /> Recovery</span>
          </div>
          <div className="tm-display" style={{ fontSize: 38, marginBottom: 8 }}>Train with your recovery</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic',
            color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.34 }}>
            Connect Apple Health and I’ll read your sleep, HRV and heart rate — so I know when to push and when to protect you.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {[
              { ic: <IcPulse size={20} sw={1.6} />, t: 'Sleep & HRV', d: 'Your readiness, read automatically each morning' },
              { ic: <IcHeart size={20} sw={1.6} />, t: 'Resting heart rate', d: 'Early signal of fatigue or a cold coming on' },
              { ic: <IcDumbbell size={20} sw={1.6} />, t: 'Workouts sync both ways', d: 'Temple sessions land in Apple Health too' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'var(--accent-tint)',
                  border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center' }}>{b.ic}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>{b.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 1 }}>{b.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 22, lineHeight: 1.45 }}>
            Private and on your device. The app works fully without it — connect whenever you’re ready.</div>
        </StepShell>
      )}
    </div>
  );
}

Object.assign(window, { OnboardingFlow });
