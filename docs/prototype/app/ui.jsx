// ui.jsx — shared TEMPLE primitives.

const HUE_VAR = {
  sky: 'var(--sky)', sage: 'var(--sage)', lavender: 'var(--lavender)', gold: 'var(--gold)',
};
const HUE_DEEP = {
  sky: 'var(--sky-deep)', sage: 'var(--sage-deep)', lavender: 'var(--lavender-deep)', gold: 'var(--gold-deep)',
};
const HUE_TINT = {
  sky: 'var(--sky-tint)', sage: 'var(--sage-tint)', lavender: 'var(--lavender-tint)', gold: 'var(--gold-tint)',
};
window.HUE_VAR = HUE_VAR; window.HUE_DEEP = HUE_DEEP; window.HUE_TINT = HUE_TINT;

// Large screen header — serif title with a quiet kicker above.
function ScreenHeader({ kicker, title, right, sub }) {
  return (
    <div style={{ padding: '8px 24px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        {kicker && <div className="tm-kicker" style={{ marginBottom: 9 }}>{kicker}</div>}
        <div className="tm-display" style={{ fontSize: 40, letterSpacing: '0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 7, fontWeight: 300 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// Circular progress ring with a soft luminous trail.
function ProgressRing({ value, size = 92, stroke = 6, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value);
  const uid = React.useMemo(() => 'rg' + Math.random().toString(36).slice(2, 7), []);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-deep)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${uid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)',
                   filter: 'drop-shadow(0 0 5px var(--accent))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  );
}

// Soft accent glow halo, sits behind an element.
function Halo({ hue = 'sky', size = 200, opacity = 0.5, style }) {
  return (
    <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${HUE_VAR[hue]} 0%, rgba(255,255,255,0) 68%)`,
      filter: 'blur(14px)', opacity, pointerEvents: 'none', ...style }} />
  );
}

function SeverityChip({ sev }) {
  const map = { mild: 'sage', moderate: 'gold', significant: 'lavender' };
  const hue = map[sev] || 'sage';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5,
      color: 'var(--ink-soft)', textTransform: 'capitalize', letterSpacing: '0.02em' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: HUE_VAR[hue],
        boxShadow: `0 0 6px ${HUE_VAR[hue]}` }} />
      {sev}
    </span>
  );
}

// Pill-shaped glass button
function GlassBtn({ children, onClick, style, active, hue = 'sky' }) {
  return (
    <button className="tm-btn" onClick={onClick} style={{
      borderRadius: 9999, padding: '11px 20px', fontSize: 14, fontWeight: 400,
      color: active ? 'var(--ink)' : 'var(--ink-soft)',
      background: active ? HUE_TINT[hue] : 'var(--surface)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: active ? `0.5px solid ${HUE_VAR[hue]}` : '0.5px solid var(--line)',
      boxShadow: active ? `0 0 0 0.5px ${HUE_VAR[hue]}` : 'var(--shadow-sm)',
      ...style }}>{children}</button>
  );
}

Object.assign(window, { ScreenHeader, ProgressRing, Halo, SeverityChip, GlassBtn });
