import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import BottomSheet from '@/components/bottom-sheet';
import LogSheet from '@/components/log-sheet';
import SummarySheet from '@/components/summary-sheet';
import { Accent, Primary, Radius, Temple, Type } from '@/constants/temple';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { flagDiscomfort } from '@/lib/coach';
import {
  formatTarget,
  getTodaySession,
  skipExercise,
  swapExercise,
  type SessionExercise,
  type TodaySession,
} from '@/lib/session';

// Today — the authored session (Master Build Spec §5.3). Reads the seeded session from the DB;
// done-state + progress come straight from set_logs/session_exercises so they survive force-quit.
// Logging (the Log sheet, §5.4) is the next slice — the per-card button is a placeholder for now.

export default function TodayScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [data, setData] = useState<TodaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<SessionExercise | null>(null);
  const [adjustExercise, setAdjustExercise] = useState<SessionExercise | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Surface a coach notice and pull it into view — the banner lives at the top, so without this
  // an action taken on a scrolled-down card reads as a dead tap.
  const showNotice = (text: string) => {
    setNotice(text);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Refresh after logging (called from event handlers, not an effect).
  const load = useCallback(async () => {
    if (!userId) return;
    setData(await getTodaySession(userId));
  }, [userId]);

  // Initial / dep load — promise-chained so setState never runs synchronously in the effect.
  useEffect(() => {
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
  }, [userId]);

  // Adjust actions (§5.3). Each mutates the DB, dismisses the sheet, surfaces a coach notice, and reloads.
  const doSwap = async (ex: SessionExercise) => {
    setAdjustExercise(null);
    await swapExercise(ex);
    showNotice(ex.alt?.why ?? `Swapped ${ex.movement} for a kinder alternative.`);
    await load();
  };

  const doHurt = async (ex: SessionExercise) => {
    setAdjustExercise(null);
    const easedTo = ex.alt?.movement ?? null;
    if (ex.alt) {
      // There's a gentler alternative — ease into it.
      await swapExercise(ex);
      showNotice(
        `Thank you for telling me. I’ve eased ${ex.movement} into ${easedTo} and noted it — ` +
          `we protect the joint, always.`,
      );
    } else {
      // Already on the gentlest option (or no preset swap): be honest — nothing to ease to here.
      showNotice(
        `Noted — I’ve flagged ${ex.movement}. There’s no gentler swap left for it, so tell me more ` +
          `in Coach and I’ll rework it around you.`,
      );
    }
    // Remember it in the one coach thread so the next coach turn reads the flag (§5.3 / §7).
    if (userId && data) {
      await flagDiscomfort(userId, { movement: ex.movement, sessionId: data.id, eased: easedTo });
    }
    await load();
  };

  const doSkip = async (ex: SessionExercise) => {
    setAdjustExercise(null);
    await skipExercise(ex);
    showNotice(
      `Skipped ${ex.movement}. One movement won’t make or break you — rest it and we go again next time.`,
    );
    await load();
  };

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
      <ScrollView ref={scrollRef} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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

        {notice ? <CoachNotice text={notice} onClose={() => setNotice(null)} /> : null}

        {data.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            onAdjust={() => setAdjustExercise(ex)}
            onLog={() => setActiveExercise(ex)}
          />
        ))}

        <Pressable
          onPress={() => setShowSummary(true)}
          style={({ pressed }) => [styles.finishBtn, pressed && styles.pressed]}>
          <Text style={styles.finishText}>
            {done >= total ? 'Finish · all done' : 'Finish session'}
          </Text>
        </Pressable>
      </ScrollView>

      {activeExercise ? (
        <LogSheet
          exercise={activeExercise}
          onChanged={load}
          onClose={() => {
            setActiveExercise(null);
            load();
          }}
        />
      ) : null}

      {adjustExercise ? (
        <ExerciseActionSheet
          ex={adjustExercise}
          onClose={() => setAdjustExercise(null)}
          onSwap={() => doSwap(adjustExercise)}
          onHurt={() => doHurt(adjustExercise)}
          onSkip={() => doSkip(adjustExercise)}
        />
      ) : null}

      {showSummary ? (
        <SummarySheet
          session={data}
          onClose={() => setShowSummary(false)}
          onSaved={() => {
            setShowSummary(false);
            load();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function ExerciseCard({
  ex,
  onAdjust,
  onLog,
}: {
  ex: SessionExercise;
  onAdjust: () => void;
  onLog: () => void;
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
          <Pressable
            onPress={onAdjust}
            hitSlop={8}
            accessibilityLabel="Adjust this movement"
            style={({ pressed }) => [styles.adjust, pressed && styles.pressed]}>
            <SymbolView name="ellipsis" tintColor={Temple.inkSoft} size={20} />
          </Pressable>
        )}
      </View>

      <Text style={styles.cardTarget}>{formatTarget(ex)}</Text>
      {ex.last ? <Text style={styles.cardLast}>Last: {ex.last}</Text> : null}
      {ex.cue ? <Text style={styles.cardCue}>{ex.cue}</Text> : null}

      {!ex.done ? (
        <Pressable onPress={onLog} style={({ pressed }) => [styles.logButton, pressed && styles.pressed]}>
          <Text style={styles.logText}>Log sets</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// A quiet coach line above the session — how an adjustment was handled (§5.3).
function CoachNotice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeSpark}>
        <SymbolView name="sparkle" tintColor={Primary.deep} size={13} />
      </View>
      <Text style={styles.noticeText}>{text}</Text>
      <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Dismiss" style={({ pressed }) => pressed && styles.pressed}>
        <SymbolView name="xmark" tintColor={Temple.inkFaint} size={15} />
      </Pressable>
    </View>
  );
}

// The "···" adjust sheet: swap (when an alternative exists), flag pain, or skip for the day.
function ExerciseActionSheet({
  ex,
  onClose,
  onSwap,
  onHurt,
  onSkip,
}: {
  ex: SessionExercise;
  onClose: () => void;
  onSwap: () => void;
  onHurt: () => void;
  onSkip: () => void;
}) {
  const options = [
    ex.alt
      ? {
          id: 'swap',
          icon: 'arrow.triangle.2.circlepath' as const,
          title: 'Swap this movement',
          desc: `Coach suggests ${ex.alt.movement}`,
          hue: Accent.sky,
          fn: onSwap,
        }
      : null,
    {
      id: 'hurt',
      icon: 'leaf' as const,
      title: 'Something doesn’t feel right',
      desc: 'Flag it — I’ll ease this and keep an eye on it',
      hue: Accent.gold,
      fn: onHurt,
    },
    {
      id: 'skip',
      icon: 'arrow.uturn.backward' as const,
      title: 'Skip for today',
      desc: 'Remove from this session — no guilt',
      hue: Accent.lavender,
      fn: onSkip,
    },
  ].filter((o): o is NonNullable<typeof o> => o !== null);

  return (
    <BottomSheet onClose={onClose}>
      <Text style={styles.sheetKicker}>ADJUST</Text>
      <Text style={styles.sheetTitle}>{ex.movement}</Text>
      <View style={styles.sheetOpts}>
        {options.map((o) => (
          <Pressable
            key={o.id}
            onPress={o.fn}
            style={({ pressed }) => [styles.opt, pressed && styles.pressed]}>
            <View style={[styles.optIcon, { backgroundColor: o.hue.tint, borderColor: o.hue.base }]}>
              <SymbolView name={o.icon} tintColor={o.hue.deep} size={20} />
            </View>
            <View style={styles.optMeta}>
              <Text style={styles.optTitle}>{o.title}</Text>
              <Text style={styles.optDesc}>{o.desc}</Text>
            </View>
            <SymbolView name="chevron.right" tintColor={Temple.inkGhost} size={16} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.marble },
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: Type.body, color: Temple.inkSoft, paddingHorizontal: Spacing.five, textAlign: 'center' },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    // Clear the floating native tab bar so the Finish button is reachable.
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
  },

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
  adjust: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -4 },
  donePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontFamily: Type.bodyMedium, fontSize: 13, color: Accent.sage.deep },
  pressed: { opacity: 0.6 },

  cardTarget: { fontFamily: Type.body, fontSize: 16, color: Temple.ink },
  cardLast: { fontFamily: Type.body, fontSize: 14, color: Temple.inkFaint },
  cardCue: { fontFamily: Type.serifItalic, fontSize: 16, lineHeight: 22, color: Temple.inkSoft },

  // Coach notice banner
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: Temple.surface,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  noticeSpark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Primary.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noticeText: { flex: 1, fontFamily: Type.serifItalic, fontSize: 16, lineHeight: 22, color: Temple.inkSoft },

  // Adjust action sheet
  sheetKicker: { fontFamily: Type.bodySemi, fontSize: 10.5, letterSpacing: 1.6, color: Primary.deep },
  sheetTitle: { fontFamily: Type.display, fontSize: 28, color: Temple.ink, marginTop: 4, marginBottom: Spacing.three },
  sheetOpts: { gap: Spacing.two },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Temple.surface,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  optIcon: { width: 42, height: 42, borderRadius: 12, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  optMeta: { flex: 1, gap: 2 },
  optTitle: { fontFamily: Type.body, fontSize: 16, color: Temple.ink },
  optDesc: { fontFamily: Type.body, fontSize: 13, color: Temple.inkSoft },

  logButton: {
    marginTop: Spacing.one,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Temple.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logText: { fontFamily: Type.bodyMedium, fontSize: 15, color: Temple.marble },

  finishBtn: {
    marginTop: Spacing.two,
    height: 54,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: Primary.deep,
    backgroundColor: Primary.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: { fontFamily: Type.bodyMedium, fontSize: 16, color: Primary.deep },
});
