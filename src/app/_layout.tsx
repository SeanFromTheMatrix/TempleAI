import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth';

// Hold the native splash until we've checked AsyncStorage for a persisted
// session, so an already-signed-in user never flashes the sign-in screen.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SplashGate />
        <AnimatedSplashOverlay />
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}

// Reveals the app once the initial session restore completes.
function SplashGate() {
  const { loading } = useAuth();
  if (!loading) {
    SplashScreen.hide();
  }
  return null;
}

// The root must render a navigator. `Stack.Protected` swaps which group is
// mountable based on the guard, and Expo Router redirects accordingly.
function RootNavigator() {
  const { session } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
