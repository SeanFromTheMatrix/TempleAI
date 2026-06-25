import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';

// Minimal functional sign-in (UI comes later, per "backend first"). The native
// Apple flow: get an identity token on-device, hand it to Supabase for a session.
export default function SignIn() {
  const handleApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple.');
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
      // AuthProvider's onAuthStateChange picks up the new session automatically.
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return; // user dismissed the sheet
      Alert.alert('Sign in failed', e?.message ?? String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Temple</Text>
      <Text style={styles.subtitle}>One coach. One memory.</Text>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={styles.button}
        onPress={handleApple}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  title: { fontSize: 44, fontWeight: '700' },
  subtitle: { fontSize: 16, opacity: 0.55, marginBottom: 36 },
  button: { width: 260, height: 48 },
});
