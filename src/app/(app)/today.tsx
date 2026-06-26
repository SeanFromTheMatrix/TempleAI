import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Accent, Primary, Radius, SerifItalic, Temple } from '@/constants/temple';
import { Spacing } from '@/constants/theme';

// Today — the authored session (Master Build Spec §5.3). SCAFFOLD: header copy is the spec's known
// seed (Push · Incline Focus + the sternum note). The exercise cards render the real card STRUCTURE
// (name · target · last · cue · done · Swap) but with placeholder content until the seed (step 3) +
// the prototype's data.js provide the 5 actual movements. Logging (§5.4) is the next slice.

const EXAMPLE_CARD = {
  name: 'Incline Barbell Press',
  target: '4 × 6 @ 135 lb',
  last: 'Last: 130 × 6',
  cue: 'Tuck the elbows; stop short of a deep stretch to spare the sternum.',
};

export default function TodayScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerMeta}>
              <Text style={styles.title}>Push · Incline Focus</Text>
              <Text style={styles.sub}>5 movements · ~45 min</Text>
            </View>
            <View style={styles.ring}>
              <Text style={styles.ringText}>0/5</Text>
            </View>
          </View>
          <Text style={styles.note}>
            Built around your sternum — no deep pec stretch today. Strength over heroics.
          </Text>
        </View>

        {/* Example exercise card (structure preview) */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardName}>{EXAMPLE_CARD.name}</Text>
            <View style={styles.swap}>
              <Text style={styles.swapText}>Swap</Text>
            </View>
          </View>
          <Text style={styles.cardTarget}>{EXAMPLE_CARD.target}</Text>
          <Text style={styles.cardLast}>{EXAMPLE_CARD.last}</Text>
          <Text style={styles.cardCue}>{EXAMPLE_CARD.cue}</Text>
          <View style={styles.logButton}>
            <Text style={styles.logText}>Log sets</Text>
          </View>
        </View>

        {/* Placeholder note for the remaining seeded movements */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {'Your full authored session loads here once seeding is wired (waiting on the ' +
              "prototype's data.js for the exact 5 movements, cues, and alternates)."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.paper },
  body: { padding: Spacing.four, gap: Spacing.three },

  header: { gap: Spacing.three },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerMeta: { gap: 4, flex: 1 },
  title: { fontSize: 26, fontWeight: '700', color: Temple.ink, lineHeight: 30 },
  sub: { fontSize: 14, color: Temple.inkSoft },
  ring: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: Primary.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { fontSize: 14, fontWeight: '600', color: Temple.ink },
  note: {
    fontFamily: SerifItalic,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 23,
    color: Temple.inkSoft,
  },

  card: {
    backgroundColor: Temple.paperRaised,
    borderColor: Temple.line,
    borderWidth: 0.5,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 18, fontWeight: '600', color: Temple.ink, flex: 1 },
  swap: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Accent.lavender.tint,
  },
  swapText: { fontSize: 13, color: Accent.lavender.deep, fontWeight: '500' },
  cardTarget: { fontSize: 16, color: Temple.ink },
  cardLast: { fontSize: 14, color: Temple.inkFaint },
  cardCue: {
    fontFamily: SerifItalic,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 21,
    color: Temple.inkSoft,
  },
  logButton: {
    marginTop: Spacing.one,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Temple.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logText: { fontSize: 15, fontWeight: '600', color: Temple.paper },

  placeholder: {
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: Temple.line,
    borderStyle: 'dashed',
    padding: Spacing.three,
  },
  placeholderText: { fontSize: 14, lineHeight: 20, color: Temple.inkFaint },
});
