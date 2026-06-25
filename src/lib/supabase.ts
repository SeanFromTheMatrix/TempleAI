import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Check temple/.env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
  );
}

// One client for the whole app. Sessions persist to AsyncStorage so the user
// stays signed in across app restarts (Milestone 1 requirement).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE: Google OAuth returns ?code=... to our redirect, which we hand to
    // exchangeCodeForSession. supabase-js stashes the code verifier in storage
    // (AsyncStorage) between the two calls. Apple's signInWithIdToken is
    // unaffected by flowType.
    flowType: 'pkce',
  },
});
