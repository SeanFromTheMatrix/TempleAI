import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Accent, Primary, Radius, StatusGreen, Temple, Type } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { buildCoachIntro } from '@/lib/coach-intro';
import { getThreadMessages, sendCoachMessage, type ThreadMessage } from '@/lib/coach';
import { useProfile } from '@/lib/profile';
import { getTodaySession, type TodaySession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// Coach — the home tab (Master Build Spec §5.2, ported from the prototype's coach.jsx).
// The greeting is a deterministic, profile-derived opener (§6.4) that always leads the thread; the
// live conversation below it is backed by the `coach` Edge Function (memory + safety, §7). Sending
// optimistically appends the user bubble, shows the "considering…" breath, then appends the reply.
// Camera/voice buttons are intentionally omitted from the composer (deferred per §5.2).

const FIRST_RUN_REPLIES = ['Build me a push day', "I'm easing back in", "I've got 45 minutes", 'Full gym today'];
const RUNNING_REPLIES = ["How's my back looking?", 'Swap an exercise', "I'm short on time today", 'Make it harder'];

type Bubble = ThreadMessage & { pending?: boolean };

export default function CoachScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { profile } = useProfile();
  const userId = session?.user.id;

  const [issueLabels, setIssueLabels] = useState<string[]>([]);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('issues')
      .select('label')
      .eq('user_id', userId)
      .eq('active', true)
      .then(({ data }) => {
        if (data) setIssueLabels(data.map((r) => r.label as string).filter(Boolean));
      });
  }, [userId]);

  const intro = buildCoachIntro(profile, issueLabels);

  // Today's session for the inline card — refetched on focus so progress stays current after the
  // user logs sets on Today. The thread is reloaded on focus too (a saved reflection may have
  // appended a coach message from the Summary sheet).
  const [todaySession, setTodaySession] = useState<TodaySession | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      getTodaySession(userId).then((s) => active && setTodaySession(s));
      getThreadMessages(userId).then((m) => active && setMessages(m));
      return () => {
        active = false;
      };
    }, [userId]),
  );

  const total = todaySession?.exercises.length ?? 0;
  const done = todaySession?.exercises.filter((e) => e.done).length ?? 0;
  const hasConversation = messages.length > 0;

  const scrollToEnd = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const handleSend = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || sending) return;
      setError(null);
      setInput('');
      const optimistic: Bubble = {
        id: `temp-${Date.now()}`,
        sender: 'user',
        text: body,
        card: null,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);
      scrollToEnd();
      try {
        const reply = await sendCoachMessage(body);
        setMessages((prev) => [
          ...prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false } : m)),
          {
            id: reply.message_id ?? `coach-${Date.now()}`,
            sender: 'coach',
            text: reply.reply,
            card: reply.card,
            created_at: reply.created_at ?? new Date().toISOString(),
          },
        ]);
      } catch (e: any) {
        // Keep the user's bubble; surface a gentle, non-alarming error line.
        setError("I couldn't reach your coach just now. Check your connection and try again.");
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false } : m)));
      } finally {
        setSending(false);
        scrollToEnd();
      }
    },
    [sending],
  );

  const quickReplies = hasConversation ? RUNNING_REPLIES : FIRST_RUN_REPLIES;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
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
          ref={scrollRef}
          style={styles.threadScroll}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}>
          {/* Greeting: spark + TEMPLE label, then plain text on paper (no bubble) */}
          <View style={styles.coachMsg}>
            <View style={styles.labelRow}>
              <View style={styles.spark}>
                <SymbolView name="sparkle" tintColor={Primary.deep} size={11} />
              </View>
              <Text style={styles.coachLabel}>TEMPLE</Text>
            </View>
            <Text style={styles.coachText}>{intro}</Text>
          </View>

          {/* Today's session card (first-run affordance) → taps through to Today */}
          {todaySession && !hasConversation ? (
            <SessionCard
              title={todaySession.title ?? "Today's session"}
              done={done}
              total={total}
              duration={todaySession.duration}
              status={todaySession.status}
              onPress={() => router.navigate('/today')}
            />
          ) : null}

          {/* The live conversation */}
          {messages.map((m) =>
            m.sender === 'user' ? (
              <View key={m.id} style={[styles.userRow, m.pending && styles.pendingRow]}>
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={m.id} style={styles.coachMsg}>
                <View style={styles.labelRow}>
                  <View style={styles.spark}>
                    <SymbolView name="sparkle" tintColor={Primary.deep} size={11} />
                  </View>
                  <Text style={styles.coachLabel}>TEMPLE</Text>
                </View>
                <Text style={styles.coachText}>{m.text}</Text>
                {m.card ? (
                  <SessionCard
                    title={m.card.title}
                    done={m.card.done}
                    total={m.card.total}
                    duration={m.card.duration}
                    onPress={() => router.navigate('/today')}
                  />
                ) : null}
              </View>
            ),
          )}

          {/* Thinking state — the breathing "considering…" line */}
          {sending ? <Thinking /> : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        {/* Quick replies (spec §5.2) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}>
          {quickReplies.map((q) => (
            <Pressable
              key={q}
              disabled={sending}
              onPress={() => handleSend(q)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed, sending && styles.chipDisabled]}>
              <Text style={styles.chipText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Composer (text + send only; voice/camera deferred) */}
        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={Temple.inkFaint}
            style={styles.input}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend(input)}
            blurOnSubmit
            editable={!sending}
          />
          <Pressable
            onPress={() => handleSend(input)}
            disabled={!input.trim() || sending}
            style={({ pressed }) => [
              styles.send,
              input.trim() && !sending && styles.sendActive,
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name="arrow.up"
              tintColor={input.trim() && !sending ? '#fff' : Temple.inkFaint}
              size={18}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ————————————————————————————— Session card —————————————————————————————
function SessionCard({
  title,
  done,
  total,
  duration,
  status,
  onPress,
}: {
  title: string;
  done: number;
  total: number;
  duration: number | null;
  status?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed]}>
      <View style={styles.ring}>
        <Text style={styles.ringText}>
          {done}/{total}
        </Text>
      </View>
      <View style={styles.sessionMeta}>
        <Text style={styles.sessionKicker}>{status === 'done' ? 'LAST SESSION' : "TODAY'S SESSION"}</Text>
        <Text style={styles.sessionTitle}>{title}</Text>
        <Text style={styles.sessionSub}>
          {total} movements · ~{duration ?? 45} min
        </Text>
      </View>
      <SymbolView name="chevron.right" tintColor={Temple.inkFaint} size={16} />
    </Pressable>
  );
}

// ————————————————————————————— Thinking dots —————————————————————————————
function Thinking() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  const dot = (delayShift: number) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3 + delayShift, 0.9] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
  });
  return (
    <View style={styles.coachMsg}>
      <View style={styles.labelRow}>
        <View style={styles.spark}>
          <SymbolView name="sparkle" tintColor={Primary.deep} size={11} />
        </View>
        <Text style={styles.coachLabel}>TEMPLE</Text>
      </View>
      <View style={styles.thinkingRow}>
        <Animated.View style={[styles.thinkingDot, dot(0)]} />
        <Animated.View style={[styles.thinkingDot, dot(0.1)]} />
        <Animated.View style={[styles.thinkingDot, dot(0.2)]} />
        <Text style={styles.thinkingText}>considering…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.marble },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  kicker: { fontFamily: Type.bodyMedium, fontSize: 11, letterSpacing: 1.8, color: Temple.inkFaint },
  wordmark: { fontFamily: Type.display, fontSize: 36, color: Temple.ink, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: Spacing.two },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: StatusGreen },
  statusText: { fontFamily: Type.body, fontSize: 13, color: Temple.inkFaint },
  pressed: { opacity: 0.6 },

  threadScroll: { flex: 1 },
  thread: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three, gap: Spacing.four },

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
  coachLabel: { fontFamily: Type.bodyMedium, fontSize: 11, letterSpacing: 1.8, color: Temple.inkFaint },
  coachText: { fontFamily: Type.body, fontSize: 16, lineHeight: 25, color: Temple.ink },

  // User bubble (right-aligned)
  userRow: { alignItems: 'flex-end' },
  pendingRow: { opacity: 0.6 },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: Accent.sky.tint,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    borderBottomRightRadius: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  userText: { fontFamily: Type.body, fontSize: 16, lineHeight: 23, color: Temple.ink },

  // Thinking
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  thinkingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Primary.deep },
  thinkingText: { fontFamily: Type.serifItalic, fontStyle: 'italic', fontSize: 16, color: Temple.inkFaint, marginLeft: 4 },

  errorText: { fontFamily: Type.body, fontSize: 14, color: Accent.gold.deep, textAlign: 'center' },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Temple.paper,
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
    borderColor: Primary.deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { fontFamily: Type.bodyMedium, fontSize: 13, color: Temple.ink },
  sessionMeta: { flex: 1, gap: 3 },
  sessionKicker: { fontFamily: Type.bodySemi, fontSize: 10, letterSpacing: 1.4, color: Primary.deep },
  sessionTitle: { fontFamily: Type.display, fontSize: 22, color: Temple.ink },
  sessionSub: { fontFamily: Type.body, fontSize: 13, color: Temple.inkSoft },

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
  chipDisabled: { opacity: 0.5 },
  chipText: { fontFamily: Type.body, fontSize: 14, color: Temple.inkSoft },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 14 : 10,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: Temple.paper,
    borderColor: Temple.line,
    borderWidth: 0.5,
    color: Temple.ink,
    fontFamily: Type.body,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Temple.paper,
    borderColor: Temple.line,
    borderWidth: 0.5,
  },
  sendActive: { backgroundColor: Primary.deep, borderColor: Primary.deep },
});
