import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  FeGaussianBlur,
  Filter,
  Line,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { Accent, Primary, Radius, Temple, Type } from '@/constants/temple';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  getProgress,
  pointsInRange,
  RANGES,
  trendOf,
  type LiftSeries,
  type Range,
  type Trend,
} from '@/lib/progress';

// Progress — the long path (Master Build Spec §6 / progress.jsx). Each lift's estimated-1RM traces
// a softly glowing line; the coach reads the trend in a calm, honest register. Plan-changing actions
// (the prototype's commit buttons) and adherence wait on session-generation + planned-session data.

type AccentHue = (typeof Accent)[keyof typeof Accent];
const UNIT = 'lb';

const TREND: Record<Trend, { hue: AccentHue; mark: string }> = {
  rising: { hue: Accent.sage, mark: '▲' },
  holding: { hue: Accent.gold, mark: '—' },
  easing: { hue: Accent.lavender, mark: '▼' },
};

const NOTE: Record<Trend, { hue: AccentHue; title: string; body: string }> = {
  rising: {
    hue: Accent.sage,
    title: 'STEADY, HONEST GAINS',
    body: 'No spikes, no crashes — the curve that reaches your goal without breaking you. Keep showing up.',
  },
  holding: {
    hue: Accent.lavender,
    title: 'A PLATEAU IS INFORMATION',
    body: "You've adapted to this stimulus — that's not failure, it's a signal. Change one variable: tempo, range of motion, or a small honest load jump. The line moves again.",
  },
  easing: {
    hue: Accent.gold,
    title: 'EASING, ON PURPOSE',
    body: "Numbers drift down sometimes — fatigue, a busy stretch, a deliberate deload. We read it calmly and adjust. The long path isn't a straight line.",
  },
};

const CHART_W = Dimensions.get('window').width - Spacing.four * 2 - 20;
const CHART_H = Math.round(CHART_W * 0.5);

// Catmull-rom → cubic bezier, so the line reads like a smooth saber trail rather than zig-zags.
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function GlowChart({ values, hue }: { values: number[]; hue: AccentHue }) {
  const padX = 8;
  const padTop = 18;
  const padBot = 16;
  const innerW = CHART_W - padX * 2;
  const innerH = CHART_H - padTop - padBot;
  // Floor the y-domain to a fraction of the lift's magnitude so a near-flat stretch reads flat
  // instead of amplifying a 1 lb wiggle into a rollercoaster; pad it so the line clears the edges.
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const domSpan = Math.max(hi - lo, Math.max(hi, 1) * 0.12);
  const pad = domSpan * 0.18;
  const mid = (lo + hi) / 2;
  const dMin = mid - domSpan / 2 - pad;
  const range = domSpan + pad * 2 || 1;

  const pts: [number, number][] = values.map((v, i) => {
    const x = padX + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
    const y = padTop + innerH - ((v - dMin) / range) * innerH;
    return [x, y];
  });

  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const area = `${line} L ${last[0]} ${padTop + innerH} L ${pts[0][0]} ${padTop + innerH} Z`;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={hue.deep} stopOpacity="0.22" />
          <Stop offset="100%" stopColor={hue.base} stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={hue.base} />
          <Stop offset="100%" stopColor={hue.deep} />
        </LinearGradient>
        <Filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <FeGaussianBlur stdDeviation="5" />
        </Filter>
      </Defs>

      {[0, 0.5, 1].map((g, i) => (
        <Line
          key={i}
          x1={padX}
          x2={CHART_W - padX}
          y1={padTop + innerH * g}
          y2={padTop + innerH * g}
          stroke={Temple.line}
          strokeWidth={1}
          strokeDasharray={i === 2 ? undefined : '2 5'}
        />
      ))}

      <Path d={area} fill="url(#area)" />
      <Path d={line} fill="none" stroke={hue.base} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} filter="url(#glow)" />
      <Path d={line} fill="none" stroke="url(#stroke)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      <Circle cx={last[0]} cy={last[1]} r={9} fill={hue.base} opacity={0.3} filter="url(#glow)" />
      <Circle cx={last[0]} cy={last[1]} r={4.5} fill={Temple.paper} stroke={hue.deep} strokeWidth={2} />
    </Svg>
  );
}

export default function ProgressScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const router = useRouter();

  const [series, setSeries] = useState<LiftSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('90d');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) return;
      getProgress(userId).then((s) => {
        if (!active) return;
        setSeries(s);
        setSelected((cur) => cur ?? s[0]?.movement ?? null);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  const lift = useMemo(
    () => series.find((s) => s.movement === selected) ?? series[0] ?? null,
    [series, selected],
  );
  const windowed = useMemo(() => (lift ? pointsInRange(lift.points, range) : []), [lift, range]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator color={Primary.deep} />
      </SafeAreaView>
    );
  }

  // No logged history yet — the honest empty state.
  if (series.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <SymbolView name="chart.line.uptrend.xyaxis" tintColor={Accent.lavender.deep} size={30} />
          </View>
          <Text style={styles.emptyTitle}>The path starts here</Text>
          <Text style={styles.emptyLine}>
            Once you’ve logged a few sessions, your lifts trace a line right here — and the coach reads
            what’s moving and what’s stuck.
          </Text>
          <Pressable
            onPress={() => router.navigate('/today')}
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}>
            <Text style={styles.emptyBtnText}>Go to today’s session</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const values = windowed.map((p) => p.value);
  const current = values[values.length - 1] ?? 0;
  const peak = values.length ? Math.max(...values) : 0;
  const change = values.length ? current - values[0] : 0;
  const trend = trendOf(windowed);
  const tr = TREND[trend];
  const note = NOTE[trend];
  const enough = values.length >= 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>PROGRESS</Text>
          <Text style={styles.title}>The long path</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selector}>
          {series.map((s) => {
            const on = s.movement === lift?.movement;
            return (
              <Pressable
                key={s.movement}
                onPress={() => setSelected(s.movement)}
                style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.movement}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.headline}>
          <View>
            <Text style={styles.headLabel}>Estimated 1RM · current</Text>
            <View style={styles.headValueRow}>
              <Text style={styles.headValue}>{current}</Text>
              <Text style={styles.headUnit}>{UNIT}</Text>
            </View>
          </View>
          <View style={styles.headRight}>
            <View style={[styles.trendPill, { backgroundColor: tr.hue.tint, borderColor: tr.hue.base }]}>
              <Text style={[styles.trendMark, { color: tr.hue.deep }]}>{tr.mark}</Text>
              <Text style={styles.trendText}>
                {trend === 'holding' ? 'holding' : `${change >= 0 ? '+' : ''}${change} ${UNIT}`}
              </Text>
            </View>
            <Text style={styles.peak}>
              peak {peak} {UNIT}
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          {enough ? (
            <GlowChart values={values} hue={tr.hue} />
          ) : (
            <Text style={styles.thin}>Not enough history yet for a line — keep logging this lift.</Text>
          )}
        </View>

        <View style={styles.ranges}>
          {RANGES.map((r) => {
            const on = r.id === range;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRange(r.id)}
                style={({ pressed }) => [styles.rangeTab, on && styles.rangeTabOn, pressed && styles.pressed]}>
                <Text style={[styles.rangeText, on && styles.rangeTextOn]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.noteCard}>
          <View style={[styles.noteIcon, { backgroundColor: note.hue.tint, borderColor: note.hue.base }]}>
            <SymbolView name="sparkle" tintColor={note.hue.deep} size={15} />
          </View>
          <View style={styles.noteMeta}>
            <Text style={styles.noteTitle}>{note.title}</Text>
            <Text style={styles.noteBody}>{note.body}</Text>
          </View>
        </View>
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

  selector: { gap: 9, paddingVertical: 2 },
  chip: {
    borderRadius: Radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: Temple.surface,
    borderWidth: 0.5,
    borderColor: Temple.line,
  },
  chipOn: { backgroundColor: Primary.tint, borderColor: Primary.base },
  chipText: { fontFamily: Type.body, fontSize: 13.5, color: Temple.inkSoft },
  chipTextOn: { color: Temple.ink },

  headline: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headLabel: { fontFamily: Type.body, fontSize: 13, color: Temple.inkSoft, marginBottom: 4 },
  headValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  headValue: { fontFamily: Type.display, fontSize: 54, color: Temple.ink, lineHeight: 50 },
  headUnit: { fontFamily: Type.body, fontSize: 18, color: Temple.inkFaint },
  headRight: { alignItems: 'flex-end', paddingBottom: 6 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
  },
  trendMark: { fontFamily: Type.body, fontSize: 13 },
  trendText: { fontFamily: Type.bodyMedium, fontSize: 14, color: Temple.ink },
  peak: { fontFamily: Type.body, fontSize: 11.5, color: Temple.inkFaint, marginTop: 7 },

  chartCard: {
    backgroundColor: Temple.paper,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: 10,
    overflow: 'hidden',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thin: { fontFamily: Type.serifItalic, fontSize: 17, color: Temple.inkFaint, textAlign: 'center', padding: Spacing.three },

  ranges: { flexDirection: 'row', gap: 8 },
  rangeTab: {
    flex: 1,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  rangeTabOn: { backgroundColor: Temple.paper, borderColor: Temple.line },
  rangeText: { fontFamily: Type.body, fontSize: 13.5, color: Temple.inkSoft },
  rangeTextOn: { color: Temple.ink },

  noteCard: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
    backgroundColor: Temple.surface,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  noteIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noteMeta: { flex: 1 },
  noteTitle: { fontFamily: Type.bodySemi, fontSize: 11, letterSpacing: 2, color: Temple.inkFaint, marginBottom: 6 },
  noteBody: { fontFamily: Type.serifItalic, fontSize: 18, lineHeight: 25, color: Temple.inkSoft },

  emptyWrap: { alignItems: 'center', paddingHorizontal: Spacing.five, gap: Spacing.two },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Accent.lavender.tint,
    borderWidth: 0.5,
    borderColor: Accent.lavender.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: { fontFamily: Type.display, fontSize: 28, color: Temple.ink, textAlign: 'center' },
  emptyLine: { fontFamily: Type.serifItalic, fontSize: 18, lineHeight: 25, color: Temple.inkSoft, textAlign: 'center' },
  emptyBtn: {
    marginTop: Spacing.three,
    height: 50,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: Primary.base,
    backgroundColor: Primary.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: { fontFamily: Type.bodyMedium, fontSize: 15, color: Primary.deep },
  pressed: { opacity: 0.6 },
});
