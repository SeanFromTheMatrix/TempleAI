import { useMemo, useState } from 'react';
import {
  Alert,
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

import { Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  EQUIPMENT,
  BODYWEIGHT_ONLY,
  GOALS,
  LEVELS,
  REGIONS,
  completeOnboarding,
  type Option,
} from '@/lib/onboarding';
import { useProfile } from '@/lib/profile';
import { useTheme } from '@/hooks/use-theme';

// Per-screen accent (spec §3): experience = lavender, equipment = sage, protect = gold.
// Goals gets a warm clay to stay distinct. Selection state tints with the accent.
const ACCENT = {
  goals: '#B07A5A',
  experience: '#8E7CC3',
  equipment: '#7E9B6E',
  protect: '#C0A04A',
} as const;

const LAST_STEP = 3; // screens 0–3 are built; screen 4 (Apple Health) is deferred.

export default function Onboarding() {
  const theme = useTheme();
  const { session } = useAuth();
  const { refresh } = useProfile();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Selections. goals stays in selection order so element 0 is the primary goal.
  const [goals, setGoals] = useState<string[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [note, setNote] = useState('');

  const toggleGoal = (id: string) =>
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  const toggleEquipment = (item: string) =>
    setEquipment((prev) => {
      if (item === BODYWEIGHT_ONLY) {
        return prev.includes(item) ? [] : [BODYWEIGHT_ONLY];
      }
      const withoutExclusive = prev.filter((e) => e !== BODYWEIGHT_ONLY);
      return withoutExclusive.includes(item)
        ? withoutExclusive.filter((e) => e !== item)
        : [...withoutExclusive, item];
    });

  const toggleRegion = (region: Option) =>
    setRegions((prev) =>
      prev.some((r) => r.id === region.id)
        ? prev.filter((r) => r.id !== region.id)
        : [...prev, region],
    );

  const canContinue = useMemo(() => {
    if (step === 1) return goals.length >= 1;
    if (step === 2) return level !== null && equipment.length >= 1;
    return true; // steps 0 and 3 are always enabled
  }, [step, goals, level, equipment]);

  const finish = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await completeOnboarding(session.user.id, { goals, level: level!, equipment, regions, note });
      await refresh(); // flips the routing gate → (app)
      // No navigation needed: RootNavigator swaps groups once `onboarded` is true.
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Could not save', e?.message ?? String(e));
    }
  };

  const onPrimary = () => {
    if (step === LAST_STEP) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const accent =
    step === 1 ? ACCENT.goals : step === 2 ? ACCENT.experience : step === 3 ? ACCENT.protect : theme.text;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header: back chevron (hidden on welcome) + progress dots */}
        <View style={styles.header}>
          {step > 0 ? (
            <Pressable
              hitSlop={12}
              onPress={() => setStep((s) => Math.max(0, s - 1))}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={[styles.chevron, { color: theme.textSecondary }]}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.chevronSpacer} />
          )}
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: theme.backgroundSelected },
                  i === step && { backgroundColor: accent, width: Spacing.four },
                ]}
              />
            ))}
          </View>
          <View style={styles.chevronSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step === 0 && <Welcome theme={theme} />}
          {step === 1 && (
            <GoalsStep theme={theme} accent={accent} selected={goals} onToggle={toggleGoal} />
          )}
          {step === 2 && (
            <ExperienceStep
              theme={theme}
              level={level}
              onLevel={setLevel}
              equipment={equipment}
              onToggleEquipment={toggleEquipment}
            />
          )}
          {step === 3 && (
            <ProtectStep
              theme={theme}
              accent={accent}
              regions={regions}
              onToggleRegion={toggleRegion}
              note={note}
              onNote={setNote}
            />
          )}
        </ScrollView>

        {/* Footer: caption (welcome only) + primary button */}
        <View style={styles.footer}>
          {step === 0 && (
            <Text style={[styles.caption, { color: theme.textSecondary }]}>
              Four quiet questions. Under a minute.
            </Text>
          )}
          <Pressable
            disabled={!canContinue || saving}
            onPress={onPrimary}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.text },
              (!canContinue || saving) && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.primaryText, { color: theme.background }]}>
              {saving ? 'Saving…' : step === 0 ? 'Begin' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type Theme = ReturnType<typeof useTheme>;

// ————————————————————————————— Screen 0 —————————————————————————————
function Welcome({ theme }: { theme: Theme }) {
  return (
    <View style={styles.welcome}>
      <Kicker theme={theme}>Welcome</Kicker>
      <Text style={[styles.brand, { color: theme.text }]}>TEMPLE</Text>
      <Text style={[styles.serif, { color: theme.textSecondary }]}>
        A coach for the long path. Calm, honest, and built around you.
      </Text>
    </View>
  );
}

// ————————————————————————————— Screen 1 —————————————————————————————
function GoalsStep({
  theme,
  accent,
  selected,
  onToggle,
}: {
  theme: Theme;
  accent: string;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <StepHeading theme={theme} title="What brings you here?" sub="Choose all that ring true. We'll shape everything around them." />
      <View style={styles.cards}>
        {GOALS.map((g) => (
          <OptionRow
            key={g.id}
            theme={theme}
            accent={accent}
            label={g.label}
            desc={g.desc}
            selected={selected.includes(g.id)}
            onPress={() => onToggle(g.id)}
          />
        ))}
      </View>
    </View>
  );
}

// ————————————————————————————— Screen 2 —————————————————————————————
function ExperienceStep({
  theme,
  level,
  onLevel,
  equipment,
  onToggleEquipment,
}: {
  theme: Theme;
  level: string | null;
  onLevel: (id: string) => void;
  equipment: string[];
  onToggleEquipment: (item: string) => void;
}) {
  return (
    <View style={styles.section}>
      <StepHeading
        theme={theme}
        title="Where are you on the path?"
        sub="This sets how much the coach leads versus assists."
      />
      <View style={styles.cards}>
        {LEVELS.map((l) => (
          <OptionRow
            key={l.id}
            theme={theme}
            accent={ACCENT.experience}
            label={l.label}
            desc={l.desc}
            selected={level === l.id}
            onPress={() => onLevel(l.id)}
          />
        ))}
      </View>

      <Kicker theme={theme} style={styles.equipKicker}>
        {"What's available to you"}
      </Kicker>
      <View style={styles.pills}>
        {EQUIPMENT.map((item) => (
          <Pill
            key={item}
            theme={theme}
            accent={ACCENT.equipment}
            label={item}
            selected={equipment.includes(item)}
            onPress={() => onToggleEquipment(item)}
          />
        ))}
      </View>
    </View>
  );
}

// ————————————————————————————— Screen 3 —————————————————————————————
function ProtectStep({
  theme,
  accent,
  regions,
  onToggleRegion,
  note,
  onNote,
}: {
  theme: Theme;
  accent: string;
  regions: Option[];
  onToggleRegion: (r: Option) => void;
  note: string;
  onNote: (t: string) => void;
}) {
  const hasAny = regions.length > 0 || note.trim().length > 0;
  const placeholder =
    regions.length > 0
      ? 'e.g. Right hip is tight from desk sitting — sharp on deep squats. Lower back strain healing, about a week in.'
      : "Anything a coach should know — old injuries, surgeries, a joint that flares. Skip if there's nothing.";
  const reassurance = hasAny
    ? "Noted with care. I'll keep these out of harm's way and adapt every session to protect them."
    : "Nothing to flag? Wonderful. We'll begin with a clean slate.";

  return (
    <View style={styles.section}>
      <StepHeading
        theme={theme}
        title="Anything to protect?"
        sub="Flag what needs care. The coach will train around it — and you can always say more later."
      />
      <View style={styles.pills}>
        {REGIONS.map((r) => (
          <Pill
            key={r.id}
            theme={theme}
            accent={accent}
            label={r.label}
            selected={regions.some((x) => x.id === r.id)}
            onPress={() => onToggleRegion(r)}
          />
        ))}
      </View>

      <Kicker theme={theme} style={styles.equipKicker}>
        In your own words · optional
      </Kicker>
      <TextInput
        value={note}
        onChangeText={onNote}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[
          styles.textarea,
          { backgroundColor: theme.backgroundElement, color: theme.text },
        ]}
      />

      <Text style={[styles.serif, styles.reassurance, { color: theme.textSecondary }]}>
        {reassurance}
      </Text>
    </View>
  );
}

// ————————————————————————————— shared bits —————————————————————————————
function StepHeading({ theme, title, sub }: { theme: Theme; title: string; sub: string }) {
  return (
    <View style={styles.heading}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>{sub}</Text>
    </View>
  );
}

function Kicker({ theme, children, style }: { theme: Theme; children: string; style?: any }) {
  return <Text style={[styles.kicker, { color: theme.textSecondary }, style]}>{children}</Text>;
}

function OptionRow({
  theme,
  accent,
  label,
  desc,
  selected,
  onPress,
}: {
  theme: Theme;
  accent: string;
  label: string;
  desc?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: 'transparent' },
        selected && { borderColor: accent, backgroundColor: accent + '1F' },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardText}>
        <Text style={[styles.cardLabel, { color: theme.text }]}>{label}</Text>
        {desc ? <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{desc}</Text> : null}
      </View>
      <View
        style={[
          styles.check,
          { borderColor: theme.backgroundSelected },
          selected && { borderColor: accent, backgroundColor: accent },
        ]}>
        {selected ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

function Pill({
  theme,
  accent,
  label,
  selected,
  onPress,
}: {
  theme: Theme;
  accent: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: theme.backgroundElement, borderColor: 'transparent' },
        selected && { borderColor: accent, backgroundColor: accent + '1F' },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.pillText, { color: selected ? theme.text : theme.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  chevron: { fontSize: 34, lineHeight: 34, fontWeight: '300' },
  chevronSpacer: { width: 24 },
  dots: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  dot: { width: Spacing.two, height: Spacing.two, borderRadius: Spacing.one },
  body: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  caption: { textAlign: 'center', fontSize: 14 },
  primaryButton: {
    height: 54,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.35 },
  primaryText: { fontSize: 17, fontWeight: '600' },
  pressed: { opacity: 0.6 },

  // Welcome
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  brand: { fontSize: 52, fontWeight: '700', letterSpacing: 8 },
  serif: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },

  // Headings
  section: { gap: Spacing.four, paddingTop: Spacing.two },
  heading: { gap: Spacing.two },
  title: { fontSize: 30, fontWeight: '700', lineHeight: 36 },
  sub: { fontSize: 16, lineHeight: 23 },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  equipKicker: { marginTop: Spacing.two },

  // Option cards
  cards: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
  },
  cardText: { flex: 1, gap: 2 },
  cardLabel: { fontSize: 17, fontWeight: '600' },
  cardDesc: { fontSize: 14, lineHeight: 19 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Pills
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillText: { fontSize: 15, fontWeight: '500' },

  // Note
  textarea: {
    minHeight: 110,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  reassurance: { textAlign: 'left', paddingHorizontal: 0, fontSize: 16 },
});
