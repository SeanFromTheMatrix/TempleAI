// auth.jsx — the threshold. Crossing into the temple: sign in, quietly.

function ProviderButton({ icon, label, dark, onClick, busy }) {
  return (
    <button className={'tm-btn ' + (dark ? 'tm-provider-dark' : 'tm-provider-light')} onClick={onClick} disabled={busy} style={{
      width: '100%', height: 56, borderRadius: 16, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 11, fontSize: 16, fontWeight: 400, letterSpacing: '0.01em',
      opacity: busy ? 0.55 : 1 }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}

// A monochrome "G" letterform — a letter, not a brand logo.
function GoogleGlyph({ size = 21 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', border: '1.5px solid var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif",
      fontSize: size * 0.66, fontWeight: 500, lineHeight: 1, color: 'var(--ink)' }}>G</span>
  );
}

function CodeDots({ len, total = 6 }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < len, active = i === len;
        return (
          <div key={i} style={{ width: 44, height: 56, borderRadius: 14,
            background: filled ? 'var(--accent-tint)' : 'var(--surface)',
            border: active ? '1.5px solid var(--accent-deep)' : filled ? '0.5px solid var(--accent)' : '0.5px solid var(--line)',
            boxShadow: active ? '0 0 12px var(--accent)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            {filled && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-deep)',
              boxShadow: '0 0 7px var(--accent)' }} />}
          </div>
        );
      })}
    </div>
  );
}

function AuthFlow({ onComplete, returning = true }) {
  // step: 'welcome' | 'email' | 'code'
  const [step, setStep] = React.useState('welcome');
  const [busy, setBusy] = React.useState(null); // which provider is 'connecting'
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');

  const provider = (id) => {
    setBusy(id);
    setTimeout(() => onComplete({ method: id, returning: false }), 950);
  };

  // simulate the code arriving + auto-filling as you'd tap a keypad
  React.useEffect(() => {
    if (step !== 'code') return;
    setCode('');
    let n = 0;
    const id = setInterval(() => {
      n += 1; setCode('•'.repeat(n));
      if (n >= 6) { clearInterval(id); setTimeout(() => onComplete({ method: 'email', returning: false }), 600); }
    }, 360);
    return () => clearInterval(id);
  }, [step]);

  const emailValid = /\S+@\S+\.\S+/.test(email);

  return (
    <div className="tm-marble" style={{ height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden' }}>
      {/* shaft of temple light */}
      <div style={{ position: 'absolute', top: -60, left: '12%', width: 180, height: 380,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.75), rgba(255,255,255,0))',
        transform: 'rotate(18deg)', filter: 'blur(26px)', pointerEvents: 'none' }} />

      {/* back affordance for the sub-steps */}
      <div style={{ paddingTop: 60, padding: '60px 28px 0', position: 'relative', zIndex: 2 }}>
        <button className="tm-btn" onClick={() => setStep('welcome')} style={{ width: 40, height: 40, borderRadius: '50%',
          background: step === 'welcome' ? 'transparent' : 'var(--surface)',
          border: step === 'welcome' ? '0.5px solid transparent' : '0.5px solid var(--line)',
          color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: step === 'welcome' ? 0 : 1, pointerEvents: step === 'welcome' ? 'none' : 'auto',
          transition: 'opacity 0.3s' }}>
          <IcChevL size={20} /></button>
      </div>

      {/* WELCOME — the wordmark + the doors */}
      {step === 'welcome' && (
        <div className="tm-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column',
          padding: '0 32px 30px', position: 'relative', zIndex: 2, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 108, height: 108, marginBottom: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 70%)',
                animation: 'tm-breathe 4s ease-in-out infinite' }} />
              <div style={{ position: 'relative', color: 'var(--accent-deep)' }}><IcSpark size={44} sw={1.2} /></div>
            </div>
            <div className="tm-kicker" style={{ marginBottom: 16 }}>{returning ? 'Welcome back' : 'Welcome'}</div>
            <div className="tm-display" style={{ fontSize: 62, letterSpacing: '0.09em', marginBottom: 14 }}>TEMPLE</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic',
              color: 'var(--ink-soft)', lineHeight: 1.42, maxWidth: 290, textWrap: 'balance' }}>
              {returning
                ? 'A coach for the long path. Sign in to begin where you left off.'
                : 'A coach for the long path. Create your account and we’ll calibrate it to you.'}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <ProviderButton dark icon={<IcApple size={21} sw={1.5} style={{ marginTop: -1 }} />}
              label={busy === 'apple' ? 'Connecting…' : 'Continue with Apple'} busy={!!busy}
              onClick={() => provider('apple')} />
            <ProviderButton icon={<GoogleGlyph />}
              label={busy === 'google' ? 'Connecting…' : 'Continue with Google'} busy={!!busy}
              onClick={() => provider('google')} />
            <ProviderButton icon={<IcMail size={21} sw={1.5} />} label="Continue with email" busy={!!busy}
              onClick={() => setStep('email')} />
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300, textAlign: 'center',
              marginTop: 8, lineHeight: 1.5, textWrap: 'pretty' }}>
              By continuing you agree to Temple’s Terms & Privacy. Your training stays yours.</div>
          </div>
        </div>
      )}

      {/* EMAIL — quiet single field */}
      {step === 'email' && (
        <div className="tm-rise" style={{ flex: 1, display: 'flex', flexDirection: 'column',
          padding: '20px 32px 30px', position: 'relative', zIndex: 2, minHeight: 0 }}>
          <div style={{ flex: 1 }}>
            <div className="tm-display" style={{ fontSize: 40, marginBottom: 10, lineHeight: 1.05 }}>
              What’s your email?</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: 'italic',
              color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: 26 }}>
              We’ll send a six-digit code. No passwords to forget.</div>
            <div className="tm-glass" style={{ borderRadius: 18, padding: '4px 6px', display: 'flex',
              alignItems: 'center', gap: 10, height: 60 }}>
              <span style={{ color: 'var(--ink-faint)', paddingLeft: 12 }}><IcMail size={20} sw={1.5} /></span>
              <input value={email} onChange={e => setEmail(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && emailValid) setStep('code'); }}
                placeholder="you@email.com" inputMode="email" style={{ flex: 1, border: 'none',
                  background: 'transparent', outline: 'none', fontFamily: "'Jost', sans-serif",
                  fontSize: 17, fontWeight: 300, color: 'var(--ink)', minWidth: 0 }} />
            </div>
          </div>
          <button className="tm-btn" onClick={() => setStep('code')} disabled={!emailValid} style={{
            width: '100%', height: 58, borderRadius: 18, fontSize: 16.5, fontWeight: 400, letterSpacing: '0.02em',
            color: '#fff', background: emailValid ? 'var(--accent-deep)' : 'var(--ink-ghost)',
            boxShadow: emailValid ? '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)' : 'none',
            opacity: emailValid ? 1 : 0.7 }}>Send my code</button>
        </div>
      )}

      {/* CODE — six dots, arriving */}
      {step === 'code' && (
        <div className="tm-rise" style={{ flex: 1, display: 'flex', flexDirection: 'column',
          padding: '20px 32px 30px', position: 'relative', zIndex: 2, minHeight: 0 }}>
          <div style={{ flex: 1 }}>
            <div className="tm-display" style={{ fontSize: 40, marginBottom: 10, lineHeight: 1.05 }}>
              Enter the code</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: 'italic',
              color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: 36 }}>
              Sent to {email || 'your email'}. It’ll fill in on its own here.</div>
            <CodeDots len={code.length} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 28, color: 'var(--ink-faint)', fontSize: 13, fontWeight: 300 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)', animation: 'tm-breathe 1.4s ease-in-out infinite' }} />
              Waiting for the code…
            </div>
          </div>
          <button className="tm-btn" onClick={() => setStep('email')} style={{ width: '100%', height: 48,
            borderRadius: 16, background: 'transparent', border: 'none', color: 'var(--ink-soft)', fontSize: 14 }}>
            Didn’t arrive? Use a different email</button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AuthFlow });
