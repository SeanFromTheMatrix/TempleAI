import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProfileProvider, useProfile } from '@/lib/profile';

// Hold the native splash until we've checked AsyncStorage for a persisted
// session, so an already-signed-in user never flashes the sign-in screen.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ProfileProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <SplashGate />
          <AnimatedSplashOverlay />
          <RootNavigator />
        </ThemeProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

// Reveals the app once the session restore AND (if signed in) the profile fetch
// complete, so we never flash onboarding at an already-onboarded user.
function SplashGate() {
  const { loading: authLoading } = useAuth();
  const { loading: profileLoading } = useProfile();
  if (!authLoading && !profileLoading) {
    SplashScreen.hide();
  }
  return null;
}

// The root must render a navigator. `Stack.Protected` swaps which group is
// mountable based on the guard, and Expo Router redirects accordingly.
// Three states: signed out → sign-in; signed in but no goal yet → onboarding;
// signed in and onboarded → the app.
function RootNavigator() {
  const { session } = useAuth();
  const { onboarded } = useProfile();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session && onboarded}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
