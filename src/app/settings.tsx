import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Radius, Temple } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { GOALS, LEVELS } from '@/lib/onboarding';
import { useProfile } from '@/lib/profile';

// Settings (Master Build Spec §5.6) — minimal: show profile, edit-onboarding entry (deferred),
// sign out. Reached from the Coach header gear. SCAFFOLD: "Edit answers" is stubbed until the
// onboarding screens are made reusable for editing.

function labelForGoal(id: string) {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
function labelForLevel(id: string | null) {
  return LEVELS.find((l) => l.id === id)?.label ?? id ?? '—';
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const goals = (profile?.goal ?? []).map(labelForGoal).join(', ') || '—';
  const equipment = (profile?.equipment ?? []).join(', ') || '—';

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in with Apple any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
          <SymbolView name="chevron.left" tintColor={Temple.inkSoft} size={20} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Row label="Name" value={profile?.name?.trim() || '—'} />
          <Row label="Goal" value={goals} />
          <Row label="Experience" value={labelForLevel(profile?.level ?? null)} />
          <Row label="Equipment" value={equipment} />
          <Row label="Units" value={profile?.units ?? 'lb'} last />
        </View>

        <Pressable disabled style={[styles.action, styles.actionDisabled]}>
          <Text style={styles.actionText}>Edit onboarding answers</Text>
          <Text style={styles.soon}>soon</Text>
        </Pressable>

        <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={[styles.actionText, { color: '#B3261E' }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
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
  title: { fontSize: 17, fontWeight: '600', color: Temple.ink },
  spacer: { width: 20 },
  pressed: { opacity: 0.6 },

  body: { padding: Spacing.four, gap: Spacing.three },
  card: {
    backgroundColor: Temple.paperRaised,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
  },
  row: { paddingVertical: Spacing.three, flexDirection: 'row', gap: Spacing.three },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: Temple.line },
  rowLabel: { fontSize: 15, color: Temple.inkSoft, width: 100 },
  rowValue: { fontSize: 15, color: Temple.ink, flex: 1 },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Temple.paperRaised,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  actionDisabled: { opacity: 0.55 },
  actionText: { fontSize: 16, fontWeight: '500', color: Temple.ink },
  soon: { fontSize: 13, color: Temple.inkFaint },
});
