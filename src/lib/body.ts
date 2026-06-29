import { supabase } from './supabase';

// Body check-in data layer (Master Build Spec §6). Injuries and soreness both live in the one
// `issues` table — `kind` ('injury' | 'soreness') disambiguates, and only `active` rows are read
// (cleared items stay as healed history for the §7 memory). The `severity` column doubles as the
// soreness *level* when kind='soreness'. One active row per region per kind.

export type Severity = 'mild' | 'moderate' | 'significant';
export type SoreLevel = 'light' | 'moderate' | 'heavy';

export type Injury = {
  id: string;
  region: string | null;
  label: string;
  severity: Severity;
  note: string | null;
  since: string | null; // ISO date (yyyy-mm-dd)
};

export type Soreness = {
  id: string;
  region: string | null;
  label: string;
  level: SoreLevel;
  note: string | null;
};

export type BodyState = { injuries: Injury[]; soreness: Soreness[] };

const today = () => new Date().toISOString().slice(0, 10);

export async function getBodyState(userId: string): Promise<BodyState> {
  const { data } = await supabase
    .from('issues')
    .select('id, kind, region, label, severity, note, since, created_at')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  const rows = data ?? [];
  const injuries: Injury[] = rows
    .filter((r) => r.kind === 'injury')
    .map((r) => ({
      id: r.id as string,
      region: (r.region as string) ?? null,
      label: (r.label as string) ?? 'Flagged area',
      severity: ((r.severity as string) ?? 'moderate') as Severity,
      note: (r.note as string) ?? null,
      since: (r.since as string) ?? null,
    }));
  const soreness: Soreness[] = rows
    .filter((r) => r.kind === 'soreness')
    .map((r) => ({
      id: r.id as string,
      region: (r.region as string) ?? null,
      label: (r.label as string) ?? 'Sore area',
      level: ((r.severity as string) ?? 'moderate') as SoreLevel,
      note: (r.note as string) ?? null,
    }));
  return { injuries, soreness };
}

// Find the active row for a region+kind so a re-check updates in place (no duplicates).
async function findActive(userId: string, region: string, kind: 'injury' | 'soreness') {
  const { data } = await supabase
    .from('issues')
    .select('id')
    .eq('user_id', userId)
    .eq('region', region)
    .eq('kind', kind)
    .eq('active', true)
    .limit(1)
    .maybeSingle();
  return data?.id as string | undefined;
}

// Track (or re-grade) an injury on a region. Pain supersedes recovery, so any soreness on the
// same region is cleared.
export async function saveInjury(
  userId: string,
  p: { region: string; label: string; severity: Severity },
): Promise<void> {
  await supabase
    .from('issues')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('region', p.region)
    .eq('kind', 'soreness')
    .eq('active', true);

  const existing = await findActive(userId, p.region, 'injury');
  if (existing) {
    await supabase.from('issues').update({ severity: p.severity, label: p.label }).eq('id', existing);
  } else {
    await supabase.from('issues').insert({
      user_id: userId,
      kind: 'injury',
      region: p.region,
      label: p.label,
      severity: p.severity,
      since: today(),
    });
  }
}

// Log (or re-grade) soreness on a region.
export async function saveSoreness(
  userId: string,
  p: { region: string; label: string; level: SoreLevel },
): Promise<void> {
  const existing = await findActive(userId, p.region, 'soreness');
  if (existing) {
    await supabase.from('issues').update({ severity: p.level, label: p.label }).eq('id', existing);
  } else {
    await supabase.from('issues').insert({
      user_id: userId,
      kind: 'soreness',
      region: p.region,
      label: p.label,
      severity: p.level,
      since: today(),
    });
  }
}

// Soft-clear — keep the row as healed history (active=false) so §7 can still reason about it.
export async function clearIssue(id: string): Promise<void> {
  await supabase.from('issues').update({ active: false }).eq('id', id);
}
