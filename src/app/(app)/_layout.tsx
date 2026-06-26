import { useEffect } from 'react';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/lib/auth';
import { seedIfNeeded } from '@/lib/seed';

// Authenticated area. Reached only when RootNavigator's session+onboarded guard passes.
// Ensure the seed exists on entry (idempotent) so users who onboarded before seeding
// existed still get their authored session + coach thread.
export default function AppLayout() {
  const { session } = useAuth();
  useEffect(() => {
    if (session?.user.id) seedIfNeeded(session.user.id);
  }, [session?.user.id]);

  return <AppTabs />;
}
