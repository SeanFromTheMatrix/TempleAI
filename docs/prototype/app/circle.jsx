// circle.jsx — the courtyard. The people on the path beside you.
// Presence over performance. Your private body (the sanctum) lives behind a
// clear wall: only presence crosses into the courtyard, never your injuries.

// A friend, rendered as initials in soft glass with their own saber hue.
function FriendToken({ friend, size = 46, live, dim }) {
  const hue = friend.hue || 'sky';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: -3, borderRadius: '50%',
        background: `radial-gradient(circle, var(--${hue}) 0%, rgba(255,255,255,0) 70%)`,
        opacity: dim ? 0.25 : 0.55 }} />
      <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%',
        background: `var(--${hue}-tint)`, border: `0.5px solid var(--${hue})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink)', fontSize: size * 0.34, fontWeight: 400, letterSpacing: '0.02em' }}>
        {friend.initials}
      </div>
      {live && <span style={{ position: 'absolute', right: -1, bottom: -1, width: 13, height: 13,
        borderRadius: '50%', background: 'var(--sage-deep)', border: '2px solid var(--paper)',
        boxShadow: '0 0 7px var(--sage)' }} />}
    </div>
  );
}

const KIND = {
  training:  { hue: 'sage',     tag: 'Training now',  Icon: IcDumbbell },
  pr:        { hue: 'gold',     tag: 'New best',  Icon: IcFlame },
  session:   { hue: 'sky',      tag: 'Trained',   Icon: IcCheck },
  protected: { hue: 'lavender', tag: 'Protected', Icon: IcLeaf },
  rest:      { hue: 'sage',     tag: 'Rested',    Icon: IcHeart },
  returned:  { hue: 'gold',     tag: 'Returned',  Icon: IcSpark },
};

// A single courtyard entry — what a friend did, and a way to send presence back.
function FeedCard({ item, friend, lively, sent, onSend }) {
  const k = KIND[item.kind] || KIND.session;
  const [picking, setPicking] = React.useState(false);
  const words = TEMPLE_DATA.circle.words;
  const live = item.kind === 'training';
  const celebrate = lively && (item.kind === 'pr' || item.kind === 'returned');

  return (
    <div className="tm-rise" style={{ position: 'relative', borderRadius: 'var(--radius)', padding: '16px 17px',
      background: celebrate ? `var(--${k.hue}-tint)` : 'var(--paper)',
      border: celebrate ? `0.5px solid var(--${k.hue})` : '0.5px solid var(--line)',
      boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {celebrate && <Halo hue={k.hue} size={150} opacity={0.4} style={{ right: -50, top: -60 }} />}
      <div style={{ position: 'relative', display: 'flex', gap: 13, alignItems: 'flex-start' }}>
        <FriendToken friend={friend} live={live} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 16, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', minWidth: 0 }}>{friend.name}</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 300, flexShrink: 0 }}>{item.when}</span>
          </div>
          {/* kind tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 7,
            padding: '3px 10px 3px 8px', borderRadius: 9999, background: `var(--${k.hue}-tint)`,
            border: `0.5px solid var(--${k.hue})`, color: `var(--${k.hue}-deep)` }}>
            {live ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sage-deep)',
              boxShadow: '0 0 6px var(--sage)', animation: 'tm-breathe 1.6s ease-in-out infinite' }} />
              : <k.Icon size={13} sw={1.6} />}
            <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k.tag}</span>
          </div>
          <div style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 400, marginTop: 9 }}>{item.title}</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: 'italic',
            color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.36, textWrap: 'pretty' }}>{item.line}</div>

          {/* presence back — send a quiet word */}
          <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
            {sent ? (
              <div className="tm-fade" style={{ display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--accent-deep)', fontSize: 13.5 }}>
                <IcCheck size={16} sw={2} /> <span style={{ color: 'var(--ink-soft)' }}>You sent “{sent}”</span>
              </div>
            ) : picking ? (
              <div className="tm-fade" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {words.map(w => (
                  <button key={w} className="tm-btn" onClick={() => { onSend(w); setPicking(false); }} style={{
                    padding: '7px 13px', borderRadius: 9999, fontSize: 13, fontWeight: 300, color: 'var(--ink)',
                    background: 'var(--surface)', border: '0.5px solid var(--accent)' }}>{w}</button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="tm-btn" onClick={() => setPicking(true)} style={{ display: 'inline-flex',
                  alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 9999, background: 'var(--surface)',
                  border: '0.5px solid var(--line)', color: 'var(--ink-soft)', fontSize: 13.5 }}>
                  <IcSpark size={15} sw={1.5} /> Send a quiet word</button>
                {lively && typeof item.kudos === 'number' && item.kudos > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5,
                    color: 'var(--ink-faint)', fontWeight: 300 }}>
                    <IcSpark size={13} sw={1.5} style={{ color: 'var(--accent-deep)' }} />
                    {item.kudos} cheered</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// The presence banner — who's on the path today, including you.
// Presence is ACTIVITY, never location: it reflects active sessions, and you
// control who (if anyone) can see yours.
const VIS_LABEL = { circle: 'Circle can see', friends: 'Close friends', off: 'Hidden' };

function PresenceBanner({ friends, me, myLive, onToggleLive, visibility, onCycleVisibility }) {
  const youToken = { id: 'me', initials: me.initials, hue: me.hue };
  const stack = [youToken, ...friends.slice(0, 3)];
  const friendNames = friends.filter(f => f.now).map(f => f.name.split(' ')[0]);
  const liveNames = (myLive && visibility !== 'off' ? ['You'] : []).concat(friendNames);
  const hidden = visibility === 'off';
  return (
    <div className="tm-glass" style={{ borderRadius: 'var(--radius-lg)', padding: '17px 19px',
      position: 'relative', overflow: 'hidden' }}>
      <Halo hue={myLive ? 'sage' : 'sage'} size={170} opacity={0.32} style={{ right: -50, top: -60 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          {/* stacked tokens — you first */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {stack.map((f, i) => (
              <div key={f.id} style={{ marginLeft: i === 0 ? 0 : -14, zIndex: stack.length - i }}>
                <FriendToken friend={f} size={40} live={i === 0 ? (myLive && !hidden) : !!f.now} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis' }}>You + {friends.length} on the path</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {liveNames.length ? `${liveNames.join(', ')} training now` : 'A quiet day among your friends'}</div>
          </div>
          {/* streak chip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
            padding: '5px 11px 5px 9px', borderRadius: 9999, background: 'var(--gold-tint)',
            border: '0.5px solid var(--gold)' }}>
            <span style={{ color: 'var(--gold-deep)' }}><IcFlame size={14} sw={1.6} /></span>
            <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500,
              fontVariantNumeric: 'tabular-nums' }}>{me.streak}</span>
          </div>
        </div>

        {/* YOUR presence — status + who can see it */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 15, paddingTop: 14,
          borderTop: '1px solid var(--line)' }}>
          <button className="tm-btn" onClick={onToggleLive} style={{ display: 'inline-flex', alignItems: 'center',
            gap: 9, padding: '8px 14px 8px 12px', borderRadius: 9999,
            background: myLive ? 'var(--sage-tint)' : 'var(--surface)',
            border: myLive ? '0.5px solid var(--sage)' : '0.5px solid var(--line)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%',
              background: myLive ? 'var(--sage-deep)' : 'var(--ink-ghost)',
              boxShadow: myLive ? '0 0 7px var(--sage)' : 'none',
              animation: myLive ? 'tm-breathe 1.8s ease-in-out infinite' : 'none' }} />
            <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>{myLive ? 'Training now' : 'Resting'}</span>
          </button>
          <button className="tm-btn" onClick={onCycleVisibility} title="Who can see your activity"
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 13px', borderRadius: 9999, background: 'var(--surface)',
              border: '0.5px solid var(--line)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%',
              background: hidden ? 'var(--ink-ghost)' : 'var(--accent-deep)',
              boxShadow: hidden ? 'none' : '0 0 6px var(--accent)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{VIS_LABEL[visibility]}</span>
            <IcChevDown size={13} sw={1.6} style={{ color: 'var(--ink-faint)' }} />
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 9, lineHeight: 1.45,
          display: 'flex', alignItems: 'center', gap: 7 }}>
          <IcHeart size={12} sw={1.6} style={{ flexShrink: 0, color: 'var(--ink-ghost)' }} />
          <span>{myLive
            ? (hidden ? 'You’re training — hidden from your circle right now.'
                      : 'Your circle sees you’re in a session — never your location.')
            : 'Turns on when you start a session. Shows when you train, never where.'}</span>
        </div>
      </div>
    </div>
  );
}

function InviteCard({ onInvite }) {
  return (
    <button className="tm-btn tm-card" onClick={onInvite} style={{ width: '100%', textAlign: 'left',
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
      <span style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: 'var(--accent-tint)',
        border: '0.5px solid var(--accent)', color: 'var(--accent-deep)', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}><IcPlus size={22} sw={1.6} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>Invite your friends</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 300, marginTop: 1 }}>
          Training is easier with company</div>
      </div>
      <span style={{ color: 'var(--accent-deep)' }}><IcChevR size={18} /></span>
    </button>
  );
}

function CircleFriends({ firstRun, social, extraFeed, onInvite }) {
  const C = TEMPLE_DATA.circle;
  const [sent, setSent] = React.useState({});
  const [myLive, setMyLive] = React.useState(false);
  const VIS = ['circle', 'friends', 'off'];
  const [visibility, setVisibility] = React.useState('circle');
  const cycleVis = () => setVisibility(v => VIS[(VIS.indexOf(v) + 1) % VIS.length]);
  const lively = social === 'lively';
  const feed = [...(extraFeed || []), ...C.feed];
  const friendById = (id) => id === 'me'
    ? { name: 'You', initials: C.me.initials, hue: C.me.hue }
    : C.friends.find(f => f.id === id) || { name: 'A friend', initials: '··', hue: 'sky' };

  if (firstRun) {
    return (
      <EmptyState hue="sage" icon={<IcUsers size={34} sw={1.4} />} kicker="Circle"
        title="It’s quiet here"
        line="Temple is better walked with company. Invite a friend and you’ll see each other show up — streaks, sessions, the honest days too."
        action={<><IcPlus size={19} sw={1.7} /> Invite friends</>} onAction={onInvite}
        secondary="Find people by username" onSecondary={onInvite} />
    );
  }

  return (
    <div className="tm-scroll" style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
      {/* My Status */}
      <div style={{ padding: '8px 24px 0' }}>
        <div className="tm-kicker" style={{ padding: '6px 0 12px' }}>My Status</div>
        <PresenceBanner friends={C.friends} me={C.me} myLive={myLive}
          onToggleLive={() => setMyLive(v => !v)} visibility={visibility} onCycleVisibility={cycleVis} />
      </div>

      {/* Friends */}
      <div style={{ padding: '8px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px' }}>
          <div className="tm-kicker">Friends</div>
          <button className="tm-btn" onClick={onInvite} aria-label="Invite" style={{ width: 36, height: 36,
            borderRadius: '50%', background: 'var(--surface)', border: '0.5px solid var(--line)',
            color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcPlus size={20} sw={1.6} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feed.map(item => (
            <FeedCard key={item.id} item={item} friend={friendById(item.who)} lively={lively}
              sent={sent[item.id]} onSend={(w) => setSent(s => ({ ...s, [item.id]: w }))} />
          ))}
        </div>
        <div style={{ marginTop: 14 }}><InviteCard onInvite={onInvite} /></div>
        <div style={{ textAlign: 'center', padding: '22px 0 4px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic',
            color: 'var(--ink-faint)', textWrap: 'pretty' }}>
            Only what you choose to share reaches your friends. Your body stays yours.</div>
        </div>
      </div>
    </div>
  );
}

// The tab: a quiet segmented control between the courtyard (shared) and your body (private).
function CircleScreen({ firstRun, social, hub, health, seg: segProp, onSeg, extraFeed, onConnectHealth, onTalkToCoach, onInvite }) {
  const [segLocal, setSegLocal] = React.useState('friends');
  const seg = segProp || segLocal;
  const setSeg = (v) => { setSegLocal(v); onSeg && onSeg(v); };
  const segs = [
    { id: 'friends', label: hub || 'Social' },
    { id: 'body', label: 'Your body' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* segmented control */}
      <div style={{ flexShrink: 0, padding: '4px 24px 10px' }}>
        <div className="tm-glass" style={{ borderRadius: 9999, padding: 4, display: 'flex', gap: 4 }}>
          {segs.map(s => {
            const on = seg === s.id;
            return (
              <button key={s.id} className="tm-btn" onClick={() => setSeg(s.id)} style={{ flex: 1, height: 40,
                borderRadius: 9999, fontSize: 14, fontWeight: on ? 500 : 400,
                color: on ? 'var(--ink)' : 'var(--ink-soft)',
                background: on ? 'var(--paper)' : 'transparent',
                border: on ? '0.5px solid var(--line)' : '0.5px solid transparent',
                boxShadow: on ? 'var(--shadow-sm)' : 'none' }}>{s.label}</button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {seg === 'friends'
          ? <CircleFriends firstRun={firstRun} social={social} extraFeed={extraFeed} onInvite={onInvite} />
          : <BodyScreen health={health} onConnectHealth={onConnectHealth} onTalkToCoach={onTalkToCoach} />}
      </div>
    </div>
  );
}

Object.assign(window, { CircleScreen, CircleFriends, FriendToken });
