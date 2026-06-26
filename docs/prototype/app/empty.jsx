// empty.jsx — the quiet rooms. Empty states as invitations, not dead ends.

// A serene empty state: a breathing halo'd glyph, a serif line, an honest sub,
// and an optional gentle action. Used the first day, before there's any data.
function EmptyState({ icon, kicker, title, line, action, onAction, secondary, onSecondary, hue = 'sky' }) {
  return (
    <div className="tm-rise" style={{ flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 40px 48px',
      minHeight: 0 }}>
      <div style={{ position: 'relative', width: 104, height: 104, marginBottom: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle, var(--${hue}) 0%, rgba(255,255,255,0) 70%)`,
          opacity: 0.5, animation: 'tm-breathe 5s ease-in-out infinite' }} />
        <div style={{ position: 'relative', width: 76, height: 76, borderRadius: '50%',
          background: `var(--${hue}-tint)`, border: `0.5px solid var(--${hue})`,
          color: `var(--${hue}-deep)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      {kicker && <div className="tm-kicker" style={{ marginBottom: 14 }}>{kicker}</div>}
      <div className="tm-display" style={{ fontSize: 34, lineHeight: 1.08, marginBottom: 12, maxWidth: 300,
        textWrap: 'balance' }}>{title}</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19.5, fontStyle: 'italic',
        color: 'var(--ink-soft)', lineHeight: 1.4, maxWidth: 290, textWrap: 'pretty' }}>{line}</div>
      {action && (
        <button className="tm-btn" onClick={onAction} style={{ marginTop: 30, minWidth: 220, height: 54,
          padding: '0 26px', borderRadius: 16, fontSize: 16, fontWeight: 400, letterSpacing: '0.02em',
          color: '#fff', background: 'var(--accent-deep)',
          boxShadow: '0 0 24px var(--accent), 0 8px 24px rgba(70,58,40,0.12)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>{action}</button>
      )}
      {secondary && (
        <button className="tm-btn" onClick={onSecondary} style={{ marginTop: 12, height: 44,
          padding: '0 18px', borderRadius: 14, background: 'transparent', border: 'none',
          color: 'var(--ink-soft)', fontSize: 14 }}>{secondary}</button>
      )}
    </div>
  );
}

// A smaller inline empty note — for sections inside an otherwise-populated screen.
function EmptyNote({ children }) {
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: 'italic',
      color: 'var(--ink-faint)', padding: '22px 0', textAlign: 'center', textWrap: 'pretty' }}>
      {children}
    </div>
  );
}

Object.assign(window, { EmptyState, EmptyNote });
