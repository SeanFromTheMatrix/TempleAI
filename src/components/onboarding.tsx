import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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

import { Accent, Radius, Temple, Type } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
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

// Onboarding — the threshold of the temple. Ported 1:1 from the prototype's app/onboarding.jsx
// onto the Temple design system (marble field, Cormorant + Jost, the four lightsaber-pastel
// accents). Sky is onboarding's signature (spark · breathe glow · primary button · dots); each
// step's cards take their own hue: goals = sky, experience = lavender, protect = gold, equipment
// pills = sage — matching the prototype's per-section coloring.

type AccentSet = (typeof Accent)[keyof typeof Accent];

const ONB = Accent.sky; // the welcome spark, breathe glow, primary button, progress dots

const LAST_STEP = 3; // screens 0–3 are built; the prototype's screen 4 (Apple Health) is deferred.

export default function Onboarding() {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Soft shaft of light from the upper-left, like sun through a high temple window */}
      <View pointerEvents="none" style={styles.lightShaft} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header: back chevron (hidden on welcome) + progress dots */}
        <View style={styles.header}>
          {step > 0 ? (
            <Pressable
              hitSlop={12}
              onPress={() => setStep((s) => Math.max(0, s - 1))}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
              <SymbolView name="chevron.left" tintColor={Temple.inkSoft} size={18} />
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}
          <ProgressDots step={step} total={LAST_STEP + 1} />
          <View style={styles.backSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step === 0 && <Welcome />}
          {step === 1 && <GoalsStep selected={goals} onToggle={toggleGoal} />}
          {step === 2 && (
            <ExperienceStep
              level={level}
              onLevel={setLevel}
              equipment={equipment}
              onToggleEquipment={toggleEquipment}
            />
          )}
          {step === 3 && (
            <ProtectStep
              regions={regions}
              onToggleRegion={toggleRegion}
              note={note}
              onNote={setNote}
            />
          )}
        </ScrollView>

        {/* Footer: primary button + caption (welcome only) */}
        <View style={styles.footer}>
          <Pressable
            disabled={!canContinue || saving}
            onPress={onPrimary}
            style={({ pressed }) => [
              styles.primaryButton,
              (!canContinue || saving) && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.primaryText}>
              {saving ? 'Saving…' : step === 0 ? 'Begin' : 'Continue'}
            </Text>
          </Pressable>
          {step === 0 && (
            <Text style={styles.caption}>Four quiet questions. Under a minute.</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ————————————————————————————— Progress dots —————————————————————————————
function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step && {
              width: 22,
              backgroundColor: ONB.deep,
              shadowColor: ONB.base,
              shadowOpacity: 0.9,
              shadowRadius: 5,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      ))}
    </View>
  );
}

// ————————————————————————————— Screen 0 · Welcome —————————————————————————————
function Welcome() {
  // A gentle luminous halo behind the mark — the "lightsaber" breathe, kept soft.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const glowStyle = {
    opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] }),
    transform: [
      { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) },
    ],
  };

  return (
    <View style={styles.welcome}>
      <View style={styles.markWrap}>
        <Animated.View style={[styles.markGlow, glowStyle]} />
        <SymbolView name="sparkle" tintColor={ONB.deep} size={48} />
      </View>
      <Text style={styles.kickerCenter}>WELCOME</Text>
      <Text style={styles.brand}>TEMPLE</Text>
      <Text style={styles.serif}>
        A coach for the long path. Calm, honest, and built around you.
      </Text>
    </View>
  );
}

// ————————————————————————————— Screen 1 · Goals —————————————————————————————
function GoalsStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <StepHeading
        title="What brings you here?"
        sub="Choose all that ring true. We'll shape everything around them."
      />
      <View style={styles.cards}>
        {GOALS.map((g) => (
          <OptionRow
            key={g.id}
            accent={Accent.sky}
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

// ————————————————————————————— Screen 2 · Experience + Equipment —————————————————————————————
function ExperienceStep({
  level,
  onLevel,
  equipment,
  onToggleEquipment,
}: {
  level: string | null;
  onLevel: (id: string) => void;
  equipment: string[];
  onToggleEquipment: (item: string) => void;
}) {
  return (
    <View style={styles.section}>
      <StepHeading
        title="Where are you on the path?"
        sub="This sets how much the coach leads versus assists."
      />
      <View style={styles.cards}>
        {LEVELS.map((l) => (
          <OptionRow
            key={l.id}
            accent={Accent.lavender}
            label={l.label}
            desc={l.desc}
            selected={level === l.id}
            onPress={() => onLevel(l.id)}
          />
        ))}
      </View>

      <Kicker style={styles.equipKicker}>What's available to you</Kicker>
      <View style={styles.pills}>
        {EQUIPMENT.map((item) => (
          <Pill
            key={item}
            accent={Accent.sage}
            label={item}
            selected={equipment.includes(item)}
            onPress={() => onToggleEquipment(item)}
          />
        ))}
      </View>
    </View>
  );
}

// ————————————————————————————— Screen 3 · Protect —————————————————————————————
function ProtectStep({
  regions,
  onToggleRegion,
  note,
  onNote,
}: {
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
        title="Anything to protect?"
        sub="Flag what needs care. The coach will train around it — and you can always say more later."
      />
      <View style={styles.pills}>
        {REGIONS.map((r) => (
          <Pill
            key={r.id}
            accent={Accent.gold}
            label={r.label}
            dot
            selected={regions.some((x) => x.id === r.id)}
            onPress={() => onToggleRegion(r)}
          />
        ))}
      </View>

      <Kicker style={styles.equipKicker}>In your own words · optional</Kicker>
      <View
        style={[styles.noteCard, note.trim().length > 0 && { borderColor: ONB.base }]}>
        <TextInput
          value={note}
          onChangeText={onNote}
          placeholder={placeholder}
          placeholderTextColor={Temple.inkFaint}
          multiline
          style={styles.noteInput}
        />
      </View>

      {/* Glass reassurance card with the coach's spark */}
      <View style={styles.reassureCard}>
        <View style={styles.reassureSpark}>
          <SymbolView name="sparkle" tintColor={ONB.deep} size={16} />
        </View>
        <Text style={styles.reassureText}>{reassurance}</Text>
      </View>
    </View>
  );
}

// ————————————————————————————— shared bits —————————————————————————————
function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

function Kicker({ children, style }: { children: string; style?: any }) {
  return <Text style={[styles.kicker, style]}>{children}</Text>;
}

function OptionRow({
  accent,
  label,
  desc,
  selected,
  onPress,
}: {
  accent: AccentSet;
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
        selected && { borderColor: accent.base, backgroundColor: accent.tint },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardText}>
        <Text style={styles.cardLabel}>{label}</Text>
        {desc ? <Text style={styles.cardDesc}>{desc}</Text> : null}
      </View>
      <View
        style={[
          styles.check,
          selected && { borderColor: accent.deep, backgroundColor: accent.deep },
        ]}>
        {selected ? <SymbolView name="checkmark" tintColor="#fff" size={13} /> : null}
      </View>
    </Pressable>
  );
}

function Pill({
  accent,
  label,
  selected,
  dot,
  onPress,
}: {
  accent: AccentSet;
  label: string;
  selected: boolean;
  dot?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        selected && { borderColor: accent.base, backgroundColor: accent.tint },
        pressed && styles.pressed,
      ]}>
      {dot && selected ? (
        <View
          style={[
            styles.pillDot,
            { backgroundColor: accent.deep, shadowColor: accent.base },
          ]}
        />
      ) : null}
      <Text style={[styles.pillText, selected && { color: Temple.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.marble },
  flex: { flex: 1 },

  lightShaft: {
    position: 'absolute',
    top: -40,
    left: '12%',
    width: 170,
    height: 340,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 120,
    transform: [{ rotate: '18deg' }],
    opacity: 0.7,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Temple.surface,
    borderWidth: 0.5,
    borderColor: Temple.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 40 },
  pressed: { opacity: 0.6 },

  dots: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Temple.inkGhost },

  body: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, flexGrow: 1 },

  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  caption: { textAlign: 'center', fontFamily: Type.body, fontSize: 13, color: Temple.inkFaint },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ONB.deep,
    shadowColor: ONB.base,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryDisabled: {
    backgroundColor: Temple.inkGhost,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    fontFamily: Type.body,
    fontSize: 16.5,
    letterSpacing: 0.4,
    color: '#fff',
  },

  // Welcome
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  markWrap: {
    width: 120,
    height: 120,
    marginBottom: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ONB.tint,
  },
  kickerCenter: {
    fontFamily: Type.bodyMedium,
    fontSize: 11,
    letterSpacing: 2.8,
    color: Temple.inkFaint,
  },
  brand: {
    fontFamily: Type.display,
    fontSize: 60,
    letterSpacing: 6,
    color: Temple.ink,
  },
  serif: {
    fontFamily: Type.serifItalic,
    fontStyle: 'italic',
    fontSize: 21,
    lineHeight: 29,
    textAlign: 'center',
    color: Temple.inkSoft,
    maxWidth: 300,
  },

  // Headings
  section: { gap: Spacing.four, paddingTop: Spacing.two },
  heading: { gap: Spacing.two },
  title: { fontFamily: Type.display, fontSize: 38, lineHeight: 42, color: Temple.ink },
  sub: { fontFamily: Type.bodyLight, fontSize: 14.5, lineHeight: 22, color: Temple.inkSoft },
  kicker: {
    fontFamily: Type.bodyMedium,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: Temple.inkFaint,
  },
  equipKicker: { marginTop: Spacing.two, marginBottom: -Spacing.two },

  // Option cards
  cards: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: Temple.line,
    backgroundColor: Temple.surface,
  },
  cardText: { flex: 1, gap: 2 },
  cardLabel: { fontFamily: Type.body, fontSize: 16.5, color: Temple.ink },
  cardDesc: { fontFamily: Type.bodyLight, fontSize: 13, lineHeight: 18, color: Temple.inkSoft },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Temple.inkGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pills
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: Temple.line,
    backgroundColor: Temple.surface,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  pillText: { fontFamily: Type.body, fontSize: 14.5, color: Temple.inkSoft },

  // Note
  noteCard: {
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: Temple.line,
    backgroundColor: Temple.surface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noteInput: {
    minHeight: 84,
    fontFamily: Type.bodyLight,
    fontSize: 14.5,
    lineHeight: 22,
    color: Temple.ink,
    textAlignVertical: 'top',
  },

  // Reassurance (glass)
  reassureCard: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: Temple.line,
    backgroundColor: Temple.surface,
    padding: Spacing.three,
  },
  reassureSpark: { marginTop: 2 },
  reassureText: {
    flex: 1,
    fontFamily: Type.serifItalic,
    fontStyle: 'italic',
    fontSize: 17.5,
    lineHeight: 24,
    color: Temple.inkSoft,
  },
});
