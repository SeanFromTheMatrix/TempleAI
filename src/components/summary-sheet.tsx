import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import BottomSheet from '@/components/bottom-sheet';
import { Primary, Radius, Temple, Type } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import type { TodaySession } from '@/lib/session';
import { buildReflection, getSessionStats, saveSession, type SessionStats } from '@/lib/summary';

// Session Summary (Master Build Spec §5.5) — recap + coach reflection + Save to history (§6.3).

export default function SummarySheet({
  session,
  onClose,
  onSaved,
}: {
  session: TodaySession;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { session: auth } = useAuth();
  const { profile } = useProfile();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getSessionStats(session).then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, [session]);

  const reflection = stats ? buildReflection(profile, stats) : '';

  const handleSave = async () => {
    const userId = auth?.user.id;
    if (!userId || !stats || busy) return;
    setBusy(true);
    await saveSession(userId, session.id, reflection);
    setBusy(false);
    Alert.alert('Saved', 'Session saved to history', [{ text: 'OK', onPress: onSaved }]);
  };

  return (
    <BottomSheet onClose={onClose}>
      <View style={styles.head}>
              <View style={styles.headMeta}>
                <Text style={styles.kicker}>SESSION COMPLETE</Text>
                <Text style={styles.title}>{session.title}</Text>
              </View>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                <SymbolView name="xmark" tintColor={Temple.inkSoft} size={20} />
              </Pressable>
            </View>

            {!stats ? (
              <ActivityIndicator style={{ marginVertical: Spacing.five }} color={Primary.deep} />
            ) : (
              <>
                <View style={styles.recap}>
                  <View style={styles.recapItem}>
                    <Text style={styles.recapNum}>
                      {stats.doneExercises}/{stats.totalExercises}
                    </Text>
                    <Text style={styles.recapLabel}>movements</Text>
                  </View>
                  <View style={styles.recapDivider} />
                  <View style={styles.recapItem}>
                    <Text style={styles.recapNum}>{stats.setsLogged}</Text>
                    <Text style={styles.recapLabel}>sets logged</Text>
                  </View>
                </View>

                {/* Coach reflection */}
                <View style={styles.reflection}>
                  <View style={styles.labelRow}>
                    <View style={styles.spark}>
                      <SymbolView name="sparkle" tintColor={Primary.deep} size={11} />
                    </View>
                    <Text style={styles.coachLabel}>TEMPLE</Text>
                  </View>
                  <Text style={styles.reflectionText}>{reflection}</Text>
                </View>

                <Pressable
                  onPress={handleSave}
                  disabled={busy}
                  style={({ pressed }) => [styles.saveBtn, (pressed || busy) && styles.pressed]}>
                  <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save to history'}</Text>
                </Pressable>
              </>
            )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },

  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.three },
  headMeta: { flex: 1, gap: 5 },
  kicker: { fontFamily: Type.bodySemi, fontSize: 10.5, letterSpacing: 1.6, color: Primary.deep },
  title: { fontFamily: Type.display, fontSize: 30, color: Temple.ink, lineHeight: 33 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Temple.surface,
    borderWidth: 0.5,
    borderColor: Temple.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Temple.surface,
    borderWidth: 0.5,
    borderColor: Temple.line,
    borderRadius: Radius.card,
    paddingVertical: Spacing.four,
    marginTop: Spacing.four,
  },
  recapItem: { flex: 1, alignItems: 'center', gap: 4 },
  recapDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Temple.line },
  recapNum: { fontFamily: Type.display, fontSize: 34, color: Temple.ink },
  recapLabel: { fontFamily: Type.body, fontSize: 13, color: Temple.inkSoft },

  reflection: { marginTop: Spacing.four, gap: Spacing.two },
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
  reflectionText: { fontFamily: Type.serifItalic, fontSize: 18, lineHeight: 26, color: Temple.ink },

  saveBtn: {
    marginTop: Spacing.four,
    height: 56,
    borderRadius: Radius.card,
    backgroundColor: Temple.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontFamily: Type.bodyMedium, fontSize: 16, color: Temple.marble },
});
