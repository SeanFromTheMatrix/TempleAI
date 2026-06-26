// invite.jsx — bringing people to the path. Contacts, a link, a QR for the gym.

// A stylized QR — a deterministic module grid with finder eyes. Decorative (mock),
// not a scannable code, but reads unmistakably as "scan me".
function QRGlyph({ size = 188 }) {
  const N = 21;
  const cells = React.useMemo(() => {
    const inFinder = (r, c) =>
      (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
    const grid = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (inFinder(r, c)) { grid.push(0); continue; }
      // deterministic pseudo-random
      const v = (Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
      grid.push(Math.abs(v) > 0.52 ? 1 : 0);
    }
    return grid;
  }, []);
  const Eye = ({ style }) => (
    <div style={{ position: 'absolute', width: '33.33%', height: '33.33%', ...style }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 6, padding: '16%',
        background: 'var(--ink)' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 4, padding: '22%', background: 'var(--paper)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 2, background: 'var(--ink)' }} />
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ position: 'relative', width: size, height: size, background: 'var(--paper)',
      borderRadius: 16, padding: size * 0.06, boxShadow: 'var(--shadow-sm)', border: '0.5px solid var(--line)' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, width: '100%', height: '100%' }}>
          {cells.map((v, i) => (
            <div key={i} style={{ background: v ? 'var(--ink)' : 'transparent', borderRadius: 1 }} />
          ))}
        </div>
        <Eye style={{ top: 0, left: 0 }} />
        <Eye style={{ top: 0, right: 0 }} />
        <Eye style={{ bottom: 0, left: 0 }} />
      </div>
    </div>
  );
}

function ContactRow({ c, state, onAct }) {
  const friend = { initials: c.initials, hue: c.onTemple ? 'sage' : 'sky' };
  const done = state === 'invited' || state === 'requested';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 2px' }}>
      <FriendToken friend={friend} size={42} dim={!c.onTemple} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>{c.name}</div>
        <div style={{ fontSize: 12.5, color: c.onTemple ? 'var(--sage-deep)' : 'var(--ink-faint)', fontWeight: 300,
          marginTop: 1 }}>{c.onTemple ? (c.hint || 'On Temple') : (c.hint || 'Not on Temple yet')}</div>
      </div>
      <button className="tm-btn" onClick={() => !done && onAct(c)} disabled={done} style={{
        height: 38, padding: '0 16px', borderRadius: 9999, fontSize: 13.5, fontWeight: 400, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: done ? 'var(--ink-soft)' : c.onTemple ? '#fff' : 'var(--accent-deep)',
        background: done ? 'var(--surface)' : c.onTemple ? 'var(--accent-deep)' : 'var(--accent-tint)',
        border: done ? '0.5px solid var(--line)' : c.onTemple ? 'none' : '0.5px solid var(--accent)',
        boxShadow: done ? 'none' : c.onTemple ? '0 0 14px var(--accent)' : 'none' }}>
        {done ? <><IcCheck size={15} sw={2} /> {state === 'invited' ? 'Invited' : 'Added'}</>
              : c.onTemple ? 'Add' : 'Invite'}
      </button>
    </div>
  );
}

function InviteSheet({ onClose }) {
  const C = TEMPLE_DATA.circle;
  const [step, setStep] = React.useState('prime'); // prime | contacts | link
  const [query, setQuery] = React.useState('');
  const [states, setStates] = React.useState({}); // contactId -> 'invited' | 'requested'
  const [copied, setCopied] = React.useState(false);

  const act = (c) => setStates(s => ({ ...s, [c.id]: c.onTemple ? 'requested' : 'invited' }));
  const copy = () => {
    try { navigator.clipboard && navigator.clipboard.writeText('https://' + C.inviteLink); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const filtered = C.contacts.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 76, display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(44,40,35,0.22)',
        backdropFilter: 'blur(2px)' }} />
      <div className="tm-glass" style={{ position: 'relative', borderRadius: '34px 34px 0 0',
        height: '90%', display: 'flex', flexDirection: 'column',
        animation: 'tm-rise 0.32s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ flexShrink: 0, padding: '14px 22px 8px' }}>
          <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--ink-ghost)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="tm-kicker" style={{ marginBottom: 5 }}>Invite</div>
              <div className="tm-display" style={{ fontSize: 28 }}>
                {step === 'link' ? 'Your invite link' : 'Walk together'}</div>
            </div>
            <button className="tm-btn" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%',
              background: 'var(--surface)', border: '0.5px solid var(--line)', color: 'var(--ink-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={20} /></button>
          </div>
        </div>

        {/* PRIME — permission priming */}
        {step === 'prime' && (
          <div className="tm-rise" style={{ flex: 1, display: 'flex', flexDirection: 'column',
            padding: '8px 28px 28px', minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 70%)', opacity: 0.55,
                  animation: 'tm-breathe 5s ease-in-out infinite' }} />
                <div style={{ position: 'relative', width: 70, height: 70, borderRadius: '50%',
                  background: 'var(--accent-tint)', border: '0.5px solid var(--accent)', color: 'var(--accent-deep)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcUsers size={32} sw={1.4} /></div>
              </div>
              <div className="tm-display" style={{ fontSize: 30, marginBottom: 12, maxWidth: 280, textWrap: 'balance' }}>
                Find friends already here</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: 'italic',
                color: 'var(--ink-soft)', lineHeight: 1.4, maxWidth: 290, textWrap: 'pretty' }}>
                Temple can check your contacts for people on the path — privately, on your device. We never message
                anyone for you, and nothing’s uploaded.</div>
            </div>
            <button className="tm-btn" onClick={() => setStep('contacts')} style={{ width: '100%', height: 58,
              borderRadius: 18, fontSize: 16.5, fontWeight: 400, color: '#fff', background: 'var(--accent-deep)',
              boxShadow: '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)' }}>Allow contact access</button>
            <button className="tm-btn" onClick={() => setStep('link')} style={{ width: '100%', height: 50,
              marginTop: 9, borderRadius: 16, background: 'transparent', border: 'none', color: 'var(--ink-soft)',
              fontSize: 14.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IcLink size={17} sw={1.6} /> Share a link instead</button>
          </div>
        )}

        {/* CONTACTS — searchable list */}
        {step === 'contacts' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flexShrink: 0, padding: '4px 22px 12px' }}>
              <div className="tm-glass" style={{ borderRadius: 14, padding: '0 14px', display: 'flex',
                alignItems: 'center', gap: 10, height: 48 }}>
                <span style={{ color: 'var(--ink-faint)' }}><IcSearch size={19} sw={1.6} /></span>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search contacts"
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none',
                    fontFamily: "'Jost', sans-serif", fontSize: 15.5, fontWeight: 300, color: 'var(--ink)', minWidth: 0 }} />
                {query && <button className="tm-btn" onClick={() => setQuery('')} aria-label="Clear" style={{ width: 26,
                  height: 26, borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--ink-faint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={15} /></button>}
              </div>
            </div>
            <div className="tm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', minHeight: 0 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ color: 'var(--ink-ghost)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <IcSearch size={40} sw={1.2} /></div>
                  <div className="tm-display" style={{ fontSize: 24, marginBottom: 8 }}>No one by that name</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic',
                    color: 'var(--ink-soft)', lineHeight: 1.4, maxWidth: 260, margin: '0 auto', textWrap: 'pretty' }}>
                    They might not be in your contacts. Share your link and they can find you.</div>
                  <button className="tm-btn" onClick={() => setStep('link')} style={{ marginTop: 22, height: 48,
                    padding: '0 22px', borderRadius: 14, background: 'var(--accent-tint)', border: '0.5px solid var(--accent)',
                    color: 'var(--accent-deep)', fontSize: 14.5, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <IcLink size={17} sw={1.6} /> Share invite link</button>
                </div>
              ) : (
                <>
                  {filtered.map((c, i) => (
                    <React.Fragment key={c.id}>
                      <ContactRow c={c} state={states[c.id]} onAct={act} />
                      {i < filtered.length - 1 && <div className="tm-divider" style={{ opacity: 0.5 }} />}
                    </React.Fragment>
                  ))}
                  <button className="tm-btn" onClick={() => setStep('link')} style={{ width: '100%', marginTop: 18,
                    height: 50, borderRadius: 14, background: 'var(--surface)', border: '0.5px solid var(--line)',
                    color: 'var(--ink-soft)', fontSize: 14, display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8 }}>
                    <IcQR size={17} sw={1.6} /> Or share a link & QR code</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* LINK & QR */}
        {step === 'link' && (
          <div className="tm-rise tm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 28px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 0 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: 'italic',
              color: 'var(--ink-soft)', lineHeight: 1.4, maxWidth: 290, marginBottom: 22, textWrap: 'pretty' }}>
              Have them scan this at the gym, or send the link. Anyone who joins through it lands in your circle.</div>
            <QRGlyph size={196} />
            <div className="tm-glass" style={{ marginTop: 24, width: '100%', borderRadius: 16, padding: '6px 6px 6px 18px',
              display: 'flex', alignItems: 'center', gap: 10, height: 58 }}>
              <span style={{ color: 'var(--accent-deep)', flexShrink: 0 }}><IcLink size={19} sw={1.6} /></span>
              <span style={{ flex: 1, fontSize: 15.5, color: 'var(--ink)', textAlign: 'left', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{C.inviteLink}</span>
              <button className="tm-btn" onClick={copy} style={{ height: 46, padding: '0 18px', borderRadius: 12,
                flexShrink: 0, background: copied ? 'var(--sage-tint)' : 'var(--accent-deep)',
                border: copied ? '0.5px solid var(--sage)' : 'none', color: copied ? 'var(--sage-deep)' : '#fff',
                fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {copied ? <><IcCheck size={16} sw={2} /> Copied</> : 'Copy'}</button>
            </div>
            <button className="tm-btn" onClick={() => {}} style={{ width: '100%', marginTop: 11, height: 56,
              borderRadius: 16, background: 'var(--paper)', border: '0.5px solid var(--line)', color: 'var(--ink)',
              fontSize: 15.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              boxShadow: 'var(--shadow-sm)' }}>
              <IcShare size={19} sw={1.6} /> Share via…</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { InviteSheet, QRGlyph });
