import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Accent, Primary, Radius, Temple, Type } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatTarget, getTodaySession, type SessionExercise, type TodaySession } from '@/lib/session';

// Today — the authored session (Master Build Spec §5.3). Reads the seeded session from the DB;
// done-state + progress come straight from set_logs/session_exercises so they survive force-quit.
// Logging (the Log sheet, §5.4) is the next slice — the per-card button is a placeholder for now.

export default function TodayScreen() {
  const { session } = useAuth();
  const [data, setData] = useState<TodaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    let active = true;
    getTodaySession(userId).then((s) => {
      if (!active) return;
      setData(s);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={Primary.deep} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.empty}>No session yet. Pull up the coach to plan your day.</Text>
      </SafeAreaView>
    );
  }

  const total = data.exercises.length;
  const done = data.exercises.filter((e) => e.done).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerMeta}>
              <Text style={styles.kicker}>{"TODAY'S SESSION"}</Text>
              <Text style={styles.title}>{data.title}</Text>
              <Text style={styles.sub}>
                {total} movements · ~{data.duration ?? 45} min
              </Text>
            </View>
            <View style={styles.ring}>
              <Text style={styles.ringText}>
                {done}/{total}
              </Text>
            </View>
          </View>
          {data.note ? <Text style={styles.note}>{data.note}</Text> : null}
        </View>

        {data.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            expanded={expanded.has(ex.id)}
            onToggleSwap={() => toggle(ex.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExerciseCard({
  ex,
  expanded,
  onToggleSwap,
}: {
  ex: SessionExercise;
  expanded: boolean;
  onToggleSwap: () => void;
}) {
  return (
    <View style={[styles.card, ex.done && styles.cardDone]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardName}>{ex.movement}</Text>
        {ex.done ? (
          <View style={styles.donePill}>
            <SymbolView name="checkmark" tintColor={Accent.sage.deep} size={12} />
            <Text style={styles.doneText}>Done</Text>
          </View>
        ) : (
          <Pressable onPress={onToggleSwap} style={({ pressed }) => [styles.swap, pressed && styles.pressed]}>
            <Text style={styles.swapText}>{expanded ? 'Close' : 'Swap'}</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.cardTarget}>{formatTarget(ex)}</Text>
      {ex.last ? <Text style={styles.cardLast}>Last: {ex.last}</Text> : null}
      {ex.cue ? <Text style={styles.cardCue}>{ex.cue}</Text> : null}

      {expanded && ex.alt ? (
        <View style={styles.altBox}>
          <Text style={styles.altKicker}>INSTEAD</Text>
          <Text style={styles.altName}>{ex.alt.movement}</Text>
          {ex.alt.why ? <Text style={styles.altWhy}>{ex.alt.why}</Text> : null}
        </View>
      ) : null}

      {!ex.done ? (
        <Pressable style={({ pressed }) => [styles.logButton, pressed && styles.pressed]}>
          <Text style={styles.logText}>Log sets</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.marble },
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: Type.body, color: Temple.inkSoft, paddingHorizontal: Spacing.five, textAlign: 'center' },
  body: { padding: Spacing.four, gap: Spacing.three },

  header: { gap: Spacing.three },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerMeta: { gap: 3, flex: 1 },
  kicker: { fontFamily: Type.bodySemi, fontSize: 10, letterSpacing: 1.4, color: Primary.deep },
  title: { fontFamily: Type.display, fontSize: 30, color: Temple.ink, lineHeight: 34 },
  sub: { fontFamily: Type.body, fontSize: 14, color: Temple.inkSoft },
  ring: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: Primary.deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { fontFamily: Type.bodyMedium, fontSize: 14, color: Temple.ink },
  note: { fontFamily: Type.serifItalic, fontSize: 17, lineHeight: 24, color: Temple.inkSoft },

  card: {
    backgroundColor: Temple.paper,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardDone: { opacity: 0.66 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontFamily: Type.display, fontSize: 20, color: Temple.ink, flex: 1 },
  swap: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Accent.lavender.tint,
  },
  swapText: { fontFamily: Type.bodyMedium, fontSize: 13, color: Accent.lavender.deep },
  donePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontFamily: Type.bodyMedium, fontSize: 13, color: Accent.sage.deep },
  pressed: { opacity: 0.6 },

  cardTarget: { fontFamily: Type.body, fontSize: 16, color: Temple.ink },
  cardLast: { fontFamily: Type.body, fontSize: 14, color: Temple.inkFaint },
  cardCue: { fontFamily: Type.serifItalic, fontSize: 16, lineHeight: 22, color: Temple.inkSoft },

  altBox: {
    backgroundColor: Accent.lavender.tint,
    borderRadius: Radius.sm,
    padding: Spacing.three,
    gap: 4,
  },
  altKicker: { fontFamily: Type.bodySemi, fontSize: 10, letterSpacing: 1.4, color: Accent.lavender.deep },
  altName: { fontFamily: Type.bodyMedium, fontSize: 15, color: Temple.ink },
  altWhy: { fontFamily: Type.serifItalic, fontSize: 15, lineHeight: 21, color: Temple.inkSoft },

  logButton: {
    marginTop: Spacing.one,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Temple.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logText: { fontFamily: Type.bodyMedium, fontSize: 15, color: Temple.marble },
});
