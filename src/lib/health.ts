import {
  getMostRecentQuantitySample,
  isHealthDataAvailableAsync,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';

import { supabase } from './supabase';

// Apple Health (HealthKit) recovery (Master Build Spec §6 — the Body readiness card). Slice 1 reads
// the two cleanest recovery signals — heart-rate variability (SDNN) and resting heart rate — and
// shows them on the readiness card. Sleep (which needs sleep-stage aggregation) and baseline/trend
// comparison are the follow-up slice. HealthKit is iOS-only and absent in Expo Go.

const READ_TYPES = [
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRestingHeartRate',
] as const;

export type RecoveryMetric = { id: 'hrv' | 'rhr'; label: string; value: number; unit: string };
export type Recovery = { metrics: RecoveryMetric[] };

export async function isHealthAvailable(): Promise<boolean> {
  try {
    return await isHealthDataAvailableAsync();
  } catch {
    return false;
  }
}

// Ask for read access, then remember the choice on the profile so other surfaces (and §7 memory)
// know health is wired. Returns whether the user is now connected.
export async function connectHealth(userId: string): Promise<boolean> {
  const ok = await requestAuthorization({ toRead: READ_TYPES });
  if (ok) {
    await supabase.from('profiles').update({ health_connected: true }).eq('id', userId);
  }
  return ok;
}

export async function disconnectHealth(userId: string): Promise<void> {
  // HealthKit gives no API to revoke; we just stop reading and forget the flag.
  await supabase.from('profiles').update({ health_connected: false }).eq('id', userId);
}

// Latest HRV + resting HR, if present. Returns null when nothing has been recorded yet (a fresh
// sim, or before the watch has synced) so the UI can stay honest about "gathering data".
export async function getRecovery(): Promise<Recovery | null> {
  try {
    const [hrv, rhr] = await Promise.all([
      getMostRecentQuantitySample('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'ms'),
      getMostRecentQuantitySample('HKQuantityTypeIdentifierRestingHeartRate', 'count/min'),
    ]);

    const metrics: RecoveryMetric[] = [];
    if (hrv) metrics.push({ id: 'hrv', label: 'HRV', value: Math.round(hrv.quantity), unit: 'ms' });
    if (rhr) metrics.push({ id: 'rhr', label: 'Resting HR', value: Math.round(rhr.quantity), unit: 'bpm' });

    return metrics.length ? { metrics } : null;
  } catch {
    return null;
  }
}
