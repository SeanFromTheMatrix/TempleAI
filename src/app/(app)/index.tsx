import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Accent, Primary, Radius, Temple } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { buildCoachIntro } from '@/lib/coach-intro';
import { useProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

// Coach — the home tab (Master Build Spec §5.2). SCAFFOLD: the first message is a deterministic
// stand-in derived from the real profile + flagged injuries (§6.4); the composer + quick replies
// are disabled until the Anthropic-backed `coach` edge function lands (step 5). The session card
// content is the spec's known seed (Push · Incline Focus) until real seeding is wired (step 3).

// First-run quick replies (spec §5.2). Shown but disabled until the LLM is live.
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
      {/* Header: wordmark + settings affordance */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>TEMPLE</Text>
        <Pressable
          hitSlop={12}
          onPress={() => router.push('/settings')}
          style={({ pressed }) => pressed && styles.pressed}>
          <SymbolView name="gearshape" tintColor={Temple.inkSoft} size={22} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.threadScroll}
        contentContainerStyle={styles.thread}
        showsVerticalScrollIndicator={false}>
        {/* Coach message: spark mark + bubble */}
        <View style={styles.coachRow}>
          <View style={styles.spark} />
          <View style={styles.coachBubble}>
            <Text style={styles.coachText}>{intro}</Text>
          </View>
        </View>

        {/* Session preview card → taps through to Today */}
        <Pressable
          onPress={() => router.navigate('/today')}
          style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed]}>
          <View style={styles.ring}>
            <Text style={styles.ringText}>0/5</Text>
          </View>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionTitle}>Push · Incline Focus</Text>
            <Text style={styles.sessionSub}>5 movements · ~45 min</Text>
          </View>
          <SymbolView name="chevron.right" tintColor={Temple.inkFaint} size={16} />
        </Pressable>
      </ScrollView>

      {/* Quick replies (disabled until LLM) */}
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

      {/* Composer (disabled — coach not yet wired) */}
      <View style={styles.composer}>
        <TextInput
          editable={false}
          placeholder="Coach is waking up — chat available soon"
          placeholderTextColor={Temple.inkFaint}
          style={styles.input}
        />
        <View style={styles.sendDisabled}>
          <SymbolView name="arrow.up" tintColor={Temple.paper} size={18} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  wordmark: { fontSize: 18, fontWeight: '600', letterSpacing: 4, color: Temple.ink },
  pressed: { opacity: 0.6 },

  threadScroll: { flex: 1 },
  thread: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.four },
  coachRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  spark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 6,
    backgroundColor: Primary.base,
  },
  coachBubble: {
    flex: 1,
    backgroundColor: Temple.surface,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  coachText: { fontSize: 16, lineHeight: 24, color: Temple.ink },

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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Primary.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { fontSize: 13, fontWeight: '600', color: Temple.ink },
  sessionMeta: { flex: 1, gap: 2 },
  sessionTitle: { fontSize: 16, fontWeight: '600', color: Temple.ink },
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
    height: 46,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    backgroundColor: Temple.paperRaised,
    borderColor: Temple.line,
    borderWidth: 0.5,
    color: Temple.ink,
    fontSize: 15,
  },
  sendDisabled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Temple.inkGhost,
  },
});
