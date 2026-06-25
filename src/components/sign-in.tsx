import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';

// Minimal functional sign-in (real UI comes later, per "backend first").
// Two providers:
//  - Apple: native flow, iOS only. Get an identity token on-device, hand it to
//    Supabase. (Apple's App Store rules require offering Apple sign-in whenever
//    another social login is offered on iOS.)
//  - Google: web OAuth (PKCE). Open Supabase's hosted flow in a browser, get a
//    ?code=... back on our redirect, exchange it for a session. Works on iOS,
//    Android, and from a Windows dev machine.
// MVP ships iOS/Apple-only sign-in. The Google flow below stays intact but gated
// off; flip this to true (and configure the Google provider) to re-enable it.
const SHOW_GOOGLE = false;

export default function SignIn() {
  // AppleAuthenticationButton must never render on Android, and only render on
  // iOS versions/devices where the API is actually available.
  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

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

  const handleGoogle = async () => {
    try {
      // Deep link back into the app (scheme "temple" from app.json). This exact
      // URL must be allow-listed in Supabase → Authentication → URL Configuration.
      const redirectTo = Linking.createURL('/');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase.');

      // openAuthSessionAsync hands us the redirect URL directly on success, so
      // no global deep-link listener is needed for the in-flow case.
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return; // user cancelled / dismissed

      const { queryParams } = Linking.parse(result.url);
      const code = queryParams?.code;
      if (typeof code !== 'string') {
        throw new Error('No authorization code returned from Google.');
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      // AuthProvider's onAuthStateChange picks up the new session automatically.
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message ?? String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Temple</Text>
      <Text style={styles.subtitle}>One coach. One memory.</Text>

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={styles.button}
          onPress={handleApple}
        />
      )}

      {SHOW_GOOGLE && (
        <Pressable
          onPress={handleGoogle}
          style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 44, fontWeight: '700' },
  subtitle: { fontSize: 16, opacity: 0.55, marginBottom: 36 },
  button: { width: 260, height: 48 },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#747775',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1f1f1f' },
  pressed: { opacity: 0.6 },
});
