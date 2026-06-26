// formcheck.jsx — upload/film a set → AI form analysis. Gated behind Temple Pro.

const PRO_BENEFITS = [
  'Animated movement demos for every lift in your plan',
  'Film a set or upload a clip — the coach reads your bar path, depth and bracing',
  'Two or three specific cues to lift safer and stronger',
];

// A believable, exercise-aware analysis result.
function analysisFor(ex) {
  const name = ex ? ex.name : 'your set';
  return {
    score: 'Clean',
    summary: `Solid, controlled work on ${name.toLowerCase()}. Nothing here worries me — two small refinements and it’s dialled in.`,
    cues: [
      { tone: 'good', text: 'Smooth, even tempo — no rushing the lowering phase.' },
      { tone: 'watch', text: 'Ribs flare slightly at lockout. Brace your core and keep them stacked over your hips.' },
      { tone: 'watch', text: 'A touch of shoulder shrug near the top — keep the traps down and long.' },
    ],
    closing: 'Send this to your coach and I’ll fold the cues into your next session.',
  };
}

function FormCheckSheet({ exercise, pro, onUnlock, onClose, onSendToCoach, initialStage }) {
  const [stage, setStage] = React.useState(initialStage || (pro ? 'capture' : 'paywall'));
  const [hasClip, setHasClip] = React.useState(false);
  const res = analysisFor(exercise);

  React.useEffect(() => {
    if (stage === 'analyzing') {
      const id = setTimeout(() => setStage('result'), 2400);
      return () => clearTimeout(id);
    }
  }, [stage]);

  const title = exercise ? exercise.name : 'Form check';
  const sendToCoach = () => {
    const cue = (res.cues.find(c => c.tone !== 'good') || res.cues[0] || {}).text || '';
    const msg = `I ran a form check on ${title.toLowerCase()} — ${res.score.toLowerCase()} overall. The main thing to refine: ${cue}`;
    if (onSendToCoach) onSendToCoach(msg); else onClose();
  };

  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 75, display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(44,40,35,0.2)',
        backdropFilter: 'blur(2px)' }} />
      <div className="tm-glass tm-scroll" style={{ position: 'relative', borderRadius: '34px 34px 0 0',
        padding: '14px 22px 30px', maxHeight: '92%', overflowY: 'auto',
        animation: 'tm-rise 0.34s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--ink-ghost)', margin: '0 auto 18px' }} />

        {/* ── PAYWALL ── */}
        {stage === 'paywall' && (
          <div className="tm-rise">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px',
                borderRadius: 9999, background: 'var(--gold-tint)', border: '0.5px solid var(--gold)',
                color: 'var(--gold-deep)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                <IcSpark size={13} sw={1.5} /> Form Focus Pro</span>
            </div>
            <div className="tm-display" style={{ fontSize: 38, lineHeight: 1.05 }}>Form analysis</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic',
              color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.35 }}>
              An extra set of eyes on every rep — so you build strength without building bad habits.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '24px 0 8px' }}>
              {PRO_BENEFITS.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: 'var(--accent-tint)', border: '0.5px solid var(--accent)',
                    color: 'var(--accent-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IcCheck size={14} sw={2} /></span>
                  <span style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 300, lineHeight: 1.4 }}>{b}</span>
                </div>
              ))}
            </div>

            <div className="tm-card" style={{ padding: '16px 18px', margin: '20px 0 18px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, color: 'var(--ink)' }}>Form Focus Pro</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 2 }}>
                  Demos + unlimited form checks · cancel anytime</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="tm-display" style={{ fontSize: 26, lineHeight: 1 }}>$9<span style={{ fontSize: 15, color: 'var(--ink-faint)' }}>/mo</span></div>
              </div>
            </div>

            <button className="tm-btn" onClick={() => { onUnlock(); setStage('capture'); }} style={{
              width: '100%', height: 58, borderRadius: 18, fontSize: 16.5, color: '#fff',
              background: 'var(--accent-deep)', boxShadow: '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)' }}>
              Start 7-day free trial</button>
            <button className="tm-btn" onClick={onClose} style={{ width: '100%', height: 48, marginTop: 8,
              borderRadius: 16, background: 'transparent', border: 'none', color: 'var(--ink-soft)', fontSize: 14 }}>
              Maybe later</button>
          </div>
        )}

        {/* ── CAPTURE ── */}
        {stage === 'capture' && (
          <div className="tm-rise">
            <div className="tm-kicker" style={{ marginBottom: 6 }}>{exercise ? 'Form check' : 'Temple Pro'}</div>
            <div className="tm-display" style={{ fontSize: 32, lineHeight: 1.05 }}>{title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 6 }}>
              Film one clean set from the side, or upload a recent clip.</div>

            {/* video drop zone (placeholder) */}
            <div onClick={() => setHasClip(true)} className="tm-tap" style={{ marginTop: 20, height: 230,
              borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden',
              border: hasClip ? '1px solid var(--accent)' : '1.5px dashed var(--ink-ghost)',
              background: hasClip
                ? 'var(--accent-tint)'
                : 'repeating-linear-gradient(135deg, rgba(44,40,35,0.025) 0 10px, rgba(44,40,35,0.05) 10px 20px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              {hasClip ? (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-deep)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px var(--accent)' }}><IcCheck size={28} sw={2} /></div>
                  <div style={{ fontSize: 14.5, color: 'var(--ink)' }}>set_3_incline.mov</div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink-faint)' }}>
                    0:08 · 1080×1920 · ready</div>
                </>
              ) : (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface)',
                    border: '0.5px solid var(--line)', color: 'var(--ink-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcPlus size={26} /></div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ink-faint)',
                    letterSpacing: '0.04em' }}>tap to add a clip</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="tm-btn" onClick={() => setHasClip(true)} style={{ flex: 1, height: 52,
                borderRadius: 16, background: 'var(--surface)', border: '0.5px solid var(--line)',
                color: 'var(--ink)', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <IcWave size={20} /> Film a set</button>
              <button className="tm-btn" onClick={() => setHasClip(true)} style={{ flex: 1, height: 52,
                borderRadius: 16, background: 'var(--surface)', border: '0.5px solid var(--line)',
                color: 'var(--ink)', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <IcPlus size={20} /> Upload</button>
            </div>

            <button className="tm-btn" disabled={!hasClip} onClick={() => setStage('analyzing')} style={{
              width: '100%', height: 58, marginTop: 16, borderRadius: 18, fontSize: 16.5,
              color: '#fff', background: hasClip ? 'var(--accent-deep)' : 'var(--ink-ghost)', opacity: hasClip ? 1 : 0.7,
              boxShadow: hasClip ? '0 0 24px var(--accent)' : 'none' }}>
              Analyze my form</button>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {stage === 'analyzing' && (
          <div className="tm-fade" style={{ padding: '40px 0 56px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 70%)',
                animation: 'tm-breathe 2.2s ease-in-out infinite' }} />
              <div style={{ position: 'relative', display: 'flex', gap: 5, alignItems: 'center', height: 44 }}>
                {[20,34,44,28,40,24].map((h, i) => (
                  <span key={i} style={{ width: 4, borderRadius: 4, background: 'var(--accent-deep)',
                    height: h, animation: `tm-breathe ${0.7 + (i%3)*0.2}s ease-in-out ${i*0.09}s infinite` }} />
                ))}
              </div>
            </div>
            <div className="tm-kicker" style={{ marginBottom: 10 }}>Reading your movement</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic',
              color: 'var(--ink-soft)', textAlign: 'center', maxWidth: 280 }}>
              Tracking bar path, depth and bracing…</div>
          </div>
        )}

        {/* ── RESULT ── */}
        {stage === 'result' && (
          <div className="tm-rise">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="tm-kicker" style={{ marginBottom: 6 }}>{exercise ? `Form check · ${title}` : 'Form check'}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <div className="tm-display" style={{ fontSize: 34 }}>{res.score}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5,
                    color: 'var(--sage-deep)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)',
                      boxShadow: '0 0 6px var(--sage)' }} /> reviewed</span>
                </div>
              </div>
              <button className="tm-btn" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%',
                background: 'var(--surface)', border: '0.5px solid var(--line)', color: 'var(--ink-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={20} /></button>
            </div>

            <div style={{ fontSize: 15, color: 'var(--ink-soft)', fontWeight: 300, lineHeight: 1.5,
              marginTop: 12, textWrap: 'pretty' }}>{res.summary}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              {res.cues.map((c, i) => {
                const good = c.tone === 'good';
                const hue = good ? 'sage' : 'gold';
                return (
                  <div key={i} className="tm-card" style={{ padding: '14px 16px', display: 'flex', gap: 12,
                    alignItems: 'flex-start' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: `var(--${hue}-tint)`, border: `0.5px solid var(--${hue})`,
                      color: `var(--${hue}-deep)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13 }}>{good ? <IcCheck size={14} sw={2} /> : '!'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: 'var(--ink-faint)', marginBottom: 3 }}>{good ? 'Strong' : 'Refine'}</div>
                      <div style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 300, lineHeight: 1.4 }}>{c.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tm-glass" style={{ marginTop: 16, borderRadius: 'var(--radius)', padding: '14px 16px',
              display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent-deep)', marginTop: 1, flexShrink: 0 }}><IcSpark size={17} sw={1.4} /></span>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: 'italic',
                color: 'var(--ink-soft)', lineHeight: 1.35, textWrap: 'pretty' }}>{res.closing}</div>
            </div>

            <button className="tm-btn" onClick={sendToCoach} style={{ width: '100%', height: 56, marginTop: 16,
              borderRadius: 18, fontSize: 16, color: '#fff', background: 'var(--accent-deep)',
              boxShadow: '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)' }}>
              Send to coach</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { FormCheckSheet });
