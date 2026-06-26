// log.jsx — fast set logging. Big targets, minimal taps, mid-workout friendly.

function Stepper({ label, value, unit, step, onChange, min = 0 }) {
  const press = (d) => onChange(Math.max(min, value + d * step));
  return (
    <div style={{ flex: 1 }}>
      <div className="tm-kicker" style={{ fontSize: 10.5, textAlign: 'center', marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button className="tm-btn" onClick={() => press(-1)} style={stepBtn}>
          <IcMinus size={24} sw={2} /></button>
        <div style={{ textAlign: 'center', minWidth: 0, flex: 1 }}>
          <span className="tm-display" style={{ fontSize: 46, lineHeight: 1, fontWeight: 500,
            fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          {unit && <span style={{ fontSize: 14, color: 'var(--ink-faint)', marginLeft: 4 }}>{unit}</span>}
        </div>
        <button className="tm-btn" onClick={() => press(1)} style={stepBtn}>
          <IcPlus size={24} sw={2} /></button>
      </div>
    </div>
  );
}
const stepBtn = {
  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
  background: 'var(--surface)', border: '0.5px solid var(--line)', boxShadow: 'var(--shadow-sm)',
  color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
};

function LogSheet({ exercise, logged = [], onLogSet, onAllLogged, onClose }) {
  const ex = exercise || TEMPLE_DATA.session.exercises[2];
  const startW = parseInt((ex.weight || '50').replace(/[^0-9]/g, '')) || 50;
  const startR = parseInt(ex.reps) || 8;
  const [weight, setWeight] = React.useState(startW);
  const [reps, setReps] = React.useState(startR);
  const [rir, setRir] = React.useState(2);
  const [flash, setFlash] = React.useState(false);
  const total = ex.sets || 3;
  const isPlus = (ex.weight || '').includes('+');

  const logSet = () => {
    const next = logged.length + 1;
    onLogSet && onLogSet({ weight, reps, rir, n: next });
    setFlash(true); setTimeout(() => setFlash(false), 700);
    if (next >= total && onAllLogged) onAllLogged();
  };
  const remaining = Math.max(0, total - logged.length);

  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(44,40,35,0.18)',
        backdropFilter: 'blur(2px)' }} />
      <div className="tm-glass tm-scroll" style={{ position: 'relative', borderRadius: '34px 34px 0 0',
        padding: '14px 22px 30px', maxHeight: '88%', overflowY: 'auto',
        animation: 'tm-rise 0.34s cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* grip */}
        <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--ink-ghost)',
          margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="tm-kicker" style={{ marginBottom: 6 }}>Log a set</div>
            <div className="tm-display" style={{ fontSize: 30, lineHeight: 1.05 }}>{ex.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, fontWeight: 300 }}>
              Target {ex.sets} × {ex.reps} @ {ex.weight}</div>
          </div>
          <button className="tm-btn" onClick={onClose} style={{ width: 44, height: 44, borderRadius: '50%',
            background: 'var(--surface)', border: '0.5px solid var(--line)', color: 'var(--ink-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcClose size={22} /></button>
        </div>

        {/* set dots */}
        <div style={{ display: 'flex', gap: 7, margin: '18px 0 22px' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 5,
              background: i < logged.length ? 'var(--accent-deep)' : 'var(--line)',
              boxShadow: i < logged.length ? '0 0 8px var(--accent)' : 'none',
              transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* steppers */}
        <div style={{ display: 'flex', gap: 14 }}>
          <Stepper label={isPlus ? 'Added weight' : 'Weight'} value={weight} unit={isPlus ? '+lb' : 'lb'}
            step={5} onChange={setWeight} />
          <div style={{ width: 1, background: 'var(--line)' }} />
          <Stepper label="Reps" value={reps} step={1} onChange={setReps} min={1} />
        </div>

        {/* RIR */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="tm-kicker" style={{ fontSize: 10.5 }}>Reps in reserve</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300, fontStyle: 'italic',
              fontFamily: "'Cormorant Garamond', serif", fontSize: 15 }}>
              {rir === 0 ? 'To failure' : rir >= 4 ? 'Plenty left' : 'In control'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0,1,2,3,4].map(n => (
              <button key={n} className="tm-btn" onClick={() => setRir(n)} style={{
                flex: 1, height: 52, borderRadius: 14, fontSize: 19, fontWeight: 400,
                fontFamily: "'Cormorant Garamond', serif",
                background: rir === n ? 'var(--accent-tint)' : 'var(--surface)',
                border: rir === n ? '0.5px solid var(--accent)' : '0.5px solid var(--line)',
                color: rir === n ? 'var(--ink)' : 'var(--ink-soft)',
                boxShadow: rir === n ? '0 0 0 0.5px var(--accent)' : 'none' }}>{n}{n === 4 ? '+' : ''}</button>
            ))}
          </div>
        </div>

        {/* log button */}
        <button className="tm-btn" onClick={logged.length >= total ? onClose : logSet} style={{ marginTop: 26, width: '100%', height: 62,
          borderRadius: 18, background: 'var(--accent-deep)', color: '#fff', fontSize: 17, fontWeight: 400,
          letterSpacing: '0.02em', boxShadow: flash ? '0 0 30px var(--accent)' : '0 8px 24px rgba(70,58,40,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'box-shadow 0.3s' }}>
          {flash ? <><IcCheck size={22} sw={2} /> Logged</>
            : logged.length >= total ? <><IcCheck size={22} sw={2} /> Done · back to session</>
            : <>Log set {logged.length + 1}{remaining ? ` · ${remaining} to go` : ''}</>}
        </button>

        {/* history */}
        {logged.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div className="tm-divider" style={{ marginBottom: 14 }} />
            {logged.slice().reverse().map((s) => (
              <div key={s.n} className="tm-fade" style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 0', fontSize: 14.5 }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-tint)',
                  border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</span>
                <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.weight}{isPlus ? '+' : ''} lb × {s.reps}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-faint)' }}>{s.rir} RIR</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LogSheet });
