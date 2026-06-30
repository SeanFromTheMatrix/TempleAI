import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  G,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Accent, Primary, Radius, Temple, Type } from '@/constants/temple';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  clearIssue,
  getBodyState,
  saveInjury,
  saveSoreness,
  type BodyState,
  type Severity,
  type SoreLevel,
} from '@/lib/body';
import { connectHealth, getRecovery, type Recovery } from '@/lib/health';
import { useProfile } from '@/lib/profile';

// Body — daily check-in (Master Build Spec §6). Readiness + an anatomical figure you tap to flag
// soreness (recovery, fades) or an injury (tracked, the coach protects it). Both persist to the
// `issues` table so the §7 coach memory reads them. Apple Health readiness metrics are deferred.

type AccentHue = (typeof Accent)[keyof typeof Accent];
const SEV_HUE: Record<Severity, AccentHue> = {
  mild: Accent.sage,
  moderate: Accent.gold,
  significant: Accent.lavender,
};
const SORE_HUE: Record<SoreLevel, AccentHue> = {
  light: Accent.sage,
  moderate: Accent.gold,
  heavy: Accent.lavender,
};

const SEVERITIES: { id: Severity; label: string; hue: AccentHue; desc: string }[] = [
  { id: 'mild', label: 'Mild', hue: Accent.sage, desc: 'Aware of it, training continues' },
  { id: 'moderate', label: 'Moderate', hue: Accent.gold, desc: 'Working around it deliberately' },
  { id: 'significant', label: 'Significant', hue: Accent.lavender, desc: 'Protecting it — coach adapts fully' },
];
const SORE_LEVELS: { id: SoreLevel; label: string; hue: AccentHue; desc: string }[] = [
  { id: 'light', label: 'Light', hue: Accent.sage, desc: 'A little tender — good to train' },
  { id: 'moderate', label: 'Moderate', hue: Accent.gold, desc: 'Noticeably sore — train smart' },
  { id: 'heavy', label: 'Heavy', hue: Accent.lavender, desc: 'Very sore — coach eases the volume' },
];

// ── The figure geometry (1:1 from the prototype, viewBox 260×480) ──
type Shape =
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; r: number };

const BODY_PARTS: Shape[] = [
  { type: 'circle', cx: 130, cy: 48, r: 25 },
  { type: 'rect', x: 121, y: 68, w: 18, h: 20, r: 8 },
  { type: 'ellipse', cx: 82, cy: 110, rx: 20, ry: 19 },
  { type: 'ellipse', cx: 178, cy: 110, rx: 20, ry: 19 },
  { type: 'rect', x: 86, y: 98, w: 88, h: 150, r: 34 },
  { type: 'rect', x: 55, y: 108, w: 24, h: 128, r: 12 },
  { type: 'rect', x: 181, y: 108, w: 24, h: 128, r: 12 },
  { type: 'rect', x: 90, y: 236, w: 80, h: 52, r: 24 },
  { type: 'rect', x: 95, y: 280, w: 32, h: 168, r: 16 },
  { type: 'rect', x: 133, y: 280, w: 32, h: 168, r: 16 },
];

type Region = { id: string; label: string; shape: Extract<Shape, { type: 'rect' }> };
const REGIONS: Region[] = [
  { id: 'neck', label: 'Neck', shape: { type: 'rect', x: 113, y: 60, w: 34, h: 30, r: 14 } },
  { id: 'shoulder', label: 'Shoulders', shape: { type: 'rect', x: 60, y: 92, w: 140, h: 32, r: 16 } },
  { id: 'chest', label: 'Chest', shape: { type: 'rect', x: 92, y: 116, w: 76, h: 50, r: 22 } },
  { id: 'elbow', label: 'Arms', shape: { type: 'rect', x: 52, y: 168, w: 156, h: 30, r: 14 } },
  { id: 'lowback', label: 'Lower back / core', shape: { type: 'rect', x: 92, y: 188, w: 76, h: 56, r: 22 } },
  { id: 'hip', label: 'Hips', shape: { type: 'rect', x: 90, y: 240, w: 80, h: 46, r: 22 } },
  { id: 'knee', label: 'Legs', shape: { type: 'rect', x: 92, y: 300, w: 76, h: 120, r: 16 } },
  { id: 'ankle', label: 'Ankles', shape: { type: 'rect', x: 92, y: 422, w: 76, h: 30, r: 12 } },
];

type Mark = { hue: AccentHue; strong: boolean };

function ShapeEl({
  s,
  ...props
}: { s: Shape } & React.ComponentProps<typeof Rect> & React.ComponentProps<typeof Circle>) {
  if (s.type === 'circle') return <Circle cx={s.cx} cy={s.cy} r={s.r} {...props} />;
  if (s.type === 'ellipse') return <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...props} />;
  return <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} ry={s.r} {...props} />;
}

const FIG_H = 332;
const FIG_W = (FIG_H * 260) / 480;

function BodyFigure({
  marks,
  selected,
  onSelect,
}: {
  marks: Record<string, Mark>;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Svg width={FIG_W} height={FIG_H} viewBox="0 0 260 480">
      <Defs>
        <LinearGradient id="bodyFill" x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0%" stopColor="#fbf8f2" />
          <Stop offset="100%" stopColor="#ece4d6" />
        </LinearGradient>
        <Filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
          <FeGaussianBlur stdDeviation="6" />
        </Filter>
      </Defs>

      <Ellipse cx={130} cy={464} rx={70} ry={9} fill="rgba(70,58,40,0.06)" />
      {BODY_PARTS.map((s, i) => (
        <ShapeEl key={`b${i}`} s={s} fill="url(#bodyFill)" stroke="rgba(44,40,35,0.07)" strokeWidth={1} />
      ))}

      {REGIONS.map((r) => {
        const m = marks[r.id];
        if (!m) return null;
        return (
          <G key={`g${r.id}`}>
            <ShapeEl s={r.shape} fill={m.hue.base} opacity={m.strong ? 0.5 : 0.28} filter="url(#soft)" />
            <ShapeEl
              s={r.shape}
              fill="none"
              stroke={m.hue.deep}
              strokeWidth={1.5}
              strokeDasharray={m.strong ? undefined : '3 4'}
              opacity={m.strong ? 0.9 : 0.7}
            />
          </G>
        );
      })}

      {selected
        ? (() => {
            const r = REGIONS.find((x) => x.id === selected);
            if (!r) return null;
            return (
              <ShapeEl
                s={r.shape}
                fill="none"
                stroke={Temple.ink}
                strokeWidth={1.5}
                strokeDasharray="3 4"
                opacity={0.5}
              />
            );
          })()
        : null}

      {REGIONS.map((r) => (
        <ShapeEl key={`h${r.id}`} s={r.shape} fill="transparent" onPress={() => onSelect(r.id)} />
      ))}
    </Svg>
  );
}

function ScreenHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.kicker}>BODY</Text>
      <Text style={styles.title}>How’s your body?</Text>
      <Text style={styles.sub}>Tap the figure, or check in below — what’s sore, what’s hurting.</Text>
    </View>
  );
}

// Readiness — an honest line from what's flagged, plus Apple Health recovery metrics when connected.
function Readiness({ state, recovery }: { state: BodyState; recovery: Recovery | null }) {
  const { injuries, soreness } = state;
  const sig = injuries.some((i) => i.severity === 'significant');
  const heavy = soreness.some((s) => s.level === 'heavy');

  let hue: AccentHue = Accent.sage;
  let word = 'Recovered';
  let line = 'Nothing sore, nothing flagged — a green light to train hard today.';
  if (sig) {
    hue = Accent.lavender;
    word = 'Adapted';
    line = `Protecting ${injuries.length} issue${injuries.length > 1 ? 's' : ''} — today’s plan is built around them.`;
  } else if (injuries.length) {
    hue = Accent.sky;
    word = 'Mindful';
    line = `Working around ${injuries.length} issue${injuries.length > 1 ? 's' : ''}. The coach keeps load off them.`;
  } else if (heavy) {
    hue = Accent.lavender;
    word = 'Recovering';
    line = 'Heavily sore — ease into today and let the volume come down.';
  } else if (soreness.length) {
    hue = Accent.gold;
    word = 'Primed';
    line = 'A little sore from recent work — train smart and it’ll settle.';
  }

  return (
    <View style={styles.glass}>
      <View style={[styles.halo, { backgroundColor: hue.base }]} />
      <View style={styles.readyTop}>
        <View style={[styles.dot, { backgroundColor: hue.deep }]} />
        <Text style={styles.readyKicker}>TODAY’S READINESS</Text>
        {recovery ? (
          <View style={styles.healthTag}>
            <SymbolView name="heart.fill" tintColor={Temple.inkFaint} size={11} />
            <Text style={styles.healthTagText}>Apple Health</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.readyWord}>{word}</Text>
      <Text style={styles.readyLine}>{line}</Text>
      {recovery && recovery.metrics.length ? (
        <View style={styles.metrics}>
          {recovery.metrics.map((m) => (
            <View key={m.id} style={styles.metric}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={styles.metricUnit}>{m.unit}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Prompt to wire Apple Health when it isn't connected yet — the gateway to readiness metrics.
function ConnectHealthCard({ onConnect }: { onConnect: () => void }) {
  return (
    <Pressable onPress={onConnect} style={({ pressed }) => [styles.connectCard, pressed && styles.pressed]}>
      <View style={styles.connectIcon}>
        <SymbolView name="heart.fill" tintColor={Primary.deep} size={22} />
      </View>
      <View style={styles.connectMeta}>
        <Text style={styles.connectTitle}>Connect Apple Health</Text>
        <Text style={styles.connectDesc}>
          Let the coach read your HRV & resting heart rate to set your readiness.
        </Text>
      </View>
      <SymbolView name="chevron.right" tintColor={Primary.deep} size={18} />
    </Pressable>
  );
}

function ScaleButton({
  hue,
  label,
  desc,
  on,
  onPress,
}: {
  hue: AccentHue;
  label: string;
  desc: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.scale,
        { backgroundColor: on ? hue.tint : Temple.surface, borderColor: on ? hue.base : Temple.line },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.scaleDot, { backgroundColor: hue.deep }]} />
      <View style={styles.scaleMeta}>
        <Text style={styles.scaleLabel}>{label}</Text>
        <Text style={styles.scaleDesc}>{desc}</Text>
      </View>
      {on ? <SymbolView name="checkmark" tintColor={hue.deep} size={18} /> : null}
    </Pressable>
  );
}

function sinceLabel(since: string | null): string {
  if (!since) return 'Tracking';
  const days = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 86_400_000));
  if (days === 0) return 'Flagged today';
  if (days === 1) return 'Tracking 1 day';
  return `Tracking ${days} days`;
}

type Intent = 'choose' | 'sore' | 'pain' | 'region' | null;
type AddTarget = 'choose' | 'sore' | 'pain';

export default function BodyScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const router = useRouter();
  const { profile, refresh } = useProfile();
  const healthConnected = !!profile?.health_connected;

  const [state, setState] = useState<BodyState>({ injuries: [], soreness: [] });
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent>(null);
  const [addTarget, setAddTarget] = useState<AddTarget>('choose');

  const load = useCallback(async () => {
    if (!userId) return;
    setState(await getBodyState(userId));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) return;
      getBodyState(userId).then((s) => {
        if (!active) return;
        setState(s);
        setLoading(false);
      });
      if (healthConnected) getRecovery().then((r) => active && setRecovery(r));
      return () => {
        active = false;
      };
    }, [userId, healthConnected]),
  );

  const doConnectHealth = async () => {
    if (!userId) return;
    try {
      const ok = await connectHealth(userId);
      await refresh();
      if (ok) setRecovery(await getRecovery());
    } catch {
      Alert.alert('Apple Health', 'Couldn’t connect to Apple Health. You can try again from here.');
    }
  };

  const region = REGIONS.find((r) => r.id === selected) ?? null;
  const existingInjury = state.injuries.find((i) => i.region === selected);
  const existingSore = state.soreness.find((s) => s.region === selected);

  // Figure marks: soreness soft, injuries strong (injuries win on a shared region).
  const marks: Record<string, Mark> = {};
  state.soreness.forEach((s) => {
    if (s.region) marks[s.region] = { hue: SORE_HUE[s.level], strong: false };
  });
  state.injuries.forEach((i) => {
    if (i.region) marks[i.region] = { hue: SEV_HUE[i.severity], strong: true };
  });

  const open = (id: string) => {
    setSelected(id);
    setIntent(state.injuries.some((i) => i.region === id) ? 'pain' : 'choose');
  };
  const close = () => {
    setSelected(null);
    setIntent(null);
  };
  const addArea = (target: AddTarget) => {
    setAddTarget(target);
    setSelected(null);
    setIntent('region');
  };
  const pickRegion = (id: string) => {
    setSelected(id);
    setIntent(addTarget);
  };

  const doSaveInjury = async (severity: Severity) => {
    if (!userId || !region) return;
    close();
    await saveInjury(userId, { region: region.id, label: region.label, severity });
    await load();
  };
  const doSaveSore = async (level: SoreLevel) => {
    if (!userId || !region) return;
    close();
    await saveSoreness(userId, { region: region.id, label: region.label, level });
    await load();
  };
  const doClear = async (id: string) => {
    close();
    await clearIssue(id);
    await load();
  };
  const talkToCoach = () => {
    close();
    router.navigate('/');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator color={Primary.deep} />
      </SafeAreaView>
    );
  }

  const panelOpen = selected !== null || intent === 'region';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <ScreenHeader />
        <Readiness state={state} recovery={recovery} />

        {!healthConnected ? <ConnectHealthCard onConnect={doConnectHealth} /> : null}

        <View style={styles.figureWrap}>
          <BodyFigure marks={marks} selected={selected} onSelect={open} />
        </View>

        {panelOpen ? (
          <View style={styles.glass}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>
                {intent === 'region'
                  ? addTarget === 'sore'
                    ? 'Log soreness'
                    : addTarget === 'pain'
                      ? 'Track an injury'
                      : 'Check in an area'
                  : (region?.label ?? '')}
              </Text>
              <Pressable onPress={close} hitSlop={8} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
                <SymbolView name="xmark" tintColor={Temple.inkSoft} size={18} />
              </Pressable>
            </View>

            {intent === 'region' ? (
              <>
                <Text style={styles.panelSub}>
                  {addTarget === 'sore'
                    ? 'Which area is sore?'
                    : addTarget === 'pain'
                      ? 'Which area needs protecting?'
                      : 'Which area? Then tell me what’s going on.'}
                </Text>
                <View style={styles.chips}>
                  {REGIONS.map((r) => {
                    const m = marks[r.id];
                    return (
                      <Pressable
                        key={r.id}
                        onPress={() => pickRegion(r.id)}
                        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                        {m ? <View style={[styles.chipDot, { backgroundColor: m.hue.deep }]} /> : null}
                        <Text style={styles.chipText}>{r.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {intent === 'choose' ? (
              <>
                <Text style={styles.panelSub}>What’s going on here?</Text>
                <View style={styles.choiceRow}>
                  <Pressable
                    onPress={() => setIntent('sore')}
                    style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
                    <SymbolView name="leaf" tintColor={Accent.sage.deep} size={22} />
                    <Text style={styles.choiceTitle}>Just sore</Text>
                    <Text style={styles.choiceDesc}>Training soreness — fades</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setIntent('pain')}
                    style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
                    <SymbolView name="sparkle" tintColor={Primary.deep} size={22} />
                    <Text style={styles.choiceTitle}>Something hurts</Text>
                    <Text style={styles.choiceDesc}>Pain to track & protect</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {intent === 'sore' ? (
              <>
                <Text style={styles.panelSub}>How sore is it?</Text>
                <View style={styles.scaleList}>
                  {SORE_LEVELS.map((l) => (
                    <ScaleButton
                      key={l.id}
                      hue={l.hue}
                      label={l.label}
                      desc={l.desc}
                      on={existingSore?.level === l.id}
                      onPress={() => doSaveSore(l.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {intent === 'pain' ? (
              <>
                <Text style={styles.panelSub}>How is it today?</Text>
                <View style={styles.scaleList}>
                  {SEVERITIES.map((sv) => (
                    <ScaleButton
                      key={sv.id}
                      hue={sv.hue}
                      label={sv.label}
                      desc={sv.desc}
                      on={existingInjury?.severity === sv.id}
                      onPress={() => doSaveInjury(sv.id)}
                    />
                  ))}
                </View>
                <Pressable
                  onPress={talkToCoach}
                  style={({ pressed }) => [styles.coachBtn, pressed && styles.pressed]}>
                  <SymbolView name="bubble.left.and.bubble.right" tintColor="#fff" size={18} />
                  <Text style={styles.coachBtnText}>Talk to coach about this</Text>
                </Pressable>
                {existingInjury ? (
                  <Pressable
                    onPress={() => doClear(existingInjury.id)}
                    style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}>
                    <Text style={styles.clearText}>It’s better — clear this</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => addArea('choose')}
              style={({ pressed }) => [styles.checkInBtn, pressed && styles.pressed]}>
              <SymbolView name="plus" tintColor={Primary.deep} size={18} />
              <Text style={styles.checkInText}>Check in an area</Text>
            </Pressable>

            {state.soreness.length > 0 ? (
              <View>
                <View style={styles.listHead}>
                  <Text style={styles.kicker}>RECOVERING · {state.soreness.length}</Text>
                  <Pressable onPress={() => addArea('sore')} style={({ pressed }) => [styles.addPill, pressed && styles.pressed]}>
                    <SymbolView name="plus" tintColor={Temple.inkSoft} size={12} />
                    <Text style={styles.addPillText}>Add</Text>
                  </Pressable>
                </View>
                {state.soreness.map((s, i) => (
                  <View key={s.id}>
                    <Pressable
                      onPress={() => {
                        if (s.region) {
                          setSelected(s.region);
                          setIntent('sore');
                        }
                      }}
                      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                      <View style={[styles.rowDot, { backgroundColor: SORE_HUE[s.level].deep }]} />
                      <View style={styles.rowMeta}>
                        <View style={styles.rowTitleLine}>
                          <Text style={styles.rowTitle}>{s.label}</Text>
                          <Text style={styles.rowTag}>{s.level} · sore</Text>
                        </View>
                        <Text style={styles.rowSub}>{s.level === 'heavy' ? 'Fresh in ~2 days' : 'Fresh in ~1 day'}</Text>
                      </View>
                      <Pressable
                        onPress={() => doClear(s.id)}
                        hitSlop={8}
                        style={({ pressed }) => [styles.rowClose, pressed && styles.pressed]}>
                        <SymbolView name="xmark" tintColor={Temple.inkFaint} size={15} />
                      </Pressable>
                    </Pressable>
                    {i < state.soreness.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {state.injuries.length > 0 ? (
              <View>
                <View style={styles.listHead}>
                  <Text style={styles.kicker}>TRACKED · {state.injuries.length}</Text>
                  <Pressable onPress={() => addArea('pain')} style={({ pressed }) => [styles.addPill, pressed && styles.pressed]}>
                    <SymbolView name="plus" tintColor={Temple.inkSoft} size={12} />
                    <Text style={styles.addPillText}>Add</Text>
                  </Pressable>
                </View>
                {state.injuries.map((iss, i) => (
                  <View key={iss.id}>
                    <Pressable
                      onPress={() => iss.region && open(iss.region)}
                      style={({ pressed }) => [styles.row, { alignItems: 'flex-start' }, pressed && styles.pressed]}>
                      <View style={[styles.rowDot, { backgroundColor: SEV_HUE[iss.severity].deep, marginTop: 5 }]} />
                      <View style={styles.rowMeta}>
                        <View style={styles.rowTitleLine}>
                          <Text style={styles.rowTitle}>{iss.label}</Text>
                          <View style={[styles.sevChip, { backgroundColor: SEV_HUE[iss.severity].tint, borderColor: SEV_HUE[iss.severity].base }]}>
                            <Text style={[styles.sevChipText, { color: SEV_HUE[iss.severity].deep }]}>{iss.severity}</Text>
                          </View>
                        </View>
                        <Text style={styles.rowNote}>
                          {iss.note ?? 'Flagged — the coach will adapt your sessions around it.'}
                        </Text>
                        <Text style={styles.rowSince}>{sinceLabel(iss.since)}</Text>
                      </View>
                    </Pressable>
                    {i < state.injuries.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {state.injuries.length === 0 && state.soreness.length === 0 ? (
              <Text style={styles.allClear}>All clear. Check in above if anything needs attention.</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.marble },
  center: { alignItems: 'center', justifyContent: 'center' },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
  },

  header: { gap: 3 },
  kicker: { fontFamily: Type.bodySemi, fontSize: 10, letterSpacing: 1.4, color: Primary.deep },
  title: { fontFamily: Type.display, fontSize: 30, color: Temple.ink, lineHeight: 34 },
  sub: { fontFamily: Type.body, fontSize: 14, color: Temple.inkSoft },

  glass: {
    backgroundColor: Temple.surface,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  halo: { position: 'absolute', right: -50, top: -60, width: 180, height: 180, borderRadius: 90, opacity: 0.4 },

  readyTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  readyKicker: { fontFamily: Type.bodySemi, fontSize: 10, letterSpacing: 1.2, color: Temple.inkFaint },
  readyWord: { fontFamily: Type.display, fontSize: 30, color: Temple.ink, lineHeight: 32 },
  readyLine: { fontFamily: Type.serifItalic, fontSize: 18, lineHeight: 24, color: Temple.inkSoft, marginTop: 5 },
  healthTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' },
  healthTagText: { fontFamily: Type.body, fontSize: 10.5, letterSpacing: 0.6, color: Temple.inkFaint },

  metrics: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Temple.line,
  },
  metric: { flex: 1 },
  metricLabel: { fontFamily: Type.bodySemi, fontSize: 10.5, letterSpacing: 0.8, color: Temple.inkFaint, marginBottom: 4 },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  metricValue: { fontFamily: Type.body, fontSize: 20, color: Temple.ink },
  metricUnit: { fontFamily: Type.body, fontSize: 11, color: Temple.inkFaint },

  connectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Temple.paper,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  connectIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Primary.tint,
    borderWidth: 0.5,
    borderColor: Primary.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectMeta: { flex: 1, gap: 2 },
  connectTitle: { fontFamily: Type.body, fontSize: 15.5, color: Temple.ink },
  connectDesc: { fontFamily: Type.body, fontSize: 12.5, color: Temple.inkSoft },

  figureWrap: { alignItems: 'center', paddingVertical: Spacing.two },

  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { fontFamily: Type.display, fontSize: 26, color: Temple.ink, flex: 1 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Temple.paper,
    borderWidth: 0.5,
    borderColor: Temple.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelSub: { fontFamily: Type.body, fontSize: 13, color: Temple.inkSoft, marginTop: 6, marginBottom: Spacing.two },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    backgroundColor: Temple.paper,
    borderWidth: 0.5,
    borderColor: Temple.line,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: Type.body, fontSize: 14.5, color: Temple.ink },

  choiceRow: { flexDirection: 'row', gap: Spacing.two },
  choice: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.sm,
    backgroundColor: Temple.paper,
    borderWidth: 0.5,
    borderColor: Temple.line,
    gap: 4,
  },
  choiceTitle: { fontFamily: Type.body, fontSize: 16, color: Temple.ink, marginTop: 8 },
  choiceDesc: { fontFamily: Type.body, fontSize: 12, color: Temple.inkSoft },

  scaleList: { gap: 9 },
  scale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
  },
  scaleDot: { width: 14, height: 14, borderRadius: 7 },
  scaleMeta: { flex: 1 },
  scaleLabel: { fontFamily: Type.body, fontSize: 15.5, color: Temple.ink },
  scaleDesc: { fontFamily: Type.body, fontSize: 12.5, color: Temple.inkSoft, marginTop: 1 },

  coachBtn: {
    marginTop: Spacing.three,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: Primary.deep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  coachBtnText: { fontFamily: Type.bodyMedium, fontSize: 15, color: '#fff' },
  clearBtn: {
    marginTop: 9,
    paddingVertical: 11,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: Temple.line,
    alignItems: 'center',
  },
  clearText: { fontFamily: Type.body, fontSize: 13.5, color: Temple.inkSoft },

  checkInBtn: {
    height: 54,
    borderRadius: Radius.sm,
    backgroundColor: Temple.surface,
    borderWidth: 0.5,
    borderColor: Primary.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  checkInText: { fontFamily: Type.bodyMedium, fontSize: 15, color: Primary.deep },

  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.two, paddingBottom: 4 },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: Temple.line,
  },
  addPillText: { fontFamily: Type.body, fontSize: 12, color: Temple.inkSoft },

  row: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 2 },
  rowDot: { width: 11, height: 11, borderRadius: 6 },
  rowMeta: { flex: 1 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowTitle: { fontFamily: Type.body, fontSize: 16, color: Temple.ink, flexShrink: 1 },
  rowTag: { fontFamily: Type.body, fontSize: 12.5, color: Temple.inkSoft, textTransform: 'capitalize' },
  rowSub: { fontFamily: Type.body, fontSize: 12, color: Temple.inkFaint, marginTop: 3 },
  rowNote: { fontFamily: Type.serifItalic, fontSize: 16.5, lineHeight: 22, color: Temple.inkSoft, marginTop: 5 },
  rowSince: { fontFamily: Type.body, fontSize: 11.5, color: Temple.inkFaint, marginTop: 6 },
  rowClose: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  sevChip: { paddingVertical: 2, paddingHorizontal: 9, borderRadius: Radius.pill, borderWidth: 0.5 },
  sevChipText: { fontFamily: Type.bodyMedium, fontSize: 11, textTransform: 'capitalize' },

  divider: { height: 0.5, backgroundColor: Temple.line, opacity: 0.6 },
  allClear: {
    fontFamily: Type.serifItalic,
    fontSize: 19,
    color: Temple.inkFaint,
    textAlign: 'center',
    paddingVertical: 22,
  },
  pressed: { opacity: 0.6 },
});
