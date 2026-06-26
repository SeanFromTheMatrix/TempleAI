import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import { supabase } from './supabase';

// The signed-in user's profiles row. `goal` is text[] after migration 0002
// (element 0 = primary). Onboarding is what fills goal/level/equipment in.
export type Profile = {
  id: string;
  name: string | null;
  goal: string[] | null;
  target: string | null;
  level: string | null;
  coaching_mode: string | null;
  equipment: string[];
  units: string;
  health_connected: boolean;
  created_at: string;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  onboarded: boolean;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  onboarded: false,
  refresh: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (id: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return error ? null : ((data as Profile | null) ?? null);
  }, []);

  // Initial load + react to sign-in/out. Promise-chained (no synchronous setState
  // in the effect body) so the fetch never triggers a cascading render. `loading`
  // stays true until auth resolves, so the router never flashes onboarding at an
  // already-onboarded user on cold launch.
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const work = userId ? fetchProfile(userId) : Promise.resolve<Profile | null>(null);
    work.then((p) => {
      if (!active) return;
      setProfile(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [authLoading, userId, fetchProfile]);

  // Re-read after a write (e.g. finishing onboarding) so the routing gate flips.
  // Called from an event handler, not an effect.
  const refresh = useCallback(async () => {
    setProfile(userId ? await fetchProfile(userId) : null);
  }, [userId, fetchProfile]);

  // Onboarded once a goal exists (survives restart — it's persisted in profiles).
  const onboarded = !!profile?.goal && profile.goal.length > 0;

  return (
    <ProfileContext.Provider value={{ profile, loading, onboarded, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
