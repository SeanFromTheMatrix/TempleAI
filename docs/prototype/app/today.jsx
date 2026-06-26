// today.jsx — the current session as a serene, tappable checklist.

function ExerciseRow({ ex, onToggle, onOpenLog, onOptions, coachMode }) {
  const done = ex.done;
  const [revealed, setRevealed] = React.useState(false);
  const cueOpen = coachMode !== 'assist' || revealed;
  return (
    <div className="tm-tap" onClick={() => onOpenLog(ex)} style={{
      display: 'flex', gap: 15, alignItems: 'flex-start', padding: '18px 4px',
      opacity: done ? 0.6 : 1, transition: 'opacity 0.3s' }}>
      {/* check target — large */}
      <button className="tm-btn" onClick={(e) => { e.stopPropagation(); onToggle(ex.id); }} aria-label="Toggle complete"
        style={{ width: 30, height: 30, marginTop: 2, borderRadius: '50%', flexShrink: 0,
          background: done ? 'var(--accent-deep)' : 'transparent',
          border: done ? 'none' : '1.5px solid var(--ink-ghost)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: done ? '0 0 12px var(--accent)' : 'none' }}>
        {done && <IcCheck size={17} sw={2} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--ink)',
              textDecorationLine: done ? 'line-through' : 'none', textDecorationColor: 'var(--ink-ghost)' }}>{ex.name}</span>
            {ex.swapped && <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--accent-deep)', background: 'var(--accent-tint)', border: '0.5px solid var(--accent)',
              borderRadius: 9999, padding: '2px 7px', flexShrink: 0 }}>swapped</span>}
            {ex.userAdded && <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--sage-deep)', background: 'var(--sage-tint)', border: '0.5px solid var(--sage)',
              borderRadius: 9999, padding: '2px 7px', flexShrink: 0 }}>yours</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>
              {ex.sets} × {ex.reps}</span>
            <button className="tm-btn" onClick={(e) => { e.stopPropagation(); onOptions(ex); }} aria-label="Options"
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: 'none',
                color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: -4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
              </svg>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
          <span style={{ fontSize: 14, color: 'var(--accent-deep)', fontWeight: 500 }}>{ex.weight}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-ghost)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 300 }}>{ex.sets} sets</span>
          {!ex.swapped && ex.last && (
            <span title="Your top set last time" style={{ marginLeft: 'auto', display: 'inline-flex',
              alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--ink-faint)' }}>Last</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 400,
                fontVariantNumeric: 'tabular-nums' }}>{ex.last}</span>
            </span>
          )}
        </div>
        {!done && !ex.swapped && ex.details && ex.details.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
            {ex.details.map((d, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7,
                padding: '5px 11px', borderRadius: 10, background: 'var(--surface)',
                border: '0.5px solid var(--line)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <span style={{ fontSize: 9, letterSpacing: '0.13em', textTransform: 'uppercase',
                  color: 'var(--ink-faint)' }}>{d.k}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 400 }}>{d.v}</span>
              </span>
            ))}
          </div>
        )}
        {!done && (cueOpen ? (
          <div style={{ marginTop: 9, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <span style={{ marginTop: 2, color: 'var(--accent)', flexShrink: 0 }}><IcSpark size={13} sw={1.4} /></span>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16.5, fontStyle: 'italic',
              color: 'var(--ink-soft)', lineHeight: 1.35, textWrap: 'pretty' }}>{ex.cue}</div>
          </div>
        ) : (
          <button className="tm-btn" onClick={(e) => { e.stopPropagation(); setRevealed(true); }} style={{
            marginTop: 9, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px',
            borderRadius: 9999, background: 'transparent', border: '0.5px solid var(--line)',
            color: 'var(--ink-faint)', fontSize: 12 }}>
            <IcSpark size={12} sw={1.4} /> Form cue</button>
        ))}
      </div>
    </div>
  );
}

function ExerciseActionSheet({ ex, onClose, onSwap, onHurt, onSkip, onFormCheck, onDemo }) {
  const opts = [
    { id: 'demo', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/></svg>,
      title: 'See the movement', desc: 'Watch a looped demo of this lift', hue: 'sage', pro: true, fn: onDemo },
    { id: 'swap', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h12l-3-3M20 16H8l3 3"/></svg>,
      title: 'Swap this movement', desc: ex.alt ? `Coach suggests ${ex.alt.name}` : 'Coach picks an alternative', hue: 'sky', fn: onSwap },
    { id: 'hurt', icon: <IcLeaf size={22} sw={1.6} />,
      title: 'Something doesn’t feel right', desc: 'Flag it — I’ll ease this and keep an eye on it', hue: 'gold', fn: onHurt },
    { id: 'skip', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5v14M17 5l-7 7 7 7"/></svg>,
      title: 'Skip for today', desc: 'Remove from this session — no guilt', hue: 'lavender', fn: onSkip },
    { id: 'form', icon: <IcWave size={22} sw={1.6} />,
      title: 'Film a set · form check', desc: 'AI form analysis', hue: 'sky', pro: true, fn: onFormCheck },
  ];
  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 72, display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(44,40,35,0.2)',
        backdropFilter: 'blur(2px)' }} />
      <div className="tm-glass" style={{ position: 'relative', borderRadius: '34px 34px 0 0', padding: '14px 20px 28px',
        animation: 'tm-rise 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--ink-ghost)', margin: '0 auto 16px' }} />
        <div className="tm-kicker" style={{ marginBottom: 5 }}>Adjust</div>
        <div className="tm-display" style={{ fontSize: 28, marginBottom: 16 }}>{ex.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opts.map(o => (
            <button key={o.id} className="tm-btn" onClick={o.fn} style={{ display: 'flex', alignItems: 'center',
              gap: 14, padding: '15px 16px', borderRadius: 16, textAlign: 'left', background: 'var(--surface)',
              border: '0.5px solid var(--line)' }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `var(--${o.hue}-tint)`,
                border: `0.5px solid var(--${o.hue})`, color: `var(--${o.hue}-deep)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{o.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15.5, color: 'var(--ink)' }}>{o.title}</span>
                  {o.pro && <span style={{ fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--gold-deep)', background: 'var(--gold-tint)', border: '0.5px solid var(--gold)',
                    borderRadius: 9999, padding: '2px 7px' }}>Pro</span>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 2 }}>{o.desc}</div>
              </div>
              <span style={{ color: 'var(--ink-ghost)' }}><IcChevR size={18} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoachNotice({ text, actionLabel, onAction, onClose }) {
  return (
    <div className="tm-fade" style={{ padding: '0 24px 4px' }}>
      <div className="tm-glass" style={{ borderRadius: 'var(--radius)', padding: '13px 14px', display: 'flex',
        gap: 11, alignItems: 'flex-start' }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 1,
          background: 'var(--accent-tint)', border: '0.5px solid var(--accent)', color: 'var(--accent-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcSpark size={14} sw={1.4} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: 'italic',
            color: 'var(--ink-soft)', lineHeight: 1.35, textWrap: 'pretty' }}>{text}</div>
          {actionLabel && (
            <button className="tm-btn" onClick={onAction} style={{ marginTop: 10, display: 'inline-flex',
              alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9999, background: 'var(--surface)',
              border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', fontSize: 13 }}>{actionLabel}</button>
          )}
        </div>
        <button className="tm-btn" onClick={onClose} style={{ width: 26, height: 26, borderRadius: '50%',
          background: 'transparent', border: 'none', color: 'var(--ink-faint)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={16} /></button>
      </div>
    </div>
  );
}

function AddStepper({ label, value, onDec, onInc, min }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
      <span style={{ fontSize: 15.5, color: 'var(--ink)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="tm-btn" onClick={onDec} disabled={value <= min} aria-label={`Fewer ${label}`}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)',
            border: '0.5px solid var(--line)', color: value <= min ? 'var(--ink-ghost)' : 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcMinus size={18} sw={2} /></button>
        <span style={{ minWidth: 28, textAlign: 'center', fontSize: 19, color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <button className="tm-btn" onClick={onInc} aria-label={`More ${label}`}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)',
            border: '0.5px solid var(--line)', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcPlus size={18} sw={2} /></button>
      </div>
    </div>
  );
}

// Manual add: search/browse the library → set sets · reps · weight → into the session.
function AddExerciseSheet({ onClose, onAdd }) {
  const lib = TEMPLE_DATA.library;
  const [query, setQuery] = React.useState('');
  const [pick, setPick] = React.useState(null);   // chosen { name, last }
  const [sets, setSets] = React.useState(3);
  const [reps, setReps] = React.useState('10');
  const [weight, setWeight] = React.useState('');

  const q = query.trim().toLowerCase();
  const groups = lib.map(g => ({ ...g, items: g.items.filter(it => it.name.toLowerCase().includes(q)) }))
    .filter(g => g.items.length);
  const noResults = q && groups.length === 0;

  const choose = (it) => {
    setPick(it);
    setWeight(it.last ? it.last.split('×')[0].trim() : '');
  };
  const confirm = () => onAdd({ name: pick.name, sets, reps, weight: weight.trim() || '—', last: pick.last });

  const inputStyle = { border: 'none', background: 'transparent', outline: 'none',
    fontFamily: "'Jost', sans-serif", fontSize: 16, fontWeight: 400, color: 'var(--ink)',
    textAlign: 'right', width: 90 };

  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 74, display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(44,40,35,0.22)',
        backdropFilter: 'blur(2px)' }} />
      <div className="tm-glass" style={{ position: 'relative', borderRadius: '34px 34px 0 0',
        height: pick ? 'auto' : '82%', maxHeight: '88%', display: 'flex', flexDirection: 'column',
        animation: 'tm-rise 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ flexShrink: 0, padding: '14px 22px 8px' }}>
          <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--ink-ghost)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="tm-kicker" style={{ marginBottom: 5 }}>{pick ? 'Set it up' : 'Add a movement'}</div>
              <div className="tm-display" style={{ fontSize: 27 }}>{pick ? pick.name : 'Your choice today'}</div>
            </div>
            <button className="tm-btn" onClick={pick ? () => setPick(null) : onClose} aria-label={pick ? 'Back' : 'Close'}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)',
                border: '0.5px solid var(--line)', color: 'var(--ink-soft)', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
              {pick ? <IcChevL size={22} /> : <IcClose size={20} />}</button>
          </div>
        </div>

        {!pick ? (
          <>
            <div style={{ flexShrink: 0, padding: '8px 22px 12px' }}>
              <div className="tm-glass" style={{ borderRadius: 14, padding: '0 14px', display: 'flex',
                alignItems: 'center', gap: 10, height: 48 }}>
                <span style={{ color: 'var(--ink-faint)' }}><IcSearch size={19} sw={1.6} /></span>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search movements"
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none',
                    fontFamily: "'Jost', sans-serif", fontSize: 15.5, fontWeight: 300, color: 'var(--ink)', minWidth: 0 }} />
                {query && <button className="tm-btn" onClick={() => setQuery('')} aria-label="Clear" style={{ width: 26,
                  height: 26, borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--ink-faint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={15} /></button>}
              </div>
            </div>
            <div className="tm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 22px', minHeight: 0 }}>
              {noResults ? (
                <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: 'italic',
                    color: 'var(--ink-soft)', lineHeight: 1.4, maxWidth: 270, margin: '0 auto 18px', textWrap: 'pretty' }}>
                    No movement by that name in the library. Add it as a custom lift?</div>
                  <button className="tm-btn" onClick={() => choose({ name: query.trim().replace(/\b\w/g, c => c.toUpperCase()), last: null })}
                    style={{ height: 48, padding: '0 20px', borderRadius: 14, background: 'var(--accent-tint)',
                      border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', fontSize: 14.5,
                      display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <IcPlus size={17} sw={1.7} /> Add “{query.trim()}”</button>
                </div>
              ) : groups.map(g => (
                <div key={g.group} style={{ marginTop: 16 }}>
                  <div className="tm-kicker" style={{ marginBottom: 4 }}>{g.group}</div>
                  {g.items.map((it, i) => (
                    <React.Fragment key={it.name}>
                      <button className="tm-btn" onClick={() => choose(it)} style={{ width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', background: 'transparent',
                        border: 'none' }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--surface)',
                          border: '0.5px solid var(--line)', color: 'var(--ink-soft)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center' }}><IcDumbbell size={17} sw={1.5} /></span>
                        <span style={{ flex: 1, fontSize: 15.5, color: 'var(--ink)' }}>{it.name}</span>
                        {it.last
                          ? <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>
                              Last {it.last}</span>
                          : <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: 'var(--ink-ghost)' }}>New</span>}
                        <span style={{ color: 'var(--ink-ghost)', marginLeft: 4 }}><IcPlus size={18} sw={1.7} /></span>
                      </button>
                      {i < g.items.length - 1 && <div className="tm-divider" style={{ opacity: 0.45 }} />}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="tm-rise" style={{ padding: '6px 24px 26px' }}>
            {pick.last && (
              <div className="tm-glass" style={{ borderRadius: 14, padding: '11px 14px', display: 'flex',
                alignItems: 'center', gap: 9, marginBottom: 6 }}>
                <span style={{ color: 'var(--accent-deep)' }}><IcSpark size={15} sw={1.5} /></span>
                <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  You last did this at <strong style={{ fontWeight: 500, color: 'var(--ink)' }}>{pick.last}</strong></span>
              </div>
            )}
            <AddStepper label="Sets" value={sets} min={1} onDec={() => setSets(s => Math.max(1, s - 1))}
              onInc={() => setSets(s => s + 1)} />
            <div className="tm-divider" style={{ opacity: 0.5 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
              <span style={{ fontSize: 15.5, color: 'var(--ink)' }}>Reps</span>
              <input value={reps} onChange={e => setReps(e.target.value)} inputMode="numeric"
                placeholder="10" style={inputStyle} />
            </div>
            <div className="tm-divider" style={{ opacity: 0.5 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
              <span style={{ fontSize: 15.5, color: 'var(--ink)' }}>Weight</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <input value={weight} onChange={e => setWeight(e.target.value)}
                  placeholder="—" style={{ ...inputStyle, width: 64 }} />
                <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>lb</span>
              </div>
            </div>
            <div className="tm-divider" style={{ opacity: 0.5 }} />
            <button className="tm-btn" onClick={confirm} style={{ width: '100%', height: 56, marginTop: 20,
              borderRadius: 16, fontSize: 16, fontWeight: 400, color: '#fff', background: 'var(--accent-deep)',
              boxShadow: '0 0 22px var(--accent), 0 8px 22px rgba(70,58,40,0.12)' }}>Add to today</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TodayScreen({ exs, setExs, onOpenLog, onFormCheck, onDemo, coachMode, firstRun, onOpenCoach, onFinish, onGoBody }) {
  const [actionEx, setActionEx] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const s = TEMPLE_DATA.session;
  const note = (text, actionLabel, onAction) => setNotice(actionLabel ? { text, actionLabel, onAction } : { text });

  if (firstRun) {
    return (
      <EmptyState hue="sky" icon={<IcToday size={32} sw={1.4} />} kicker="Today"
        title="No session yet"
        line="Your coach authors each day around how you’re feeling. Have a quick word and today’s work will appear here."
        action={<><IcCoach size={19} sw={1.6} /> Talk to your coach</>} onAction={onOpenCoach} />
    );
  }

  const done = exs.filter(e => e.done).length;
  const pct = exs.length ? done / exs.length : 0;
  const toggle = (id) => setExs(xs => xs.map(x => x.id === id ? { ...x, done: !x.done } : x));

  const swap = (ex) => {
    if (!ex.alt) {
      note(`There’s no preset swap for ${ex.name} — you added it, so it’s your call. Tell me what you’d rather do and I’ll slot it in and keep the rest intact.`,
        'Tell the coach', () => { setNotice(null); onOpenCoach && onOpenCoach(); });
      setActionEx(null);
      return;
    }
    setExs(xs => xs.map(x => x.id === ex.id
      ? { ...x, name: ex.alt.name, sets: ex.alt.sets, reps: ex.alt.reps, weight: ex.alt.weight,
          cue: ex.alt.cue, swapped: true, alt: null } : x));
    note(ex.alt.why); setActionEx(null);
  };
  const hurt = (ex) => {
    if (ex.alt) {
      setExs(xs => xs.map(x => x.id === ex.id
        ? { ...x, name: ex.alt.name, sets: ex.alt.sets, reps: ex.alt.reps, weight: ex.alt.weight,
            cue: ex.alt.cue, swapped: true, alt: null } : x));
    }
    note(`Thank you for telling me. I’ve eased ${ex.name} into something kinder and noted it — we protect the joint, always. Want to track it in Body?`,
      'Track in Body', () => { setNotice(null); onGoBody && onGoBody(); });
    setActionEx(null);
  };
  const skip = (ex) => {
    setExs(xs => xs.filter(x => x.id !== ex.id));
    note(`Skipped ${ex.name}. One movement won’t make or break you — rest it and we go again next time.`);
    setActionEx(null);
  };
  const formCheck = (ex) => { setActionEx(null); onFormCheck && onFormCheck(ex); };
  const demo = (ex) => { setActionEx(null); onDemo && onDemo(ex); };

  const addExercise = ({ name, sets, reps, weight, last }) => {
    const id = 'u' + Date.now();
    setExs(xs => [...xs, { id, name, sets, reps, weight: weight === '—' ? '—' : `${weight} lb`,
      last, cue: 'Your call — own it. Clean reps, honest effort.', userAdded: true, done: false }]);
    setAdding(false);
    note(`Added ${name} to today. I’ll fold it into your programming and start tracking it — noted that you want this in the rotation.`);
  };

  return (
    <div className="tm-scroll" style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
      <ScreenHeader kicker="Today · Authored by Temple" title={s.title} />

      {notice && <CoachNotice text={notice.text} actionLabel={notice.actionLabel} onAction={notice.onAction} onClose={() => setNotice(null)} />}

      {/* progress hero */}
      <div style={{ padding: '8px 24px 0' }}>
        <div className="tm-glass" style={{ borderRadius: 'var(--radius-lg)', padding: 22, display: 'flex',
          alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden' }}>
          <Halo hue="sky" size={200} opacity={0.4} style={{ right: -60, top: -70 }} />
          <ProgressRing value={pct} size={96} stroke={7}>
            <span className="tm-display" style={{ fontSize: 30, lineHeight: 1 }}>{Math.round(pct*100)}</span>
            <span style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>PERCENT</span>
          </ProgressRing>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 400 }}>
              {done} of {exs.length} complete</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic',
              color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.3, textWrap: 'pretty' }}>{s.note}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 9, fontWeight: 300 }}>
              ~{s.durationMin} min · {exs.length} movements</div>
          </div>
        </div>
      </div>

      {/* checklist */}
      <div style={{ padding: '8px 24px 0' }}>
        <div className="tm-kicker" style={{ padding: '20px 0 6px' }}>The work</div>
        {exs.map((ex, i) => (
          <React.Fragment key={ex.id}>
            <ExerciseRow ex={ex} onToggle={toggle} onOpenLog={onOpenLog} onOptions={setActionEx} coachMode={coachMode} />
            {i < exs.length - 1 && <div className="tm-divider" style={{ opacity: 0.6 }} />}
          </React.Fragment>
        ))}
        {/* manual add — your gym, your call */}
        <button className="tm-btn" onClick={() => setAdding(true)} style={{ width: '100%', marginTop: 16,
          height: 54, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          background: 'var(--surface)', border: '0.5px dashed var(--ink-ghost)', color: 'var(--ink-soft)',
          fontSize: 15 }}>
          <IcPlus size={20} sw={1.7} /> Add an exercise</button>
      </div>

      <div style={{ padding: '24px 24px 8px' }}>
        {pct === 1 ? (
          <button className="tm-btn" onClick={onFinish} style={{ width: '100%', height: 58, borderRadius: 18,
            fontSize: 16.5, fontWeight: 400, letterSpacing: '0.02em', color: '#fff', background: 'var(--accent-deep)',
            boxShadow: '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <IcCheck size={20} sw={2} /> Finish &amp; save session</button>
        ) : (
          <div style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 19,
            fontStyle: 'italic', color: 'var(--ink-faint)' }}>Tap a movement to log, or ··· to adjust.</div>
        )}
      </div>

      {actionEx && <ExerciseActionSheet ex={actionEx} onClose={() => setActionEx(null)}
        onSwap={() => swap(actionEx)} onHurt={() => hurt(actionEx)} onSkip={() => skip(actionEx)}
        onFormCheck={() => formCheck(actionEx)} onDemo={() => demo(actionEx)} />}
      {adding && <AddExerciseSheet onClose={() => setAdding(false)} onAdd={addExercise} />}
    </div>
  );
}

// The end-of-session summary — recap, a coach reflection, optional share, save to history.
function SessionSummarySheet({ exs, logs, onClose, onSave }) {
  const s = TEMPLE_DATA.session;
  const done = exs.filter(e => e.done);
  const setsLogged = Object.values(logs).reduce((a, b) => a + b.length, 0);
  const volume = Object.values(logs).reduce((a, sets) =>
    a + sets.reduce((x, st) => x + (parseInt(st.weight) || 0) * (parseInt(st.reps) || 0), 0), 0);
  const [shared, setShared] = React.useState(false);

  const Stat = ({ big, sub }) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div className="tm-display" style={{ fontSize: 28, lineHeight: 1 }}>{big}</div>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)',
        marginTop: 6 }}>{sub}</div>
    </div>
  );
  const Sep = () => <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />;

  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 78, display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(44,40,35,0.22)',
        backdropFilter: 'blur(2px)' }} />
      <div className="tm-glass tm-scroll" style={{ position: 'relative', borderRadius: '34px 34px 0 0',
        padding: '14px 22px 28px', maxHeight: '92%', overflowY: 'auto',
        animation: 'tm-rise 0.34s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--ink-ghost)', margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 84, height: 84, marginBottom: 12, display: 'flex',
            alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 70%)',
              animation: 'tm-breathe 4s ease-in-out infinite' }} />
            <div style={{ position: 'relative', width: 58, height: 58, borderRadius: '50%', background: 'var(--accent-tint)',
              border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}><IcCheck size={28} sw={1.8} /></div>
          </div>
          <div className="tm-kicker" style={{ marginBottom: 8 }}>Session complete</div>
          <div className="tm-display" style={{ fontSize: 30, lineHeight: 1.05 }}>{s.title}</div>
        </div>

        <div className="tm-glass" style={{ borderRadius: 'var(--radius-lg)', padding: '18px 12px', marginTop: 18,
          display: 'flex', alignItems: 'center' }}>
          <Stat big={done.length} sub="Movements" />
          <Sep />
          <Stat big={setsLogged} sub="Sets logged" />
          <Sep />
          <Stat big={'~' + s.durationMin} sub="Minutes" />
          {volume > 0 && <><Sep /><Stat big={(volume / 1000).toFixed(1) + 'k'} sub="Volume lb" /></>}
        </div>

        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginTop: 16, padding: '0 2px' }}>
          <span style={{ color: 'var(--accent-deep)', marginTop: 2, flexShrink: 0 }}><IcSpark size={17} sw={1.4} /></span>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18.5, fontStyle: 'italic',
            color: 'var(--ink-soft)', lineHeight: 1.4, textWrap: 'pretty' }}>
            That’s the work that builds toward 200 lean — honest sets, nothing wasted. I’ve logged it and I’ll read it into your next session.</div>
        </div>

        <button className="tm-btn" onClick={() => setShared(v => !v)} style={{ width: '100%', marginTop: 18,
          padding: '14px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left',
          background: shared ? 'var(--accent-tint)' : 'var(--surface)',
          border: shared ? '0.5px solid var(--accent)' : '0.5px solid var(--line)' }}>
          <span style={{ width: 44, height: 26, borderRadius: 9999, flexShrink: 0, position: 'relative',
            background: shared ? 'var(--accent-deep)' : 'var(--ink-ghost)', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: 3, left: shared ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, color: 'var(--ink)' }}>Share to your circle</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 1 }}>
              Your friends see that you trained — never the numbers.</div>
          </div>
        </button>

        <button className="tm-btn" onClick={() => onSave({ shared })} style={{ width: '100%', height: 58, marginTop: 14,
          borderRadius: 18, fontSize: 16.5, fontWeight: 400, color: '#fff', background: 'var(--accent-deep)',
          boxShadow: '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)' }}>Save session</button>
        <button className="tm-btn" onClick={onClose} style={{ width: '100%', height: 46, marginTop: 8, borderRadius: 14,
          background: 'transparent', border: 'none', color: 'var(--ink-soft)', fontSize: 14 }}>Not yet</button>
      </div>
    </div>
  );
}

Object.assign(window, { TodayScreen, SessionSummarySheet });
