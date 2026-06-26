// shell.jsx — tab bar + app container + routing.

const TABS = [
  { id: 'coach', label: 'Coach', Icon: window.IcCoach, home: true },
  { id: 'today', label: 'Today', Icon: window.IcToday },
  { id: 'progress', label: 'Progress', Icon: window.IcProgress },
  { id: 'circle', label: 'Circle', Icon: window.IcUsers },
];

function TabBar({ active, onChange, tabStyle }) {
  const frosted = tabStyle !== 'solid';
  return (
    <div style={{ flexShrink: 0, padding: '8px 14px 26px', position: 'relative', zIndex: 5 }}>
      <div className={frosted ? 'tm-glass' : ''} style={{
        borderRadius: 26, padding: '8px 6px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: frosted ? undefined : 'var(--paper)',
        border: frosted ? undefined : '0.5px solid var(--line)',
        boxShadow: frosted ? undefined : 'var(--shadow-md)' }}>
        {TABS.map(t => {
          const on = active === t.id;
          const Icon = t.Icon;
          return (
            <button key={t.id} className="tm-btn" onClick={() => onChange(t.id)} style={{
              flex: 1, background: 'transparent', border: 'none', padding: '6px 0 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              color: on ? 'var(--accent-deep)' : 'var(--ink-faint)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30 }}>
                {on && <div style={{ position: 'absolute', inset: -3, borderRadius: '50%',
                  background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 72%)',
                  opacity: 0.7 }} />}
                <span style={{ position: 'relative' }}><Icon size={24} sw={on ? 1.7 : 1.5} /></span>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: on ? 500 : 400, letterSpacing: '0.04em' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toast({ text }) {
  return (
    <div className="tm-fade" style={{ position: 'absolute', left: 0, right: 0, bottom: 104, display: 'flex',
      justifyContent: 'center', zIndex: 90, pointerEvents: 'none' }}>
      <div className="tm-glass" style={{ borderRadius: 9999, padding: '11px 20px', display: 'flex',
        alignItems: 'center', gap: 9, boxShadow: 'var(--shadow-md)' }}>
        <span style={{ color: 'var(--accent-deep)' }}><IcCheck size={16} sw={2} /></span>
        <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>{text}</span>
      </div>
    </div>
  );
}

function TempleApp({ t, initialView, initialTab, progressId, onPickLevel, onSetHealth }) {
  const [view, setView] = React.useState(initialView || 'onboarding');
  const [tab, setTab] = React.useState(initialTab || 'coach');
  const [coachTopic, setCoachTopic] = React.useState(null);
  const [logEx, setLogEx] = React.useState(null);
  const [voiceOpen, setVoiceOpen] = React.useState(false);
  const [formCheck, setFormCheck] = React.useState(null); // { ex } | null
  const [demoEx, setDemoEx] = React.useState(null); // movement demo target
  const [invite, setInvite] = React.useState(false);
  const [pro, setPro] = React.useState(false);
  const coachSend = React.useRef(null);
  const [exs, setExs] = React.useState(() => TEMPLE_DATA.session.exercises.map(e => ({ ...e })));
  const [logs, setLogs] = React.useState({});
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [extraFeed, setExtraFeed] = React.useState([]);
  const [circleSeg, setCircleSeg] = React.useState('friends');
  const [pendingCoach, setPendingCoach] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const toastT = React.useRef(null);
  const showToast = (msg) => { setToast(msg); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), 2600); };
  const logSet = (exId, set) => setLogs(l => ({ ...l, [exId]: [...(l[exId] || []), set] }));
  const markDone = (exId, val) => setExs(xs => xs.map(x => x.id === exId ? { ...x, done: val } : x));
  const saveSession = ({ shared }) => {
    const movements = exs.length;
    if (shared) setExtraFeed(f => [{ id: 'me-' + Date.now(), who: 'me', kind: 'session', when: 'Just now',
      title: TEMPLE_DATA.session.title, line: `Logged the full session — ${movements} movements, honest work.`, mine: true }, ...f]);
    setSummaryOpen(false);
    showToast(shared ? 'Session saved · shared to your circle' : 'Session saved to history');
  };
  const goBody = () => { setTab('circle'); setCircleSeg('body'); };
  const sendToCoach = (msg) => { setCoachTopic(null); setPendingCoach(msg); setFormCheck(null); setView('app'); setTab('coach'); };

  const firstRun = t.account === 'new';
  const social = t.social || 'quiet';

  // let the Tweaks panel open the invite sheet
  React.useEffect(() => {
    const open = () => { setView('app'); setTab('circle'); setInvite(true); };
    window.addEventListener('temple:invite', open);
    return () => window.removeEventListener('temple:invite', open);
  }, []);

  const imperial = t.theme === 'imperial';
  const accentVars = {
    sky:      { a: 'var(--sky)', d: 'var(--sky-deep)', t: 'var(--sky-tint)' },
    sage:     { a: 'var(--sage)', d: 'var(--sage-deep)', t: 'var(--sage-tint)' },
    lavender: { a: 'var(--lavender)', d: 'var(--lavender-deep)', t: 'var(--lavender-tint)' },
    gold:     { a: 'var(--gold)', d: 'var(--gold-deep)', t: 'var(--gold-tint)' },
  }[t.accent] || {};

  // In Imperial mode the accent is forced Sith-red by the .tm-imperial class —
  // so we DON'T set the picker accent inline (inline would override the class).
  const rootStyle = {
    height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
    ...(imperial ? {} : { '--accent': accentVars.a, '--accent-deep': accentVars.d, '--accent-tint': accentVars.t }),
  };

  const coachMode = t.coachMode || 'balanced';
  const goTab = (id) => { if (id === 'coach') setCoachTopic(null); setTab(id); };

  const screen = (() => {
    switch (tab) {
      case 'coach': return <CoachScreen convKey={t.conversation} voiceStyle={t.voiceStyle}
        density={t.density} coachMode={coachMode} topic={coachTopic} firstRun={firstRun} imperial={imperial}
        onClearTopic={() => setCoachTopic(null)}
        onOpenSession={() => setTab('today')} onOpenVoice={() => setVoiceOpen(true)}
        onFormCheck={() => setFormCheck({ ex: null })} sendRef={coachSend}
        injectMsg={pendingCoach} onInjected={() => setPendingCoach(null)} />;
      case 'today': return <TodayScreen exs={exs} setExs={setExs} onOpenLog={(ex) => setLogEx(ex)} coachMode={coachMode}
        firstRun={firstRun} onOpenCoach={() => setTab('coach')} onFinish={() => setSummaryOpen(true)} onGoBody={goBody}
        onFormCheck={(ex) => setFormCheck({ ex })} onDemo={(ex) => setDemoEx(ex)} />;
      case 'progress': return <ProgressScreen initialId={progressId || 'incline'} firstRun={firstRun}
        onOpenCoach={() => setTab('coach')} />;
      case 'circle': return <CircleScreen firstRun={firstRun} social={social} hub={t.hub} health={!!t.healthData}
        seg={circleSeg} onSeg={setCircleSeg} extraFeed={extraFeed}
        onConnectHealth={() => onSetHealth && onSetHealth(true)}
        onTalkToCoach={(label) => { setCoachTopic(label); setTab('coach'); }}
        onInvite={() => setInvite(true)} />;
      default: return null;
    }
  })();

  return (
    <div className={'tm-marble tm-root' + (imperial ? ' tm-imperial' : '')} style={rootStyle}>
      {view === 'auth' ? (
        <AuthFlow returning={!firstRun} onComplete={() => {
          // A returning lifter (established account) lands back in the app;
          // a new one (first run) continues into calibration, then the app.
          if (firstRun) setView('onboarding');
          else { setView('app'); setTab('coach'); }
        }} />
      ) : view === 'onboarding' ? (
        <OnboardingFlow onComplete={(payload) => { setView('app'); setTab('coach'); onPickLevel && onPickLevel(payload); }} />
      ) : (
        <>
          {/* status bar clearance */}
          <div style={{ height: 52, flexShrink: 0 }} />
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>{screen}</div>
          <TabBar active={tab} onChange={goTab} tabStyle={t.tabStyle} />
        </>
      )}

      {logEx && <LogSheet exercise={logEx} logged={logs[logEx.id] || []}
        onLogSet={(set) => logSet(logEx.id, set)} onAllLogged={() => markDone(logEx.id, true)}
        onClose={() => setLogEx(null)} />}
      {voiceOpen && <VoiceOverlay onClose={() => setVoiceOpen(false)}
        onSubmit={(text) => { setVoiceOpen(false); if (coachSend.current) coachSend.current(text); }} />}
      {formCheck && <FormCheckSheet exercise={formCheck.ex} pro={pro}
        onUnlock={() => setPro(true)} onSendToCoach={sendToCoach} onClose={() => setFormCheck(null)} />}
      {demoEx && <MovementDemoSheet exercise={demoEx} pro={pro}
        onUnlock={() => setPro(true)} onClose={() => setDemoEx(null)} />}
      {invite && <InviteSheet onClose={() => setInvite(false)} />}
      {summaryOpen && <SessionSummarySheet exs={exs} logs={logs}
        onClose={() => setSummaryOpen(false)} onSave={saveSession} />}
      {toast && <Toast text={toast} />}
    </div>
  );
}

Object.assign(window, { TempleApp, TabBar });
