import AppTabs from '@/components/app-tabs';

// Authenticated area. Reached only when RootNavigator's session guard passes.
export default function AppLayout() {
  return <AppTabs />;
}
