import type { Profile } from './profile';

// Deterministic stand-in for the coach's first message (Master Build Spec §5.2 / §6.4): it must
// reference the lifter's goal and any flagged injury. When the Anthropic-backed `coach` edge
// function lands (step 5), this is replaced by a generated greeting — same contract, real model.

const GOAL_PHRASE: Record<string, string> = {
  strength: 'building strength & size',
  lean: 'getting leaner while staying strong',
  mobility: 'moving well and staying mobile',
  health: 'training for steady, balanced health',
  rebuild: 'rebuilding carefully after a break',
};

function joinLabels(labels: string[]): string {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

export function buildCoachIntro(profile: Profile | null, issueLabels: string[]): string {
  const primary = profile?.goal?.[0];
  const goalPhrase = (primary && GOAL_PHRASE[primary]) || 'training with intent';
  const name = profile?.name?.trim();

  const opener = name ? `Welcome, ${name}.` : 'Welcome.';
  const goalLine = `I know you're here for ${goalPhrase}.`;
  const careLine = issueLabels.length
    ? `We'll train around your ${joinLabels(issueLabels.map((l) => l.toLowerCase()))} — I'll keep them out of harm's way every session.`
    : `Nothing flagged to work around, so we start with a clean slate.`;
  const closing = `Today's session is below when you're ready. Strength over heroics.`;

  return `${opener} ${goalLine} ${careLine} ${closing}`;
}
