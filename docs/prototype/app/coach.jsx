// coach.jsx — the hero: the AI coach conversation.

function CoachMark({ size = 30, glow = true }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {glow && <div style={{ position: 'absolute', inset: -6, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 70%)',
        opacity: 0.6, animation: 'tm-breathe 5s ease-in-out infinite' }} />}
      <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%',
        background: 'var(--accent-tint)', border: '0.5px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-deep)' }}>
        <IcSpark size={size * 0.56} sw={1.4} />
      </div>
    </div>
  );
}

function CoachMessage({ text, card, onOpenSession, fontSize, showMark }) {
  return (
    <div className="tm-rise" style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
      paddingRight: 24 }}>
      <div style={{ width: 30, flexShrink: 0 }}>{showMark && <CoachMark />}</div>
      <div style={{ minWidth: 0 }}>
        {showMark && <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--ink-faint)', marginBottom: 7, marginTop: 5 }}>Temple</div>}
        <div style={{ fontSize, lineHeight: 1.62, color: 'var(--ink)', fontWeight: 300,
          textWrap: 'pretty', maxWidth: 320 }}>{text}</div>
        {card === 'session' && <SessionPreviewCard onOpen={onOpenSession} />}
      </div>
    </div>
  );
}

function SessionPreviewCard({ onOpen }) {
  const s = TEMPLE_DATA.session;
  const done = s.exercises.filter(e => e.done).length;
  return (
    <button className="tm-btn tm-glass" onClick={onOpen} style={{
      marginTop: 14, borderRadius: 'var(--radius)', padding: '16px 18px', width: 300, textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 16 }}>
      <ProgressRing value={done / s.exercises.length} size={54} stroke={4}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{done}/{s.exercises.length}</span>
      </ProgressRing>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tm-kicker" style={{ fontSize: 10, marginBottom: 4 }}>Today’s session</div>
        <div className="tm-display" style={{ fontSize: 21, lineHeight: 1.1 }}>{s.title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4, fontWeight: 300 }}>
          {s.exercises.length} movements · ~{s.durationMin} min</div>
      </div>
      <span style={{ color: 'var(--accent-deep)' }}><IcChevR size={18} /></span>
    </button>
  );
}

function UserMessage({ text, fontSize }) {
  return (
    <div className="tm-rise" style={{ display: 'flex', justifyContent: 'flex-end', paddingLeft: 56 }}>
      <div style={{ fontSize, lineHeight: 1.5, color: 'var(--ink)', fontWeight: 400,
        background: 'var(--paper)', border: '0.5px solid var(--line)',
        boxShadow: 'var(--shadow-sm)', borderRadius: '18px 18px 6px 18px',
        padding: '11px 16px', maxWidth: 280, textWrap: 'pretty' }}>{text}</div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="tm-fade" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <CoachMark />
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 30 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-deep)',
            opacity: 0.7, animation: `tm-breathe 1.1s ease-in-out ${i*0.18}s infinite` }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--ink-faint)', fontWeight: 300,
          fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>considering…</span>
      </div>
    </div>
  );
}

const COACH_REPLIES = [
  'Good question. Let’s keep it simple — protect the joint, earn the load, and the size follows. What feels off right now?',
  'Noted. I’ll fold that into today without touching what’s working. Strength over heroics, always.',
  'That’s the patient choice, and patience is what gets you to 200 lean. I’ll adjust the plan.',
  'Understood. Tell me how the first working set feels and we’ll calibrate from there.',
];

// Marks where a piece of context entered the ONE thread from elsewhere in the app
// — proof the coach stays updated across surfaces, not siloed in separate chats.
function ContextMarker({ label }) {
  return (
    <div className="tm-fade" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 24px 0 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
        <IcLeaf size={13} sw={1.5} /> Noted from Body · {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  );
}

function CoachScreen({ convKey, voiceStyle, density, coachMode, topic, firstRun, imperial, onClearTopic, onOpenSession, onOpenVoice, onFormCheck, sendRef, injectMsg, onInjected }) {
  const topicMsg = (tp) => `I saw you flag your ${tp.toLowerCase()} over in Body just now — thanks for telling me. Everything you share with me lives in one place, so we never lose the thread. What does it feel like: sharp, an ache, only on certain movements? I’ll protect it and shape today around it.`;
  const firstBase = [
    { from: 'coach', text: 'Welcome to Temple. I’m your coach — calm, honest, and here for the long path, not a quick burst.' },
    { from: 'coach', text: 'There’s no plan loaded yet, and that’s on purpose. Tell me what today looks like — what you want to train, how your body feels, what you’ve got around you — and I’ll build your first session from there.' },
  ];
  const baseThread = () => firstRun ? firstBase : TEMPLE_DATA.conversations[convKey].messages;
  const withTopic = (b, tp) => tp ? [...b, { from: 'coach', context: tp, text: topicMsg(tp) }] : b;
  const [msgs, setMsgs] = React.useState(() => withTopic(baseThread(), topic));
  const [thinking, setThinking] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const scrollRef = React.useRef(null);
  const replyIdx = React.useRef(0);
  const injectedTopic = React.useRef(topic || null);

  // Reset to the running thread when the example conversation / first-run changes.
  React.useEffect(() => {
    injectedTopic.current = topic || null;
    setMsgs(withTopic(baseThread(), topic));
    setThinking(false);
  }, [convKey, firstRun]);

  // A topic raised elsewhere (e.g. “Talk to coach” from Body) flows into the SAME
  // thread — one coach, one memory — not a separate window.
  React.useEffect(() => {
    if (topic && injectedTopic.current !== topic) {
      injectedTopic.current = topic;
      setMsgs(m => [...m, { from: 'coach', context: topic, text: topicMsg(topic) }]);
    } else if (!topic) {
      injectedTopic.current = null;
    }
  }, [topic]);

  // A message handed in from elsewhere (e.g. a form check “sent to coach”) lands in the thread.
  const injectedMsg = React.useRef(null);
  React.useEffect(() => {
    if (injectMsg && injectedMsg.current !== injectMsg) {
      injectedMsg.current = injectMsg;
      setMsgs(m => [...m, { from: 'coach', text: injectMsg }]);
      onInjected && onInjected();
    }
  }, [injectMsg]);
  React.useEffect(() => {
    const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, thinking]);

  const quickReplies = topic ? TEMPLE_DATA.bodyTopicReplies
    : firstRun ? ['Build me a push day', 'I’m easing back in', 'I’ve got 45 minutes', 'Full gym today']
    : TEMPLE_DATA.quickReplies;
  const showQuick = coachMode !== 'assist'; // advanced lifters skip the suggestion chips

  const fontSize = density === 'compact' ? 15 : 16.5;
  const gap = density === 'compact' ? 18 : 27;

  const send = (text) => {
    const t = (text || '').trim(); if (!t) return;
    setMsgs(m => [...m, { from: 'user', text: t }]);
    setDraft('');
    setThinking(true);
    setTimeout(() => {
      const r = COACH_REPLIES[replyIdx.current % COACH_REPLIES.length]; replyIdx.current++;
      setThinking(false);
      setMsgs(m => [...m, { from: 'coach', text: r }]);
    }, 1300);
  };
  if (sendRef) sendRef.current = send;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* top bar */}
      <div style={{ padding: '6px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="tm-kicker" style={{ marginBottom: 6 }}>Your coach</div>
          <div className="tm-display" style={{ fontSize: 34 }}>Temple</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-soft)',
          fontWeight: 300 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%',
            background: imperial ? 'var(--accent)' : 'var(--sage)',
            boxShadow: imperial ? '0 0 7px var(--accent)' : '0 0 6px var(--sage)' }} />
          {imperial ? 'Secure channel' : 'Here with you'}
        </div>
      </div>
      <div className="tm-divider" style={{ opacity: 0.7 }} />

      {topic && (
        <div className="tm-fade" style={{ padding: '10px 24px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 13px',
            borderRadius: 9999, background: 'var(--accent-tint)', border: '0.5px solid var(--accent)' }}>
            <span style={{ color: 'var(--accent-deep)' }}><IcLeaf size={14} sw={1.6} /></span>
            <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>Re: {topic}</span>
            <button className="tm-btn" onClick={onClearTopic} aria-label="Clear topic" style={{ width: 22, height: 22,
              borderRadius: '50%', background: 'rgba(255,255,255,0.5)', border: 'none', color: 'var(--ink-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcClose size={13} /></button>
          </div>
        </div>
      )}

      {/* messages */}
      <div ref={scrollRef} className="tm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 16px',
        display: 'flex', flexDirection: 'column', gap }}>
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          if (m.from === 'coach') return (
            <React.Fragment key={i}>
              {m.context && <ContextMarker label={m.context} />}
              <CoachMessage {...m} fontSize={fontSize}
                onOpenSession={onOpenSession} showMark={!prev || prev.from !== 'coach' || !!m.context} />
            </React.Fragment>
          );
          return <UserMessage key={i} text={m.text} fontSize={fontSize} />;
        })}
        {thinking && <ThinkingDots />}
      </div>

      {/* quick replies */}
      {showQuick && (
      <div className="tm-scroll" style={{ display: 'flex', gap: 8, padding: '4px 24px 10px',
        overflowX: 'auto', flexShrink: 0 }}>
        {quickReplies.map((q, i) => (
          <button key={i} className="tm-btn" onClick={() => send(q)} style={{
            whiteSpace: 'nowrap', borderRadius: 9999, padding: '8px 15px', fontSize: 13, fontWeight: 300,
            color: 'var(--ink-soft)', background: 'var(--surface)', border: '0.5px solid var(--line)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>{q}</button>
        ))}
      </div>
      )}

      {/* composer */}
      <div style={{ padding: '6px 18px 16px', flexShrink: 0 }}>
        <div className="tm-glass" style={{ borderRadius: 26, padding: '8px 8px 8px 8px',
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="tm-btn" onClick={onFormCheck} aria-label="Form check"
            style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'transparent',
              border: 'none', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10l5-3v10l-5-3z"/></svg>
          </button>
          <input value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(draft); }}
            placeholder="Ask your coach…" style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: "'Jost', sans-serif", fontSize: 15.5, fontWeight: 300, color: 'var(--ink)',
              minWidth: 0 }} />
          {voiceStyle === 'inline' && (
            <button className="tm-btn" onClick={onOpenVoice} aria-label="Voice"
              style={{ width: 44, height: 44, borderRadius: '50%', background: 'transparent',
                color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IcMic size={22} />
            </button>
          )}
          {voiceStyle === 'prominent' && (
            <button className="tm-btn" onClick={onOpenVoice} aria-label="Voice"
              style={{ height: 46, borderRadius: 9999, padding: '0 18px 0 14px', display: 'flex',
                alignItems: 'center', gap: 8, background: 'var(--accent-tint)',
                border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', fontSize: 13.5, fontWeight: 400 }}>
              <IcMic size={20} /> Speak
            </button>
          )}
          <button className="tm-btn" onClick={() => send(draft)} aria-label="Send" style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: draft.trim() ? 'var(--accent-deep)' : 'var(--surface-2)',
            color: draft.trim() ? '#fff' : 'var(--ink-faint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: draft.trim() ? '0 0 16px var(--accent)' : 'none',
            border: draft.trim() ? 'none' : '0.5px solid var(--line)' }}>
            <IcSend size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}

function VoiceOverlay({ onClose, onSubmit }) {
  const [heard, setHeard] = React.useState('');
  const phrase = 'How should I warm up my back today?';
  React.useEffect(() => {
    let i = 0; const id = setInterval(() => {
      i += 1; setHeard(phrase.slice(0, i)); if (i >= phrase.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="tm-fade" style={{ position: 'absolute', inset: 0, zIndex: 80,
      background: 'var(--surface)', backdropFilter: 'blur(26px) saturate(140%)',
      WebkitBackdropFilter: 'blur(26px) saturate(140%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <button className="tm-btn" onClick={onClose} style={{ position: 'absolute', top: 56, right: 24,
        width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)', border: '0.5px solid var(--line)',
        color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcClose size={22} />
      </button>

      {/* breathing orb */}
      <div style={{ position: 'relative', width: 180, height: 180, display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,255,255,0) 70%)',
          filter: 'blur(8px)', animation: 'tm-breathe 2.6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 30, borderRadius: '50%',
          background: 'var(--accent-tint)', border: '0.5px solid var(--accent)' }} />
        <div style={{ position: 'relative', display: 'flex', gap: 5, alignItems: 'center', height: 56 }}>
          {[14,28,44,30,18,34,22].map((h, i) => (
            <span key={i} style={{ width: 4, borderRadius: 4, background: 'var(--accent-deep)',
              height: h, animation: `tm-breathe ${0.7 + (i%3)*0.25}s ease-in-out ${i*0.08}s infinite` }} />
          ))}
        </div>
      </div>

      <div className="tm-kicker" style={{ marginBottom: 14 }}>Listening</div>
      <div className="tm-display" style={{ fontSize: 27, textAlign: 'center', maxWidth: 300, minHeight: 64,
        fontWeight: 400 }}>{heard}<span style={{ opacity: 0.4 }}>|</span></div>

      <button className="tm-btn" onClick={() => onSubmit(phrase)} style={{ marginTop: 40,
        width: 76, height: 76, borderRadius: '50%', background: 'var(--accent-deep)', color: '#fff',
        boxShadow: '0 0 30px var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcCheck size={32} />
      </button>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 16, fontWeight: 300 }}>Tap when you’re done</div>
    </div>
  );
}

Object.assign(window, { CoachScreen, VoiceOverlay });
