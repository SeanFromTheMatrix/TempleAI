// icons.jsx — TEMPLE thin-line icon set. Minimal, geometric, reverent.
// All icons take { size, stroke, fill, style } and inherit currentColor by default.

const _ic = (size = 24, sw = 1.5) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
});

// ── tab bar ──────────────────────────────────────────────
function IcCoach({ size, sw, style }) {
  // calm speech / dialogue
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M4 12.5c0-3.6 3.4-6.5 8-6.5s8 2.9 8 6.5-3.4 6.5-8 6.5c-1 0-2-.1-2.9-.4L5 20l.9-3.2A6.3 6.3 0 0 1 4 12.5Z" />
    </svg>
  );
}
function IcToday({ size, sw, style }) {
  // checklist
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M9 7h10M9 12h10M9 17h10" />
      <path d="M4.5 7l1 1 1.8-2M4.5 12l1 1 1.8-2M4.5 17l1 1 1.8-2" />
    </svg>
  );
}
function IcProgress({ size, sw, style }) {
  // rising line
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M4 19V5" /><path d="M4 19h16" />
      <path d="M7 15l4-4 3 2 5-6" />
    </svg>
  );
}
function IcBody({ size, sw, style }) {
  // figure
  return (
    <svg {..._ic(size, sw)} style={style}>
      <circle cx="12" cy="5" r="2.2" />
      <path d="M12 7.2v7M12 9l-5 2M12 9l5 2M12 14.2 8.5 21M12 14.2 15.5 21" />
    </svg>
  );
}

// ── actions ──────────────────────────────────────────────
function IcMic({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
}
function IcSend({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M5 12h13M12 6l6 6-6 6" />
    </svg>
  );
}
function IcPlus({ size, sw, style }) {
  return (<svg {..._ic(size, sw)} style={style}><path d="M12 5v14M5 12h14" /></svg>);
}
function IcCheck({ size, sw, style }) {
  return (<svg {..._ic(size, sw)} style={style}><path d="M5 12.5l4.5 4.5L19 7" /></svg>);
}
function IcChevR({ size, sw, style }) {
  return (<svg {..._ic(size, sw)} style={style}><path d="M9 5l7 7-7 7" /></svg>);
}
function IcChevL({ size, sw, style }) {
  return (<svg {..._ic(size, sw)} style={style}><path d="M15 5l-7 7 7 7" /></svg>);
}
function IcChevDown({ size, sw, style }) {
  return (<svg {..._ic(size, sw)} style={style}><path d="M5 9l7 7 7-7" /></svg>);
}
function IcClose({ size, sw, style }) {
  return (<svg {..._ic(size, sw)} style={style}><path d="M6 6l12 12M18 6L6 18" /></svg>);
}
function IcMinus({ size, sw, style }) {
  return (<svg {..._ic(size, sw)} style={style}><path d="M5 12h14" /></svg>);
}
function IcWave({ size, sw, style }) {
  // sound wave (voice active)
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M3 12h2M7 8v8M11 4v16M15 8v8M19 10v4M21 12h0" />
    </svg>
  );
}
function IcDumbbell({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />
    </svg>
  );
}
function IcLeaf({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z" /><path d="M5 19c4-4 7-7 10-9" />
    </svg>
  );
}
function IcSpark({ size, sw, style }) {
  // four-point star — the coach's mark
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M12 3c.6 4.2 1.8 5.4 6 6-4.2.6-5.4 1.8-6 6-.6-4.2-1.8-5.4-6-6 4.2-.6 5.4-1.8 6-6Z" />
    </svg>
  );
}
function IcHeart({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11Z" />
    </svg>
  );
}
function IcPulse({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

// ── circle / social ─────────────────────────────────────
function IcUsers({ size, sw, style }) {
  // two figures — the courtyard
  return (
    <svg {..._ic(size, sw)} style={style}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="7.5" r="2.3" />
      <path d="M16 13.2A4.6 4.6 0 0 1 20.5 17.6" />
    </svg>
  );
}
function IcApple({ size, sw, style }) {
  // generic apple silhouette — not a brand mark
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M12 8.4c-1.2-1.1-3.2-1.3-4.6-.2-1.7 1.3-2 4-.6 6.4 1 1.8 2.3 3.4 3.6 3.4.8 0 1.1-.4 1.6-.4s.8.4 1.6.4c1.3 0 2.6-1.6 3.6-3.4 1.4-2.4 1.1-5.1-.6-6.4-1.4-1.1-3.4-.9-4.6.2Z" />
      <path d="M12 8.4c0-1.4.6-2.7 2-3.4" />
    </svg>
  );
}
function IcMail({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <rect x="3" y="5.5" width="18" height="13" rx="3" />
      <path d="M4 8l8 5 8-5" />
    </svg>
  );
}
function IcLink({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
      <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" />
    </svg>
  );
}
function IcQR({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <path d="M14 14h2.5v2.5M20 14v6M14 20h6" />
    </svg>
  );
}
function IcFlame({ size, sw, style }) {
  // streak — a calm flame
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M12 3c.5 3-2 4-3.5 6.2A6 6 0 1 0 18 13c0-2-1-3.6-2.4-5 .2 1.6-.6 2.5-1.4 2.8.4-2.6-.7-5.5-2.2-7.8Z" />
    </svg>
  );
}
function IcSearch({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" />
    </svg>
  );
}
function IcShare({ size, sw, style }) {
  return (
    <svg {..._ic(size, sw)} style={style}>
      <path d="M12 15V4M8.5 7.5L12 4l3.5 3.5" />
      <path d="M6 12v6.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V12" />
    </svg>
  );
}

Object.assign(window, {
  IcCoach, IcToday, IcProgress, IcBody,
  IcMic, IcSend, IcPlus, IcCheck, IcChevR, IcChevL, IcChevDown, IcClose, IcMinus,
  IcWave, IcDumbbell, IcLeaf, IcSpark, IcHeart, IcPulse,
  IcUsers, IcApple, IcMail, IcLink, IcQR, IcFlame, IcSearch, IcShare,
});
