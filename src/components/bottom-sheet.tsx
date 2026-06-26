import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Temple } from '@/constants/temple';
import { Spacing } from '@/constants/theme';

const SCREEN_H = Dimensions.get('window').height;

// A bottom sheet where the dim backdrop appears instantly at full height and only the panel
// slides up — unlike Modal's built-in `slide`, which animates the backdrop up too.
export default function BottomSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const [translateY] = useState(() => new Animated.Value(SCREEN_H));

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.anim, { transform: [{ translateY }] }]}>
          <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <View style={styles.grip} />
              {children}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(44,40,35,0.18)' },
  anim: { width: '100%' },
  sheetWrap: { maxHeight: '90%' },
  sheet: {
    backgroundColor: Temple.paper,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  grip: { width: 42, height: 5, borderRadius: 5, backgroundColor: Temple.inkGhost, alignSelf: 'center', marginBottom: Spacing.three },
});
