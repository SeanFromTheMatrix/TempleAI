import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Accent, Primary, Radius, Serif, StatusGreen, Temple } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { buildCoachIntro } from '@/lib/coach-intro';
import { useProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

// Coach — the home tab (Master Build Spec §5.2, ported from the prototype's coach.jsx).
// SCAFFOLD: the first message is a deterministic stand-in derived from the real profile + flagged
// injuries (§6.4); composer + quick replies are inert until the `coach` edge function lands (step 5).
// Session card content is the spec's known seed (Push · Incline Focus) until seeding is wired.
// Camera/voice buttons are intentionally omitted from the composer (deferred per §5.2).

const QUICK_REPLIES = ['Build me a push day', "I'm easing back in", "I've got 45 minutes", 'Full gym today'];

export default function CoachScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { profile } = useProfile();
  const [issueLabels, setIssueLabels] = useState<string[]>([]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    supabase
      .from('issues')
      .select('label')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setIssueLabels(data.map((r) => r.label as string).filter(Boolean));
      });
  }, [session?.user.id]);

  const intro = buildCoachIntro(profile, issueLabels);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header: YOUR COACH / Temple (serif) · "Here with you" + settings */}
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR COACH</Text>
          <Text style={styles.wordmark}>Temple</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            hitSlop={12}
            onPress={() => router.push('/settings')}
            style={({ pressed }) => pressed && styles.pressed}>
            <SymbolView name="gearshape" tintColor={Temple.inkFaint} size={20} />
          </Pressable>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Here with you</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.threadScroll}
        contentContainerStyle={styles.thread}
        showsVerticalScrollIndicator={false}>
        {/* Coach message: spark + TEMPLE label, then plain text on paper (no bubble) */}
        <View style={styles.coachMsg}>
          <View style={styles.labelRow}>
            <View style={styles.spark}>
              <SymbolView name="sparkle" tintColor={Primary.deep} size={11} />
            </View>
            <Text style={styles.coachLabel}>TEMPLE</Text>
          </View>
          <Text style={styles.coachText}>{intro}</Text>
        </View>

        {/* Today's session card → taps through to Today */}
        <Pressable
          onPress={() => router.navigate('/today')}
          style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed]}>
          <View style={styles.ring}>
            <Text style={styles.ringText}>0/5</Text>
          </View>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionKicker}>TODAY'S SESSION</Text>
            <Text style={styles.sessionTitle}>Push · Incline Focus</Text>
            <Text style={styles.sessionSub}>5 movements · ~48 min</Text>
          </View>
          <SymbolView name="chevron.right" tintColor={Temple.inkFaint} size={16} />
        </Pressable>
      </ScrollView>

      {/* Quick replies (spec §5.2; inert until LLM) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}>
        {QUICK_REPLIES.map((q) => (
          <View key={q} style={styles.chip}>
            <Text style={styles.chipText}>{q}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Composer (text + send only; disabled until coach is wired) */}
      <View style={styles.composer}>
        <TextInput
          editable={false}
          placeholder="Ask your coach…"
          placeholderTextColor={Temple.inkFaint}
          style={styles.input}
        />
        <View style={styles.send}>
          <SymbolView name="arrow.up" tintColor={Temple.inkFaint} size={18} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.paper },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  kicker: { fontSize: 11, letterSpacing: 1.5, color: Temple.inkFaint, fontWeight: '600' },
  wordmark: { fontFamily: Serif, fontSize: 34, color: Temple.ink, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: Spacing.two },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: StatusGreen },
  statusText: { fontSize: 13, color: Temple.inkFaint },
  pressed: { opacity: 0.6 },

  threadScroll: { flex: 1 },
  thread: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.four },

  coachMsg: { gap: Spacing.two },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  spark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Primary.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachLabel: { fontSize: 11, letterSpacing: 1.5, color: Temple.inkFaint, fontWeight: '600' },
  coachText: { fontSize: 16, lineHeight: 25, color: Temple.ink },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Temple.paperRaised,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  ring: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Primary.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { fontSize: 13, fontWeight: '600', color: Temple.ink },
  sessionMeta: { flex: 1, gap: 2 },
  sessionKicker: { fontSize: 10, letterSpacing: 1.2, color: Primary.deep, fontWeight: '700' },
  sessionTitle: { fontFamily: Serif, fontSize: 20, color: Temple.ink },
  sessionSub: { fontSize: 13, color: Temple.inkSoft },

  chipsScroll: { flexGrow: 0 },
  chips: { paddingHorizontal: Spacing.four, gap: Spacing.two, paddingVertical: Spacing.two, alignItems: 'center' },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Accent.sage.tint,
    borderColor: Temple.line,
    borderWidth: 0.5,
  },
  chipText: { fontSize: 14, color: Temple.inkSoft },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    backgroundColor: Temple.paperRaised,
    borderColor: Temple.line,
    borderWidth: 0.5,
    color: Temple.ink,
    fontSize: 15,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Temple.paperRaised,
    borderColor: Temple.line,
    borderWidth: 0.5,
  },
});
