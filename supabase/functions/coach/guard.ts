// guard.ts — a deterministic safety backstop over the model's reply before it's persisted
// (Master Build Spec §7.1). The PRIMARY safety lever is the system prompt; this is the belt-and-
// suspenders pass. It is intentionally conservative and narrow: it never weakens a reply, it only
// guarantees a medical deferral is present when the lifter reports a red-flag symptom.
//
// This is NOT a substitute for the eval harness (the next build, which gates every prompt change).

// Red-flag symptoms that are out of a training coach's scope and must be deferred to a clinician.
const RED_FLAG =
  /\b(chest pain|chest tightness|can'?t breathe|short(ness)? of breath|numb(ness)?|tingl(e|ing)|dizz(y|iness)|light-?headed|faint(ed|ing)?|black(ed|ing)? out|pass(ed)? out|blurred vision|shooting pain|radiating pain)\b/i;

// Does the reply already point them to a professional / urgent care?
const HAS_DEFERRAL =
  /\b(doctor|physician|medical|clinician|professional|urgent care|emergency|emergency room|\bER\b|911|seek (care|help|attention)|get (it )?checked)\b/i;

const DEFERRAL =
  'Before anything else: what you’re describing is outside what a training coach should advise on. Please stop training and check with a doctor — and seek urgent care if it’s severe, sudden, or not easing. We’ll pick the work back up once you’re cleared.';

export type GuardResult = { text: string; flagged: boolean };

export function guardReply(userText: string, reply: string): GuardResult {
  const flagged = RED_FLAG.test(userText);
  if (flagged && !HAS_DEFERRAL.test(reply)) {
    // The model didn't defer a red-flag symptom — lead with the deferral, keep its reply after.
    return { text: `${DEFERRAL}\n\n${reply.trim()}`.trim(), flagged: true };
  }
  return { text: reply.trim(), flagged };
}
