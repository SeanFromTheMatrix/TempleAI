import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import BottomSheet from '@/components/bottom-sheet';
import { Primary, Radius, Temple, Type } from '@/constants/temple';
import { Spacing } from '@/constants/theme';
import { getSetLogs, logSet, markExerciseDone, type SetLog } from '@/lib/logging';
import { isBodyweightPlus, type SessionExercise } from '@/lib/session';

// Log a set (Master Build Spec §5.4), ported from the prototype's log.jsx. Opens per exercise.
// Each "Log set" writes a set_logs row immediately; the final target set marks the lift done.

function Stepper({
  label,
  value,
  unit,
  step,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}>
          <SymbolView name="minus" tintColor={Temple.ink} size={22} />
        </Pressable>
        <View style={styles.stepperValue}>
          <Text style={styles.stepperNum}>{value}</Text>
          <Text style={styles.stepperUnit}>{unit}</Text>
        </View>
        <Pressable
          onPress={() => onChange(value + step)}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}>
          <SymbolView name="plus" tintColor={Temple.ink} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

export default function LogSheet({
  exercise,
  onClose,
  onChanged,
}: {
  exercise: SessionExercise;
  onClose: () => void;
  onChanged: () => void;
}) {
  const isPlus = isBodyweightPlus(exercise.movement);
  const total = exercise.target_sets ?? 3;

  const [weight, setWeight] = useState(exercise.target_weight ?? 50);
  const [reps, setReps] = useState(exercise.target_reps ?? 8);
  const [rir, setRir] = useState(2);
  const [logged, setLogged] = useState<SetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getSetLogs(exercise.id).then((rows) => {
      if (!active) return;
      setLogged(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [exercise.id]);

  const remaining = Math.max(0, total - logged.length);
  const complete = logged.length >= total;

  const handleLog = async () => {
    if (busy) return;
    setBusy(true);
    const next = logged.length + 1;
    const row = await logSet({ sessionExerciseId: exercise.id, setIndex: next, weight, reps, rir });
    if (row) {
      const updated = [...logged, row];
      setLogged(updated);
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
      if (updated.length >= total) await markExerciseDone(exercise.id);
      onChanged();
    }
    setBusy(false);
  };

  const rirLabel = rir === 0 ? 'To failure' : rir >= 4 ? 'Plenty left' : 'In control';

  return (
    <BottomSheet onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
              <View style={styles.head}>
                <View style={styles.headMeta}>
                  <Text style={styles.kicker}>LOG A SET</Text>
                  <Text style={styles.name}>{exercise.movement}</Text>
                  <Text style={styles.target}>
                    Target {total} × {exercise.target_reps ?? '?'}
                    {exercise.target_weight != null
                      ? ` @ ${isPlus ? '+' : ''}${exercise.target_weight} lb`
                      : ''}
                  </Text>
                </View>
                <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                  <SymbolView name="xmark" tintColor={Temple.inkSoft} size={20} />
                </Pressable>
              </View>

              {/* Set dots */}
              <View style={styles.dots}>
                {Array.from({ length: total }).map((_, i) => (
                  <View key={i} style={[styles.dot, i < logged.length && styles.dotFilled]} />
                ))}
              </View>

              {/* Steppers */}
              <View style={styles.steppers}>
                <Stepper
                  label={isPlus ? 'Added weight' : 'Weight'}
                  value={weight}
                  unit={isPlus ? '+lb' : 'lb'}
                  step={5}
                  onChange={setWeight}
                />
                <View style={styles.vDivider} />
                <Stepper label="Reps" value={reps} unit="" step={1} min={1} onChange={setReps} />
              </View>

              {/* RIR */}
              <View style={styles.rirBlock}>
                <View style={styles.rirHead}>
                  <Text style={styles.kicker}>REPS IN RESERVE</Text>
                  <Text style={styles.rirHint}>{rirLabel}</Text>
                </View>
                <View style={styles.rirRow}>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setRir(n)}
                      style={[styles.rirBtn, rir === n && styles.rirBtnOn]}>
                      <Text style={[styles.rirText, rir === n && styles.rirTextOn]}>
                        {n}
                        {n === 4 ? '+' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Log button */}
              <Pressable
                onPress={complete ? onClose : handleLog}
                style={({ pressed }) => [styles.logBtn, flash && styles.logBtnFlash, pressed && styles.pressed]}>
                {flash ? (
                  <Text style={styles.logBtnText}>✓  Logged</Text>
                ) : complete ? (
                  <Text style={styles.logBtnText}>✓  Done · back to session</Text>
                ) : (
                  <Text style={styles.logBtnText}>
                    Log set {logged.length + 1}
                    {remaining ? ` · ${remaining} to go` : ''}
                  </Text>
                )}
              </Pressable>

              {/* History */}
              {loading ? (
                <ActivityIndicator style={{ marginTop: Spacing.four }} color={Primary.deep} />
              ) : logged.length > 0 ? (
                <View style={styles.history}>
                  <View style={styles.hDivider} />
                  {logged
                    .slice()
                    .reverse()
                    .map((s) => (
                      <View key={s.id} style={styles.hRow}>
                        <View style={styles.hNum}>
                          <Text style={styles.hNumText}>{s.set_index}</Text>
                        </View>
                        <Text style={styles.hSet}>
                          {s.weight}
                          {isPlus ? '+' : ''} lb × {s.reps}
                        </Text>
                        <Text style={styles.hRir}>{s.rir} RIR</Text>
                      </View>
                    ))}
                </View>
              ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },

  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.three },
  headMeta: { flex: 1, gap: 5 },
  kicker: { fontFamily: Type.bodySemi, fontSize: 10.5, letterSpacing: 1.6, color: Temple.inkFaint },
  name: { fontFamily: Type.display, fontSize: 30, color: Temple.ink, lineHeight: 33 },
  target: { fontFamily: Type.body, fontSize: 13, color: Temple.inkSoft },
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

  dots: { flexDirection: 'row', gap: 7, marginVertical: Spacing.three },
  dot: { flex: 1, height: 5, borderRadius: 5, backgroundColor: Temple.line },
  dotFilled: { backgroundColor: Primary.deep },

  steppers: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  vDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Temple.line },
  stepper: { flex: 1 },
  stepperLabel: { fontFamily: Type.bodySemi, fontSize: 10.5, letterSpacing: 1.6, color: Temple.inkFaint, textAlign: 'center', marginBottom: Spacing.two },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Temple.surface,
    borderWidth: 0.5,
    borderColor: Temple.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  stepperNum: { fontFamily: Type.display, fontSize: 46, lineHeight: 50, color: Temple.ink },
  stepperUnit: { fontFamily: Type.body, fontSize: 14, color: Temple.inkFaint, marginLeft: 4 },

  rirBlock: { marginTop: Spacing.four },
  rirHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: Spacing.two },
  rirHint: { fontFamily: Type.serifItalic, fontSize: 15, color: Temple.inkFaint },
  rirRow: { flexDirection: 'row', gap: Spacing.two },
  rirBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: Temple.surface,
    borderWidth: 0.5,
    borderColor: Temple.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rirBtnOn: { backgroundColor: Primary.tint, borderColor: Primary.base },
  rirText: { fontFamily: Type.display, fontSize: 20, color: Temple.inkSoft },
  rirTextOn: { color: Temple.ink },

  logBtn: {
    marginTop: Spacing.four,
    height: 62,
    borderRadius: Radius.card,
    backgroundColor: Primary.deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnFlash: { backgroundColor: Primary.base },
  logBtnText: { fontFamily: Type.bodyMedium, fontSize: 17, letterSpacing: 0.3, color: '#fff' },

  history: { marginTop: Spacing.three },
  hDivider: { height: 1, backgroundColor: Temple.line, marginBottom: Spacing.two },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 9 },
  hNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Primary.tint,
    borderWidth: 0.5,
    borderColor: Primary.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hNumText: { fontFamily: Type.body, fontSize: 12, color: Primary.deep },
  hSet: { fontFamily: Type.body, fontSize: 15, color: Temple.ink },
  hRir: { fontFamily: Type.body, fontSize: 12.5, color: Temple.inkFaint, marginLeft: 'auto' },
});
