import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Accent, Primary, Radius, Temple, Type } from '@/constants/temple';
import { Spacing } from '@/constants/theme';

// Today — the authored session (Master Build Spec §5.3). SCAFFOLD: header copy is the real seed
// (Push · Incline Focus + the sternum note from data.js). One example card shows the card STRUCTURE
// (name · target · last · cue · done · Swap); the full 5-movement port + logging (§5.4) lands with
// the core-loop slice once seeding is wired.

const EXAMPLE_CARD = {
  name: 'Incline Barbell Press',
  target: '4 × 5 @ 155 lb',
  last: 'Last: 150 × 5',
  cue: 'Elbows ~45°. Stop a hair above a full stretch to protect the sternum.',
};

export default function TodayScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerMeta}>
              <Text style={styles.kicker}>TODAY'S SESSION</Text>
              <Text style={styles.title}>Push · Incline Focus</Text>
              <Text style={styles.sub}>5 movements · ~48 min</Text>
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

        {/* Placeholder for the remaining seeded movements */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {'The full 5-movement session loads here once seeding is wired (data.js is in the repo; ' +
              'needs migration 0003 + the seed write).'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Temple.marble },
  body: { padding: Spacing.four, gap: Spacing.three },

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
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontFamily: Type.display, fontSize: 20, color: Temple.ink, flex: 1 },
  swap: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Accent.lavender.tint,
  },
  swapText: { fontFamily: Type.bodyMedium, fontSize: 13, color: Accent.lavender.deep },
  cardTarget: { fontFamily: Type.body, fontSize: 16, color: Temple.ink },
  cardLast: { fontFamily: Type.body, fontSize: 14, color: Temple.inkFaint },
  cardCue: { fontFamily: Type.serifItalic, fontSize: 16, lineHeight: 22, color: Temple.inkSoft },
  logButton: {
    marginTop: Spacing.one,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Temple.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logText: { fontFamily: Type.bodyMedium, fontSize: 15, color: Temple.marble },

  placeholder: {
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: Temple.line,
    borderStyle: 'dashed',
    padding: Spacing.three,
  },
  placeholderText: { fontFamily: Type.body, fontSize: 14, lineHeight: 20, color: Temple.inkFaint },
});
