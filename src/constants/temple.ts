// Temple design tokens — ported from Master Build Spec §8 (the calm, marble aesthetic).
// NOTE: placeholder hexes/approximations until the prototype's data.js / CSS variables arrive;
// the exact palette + fonts (Jost / Cormorant Garamond) get swapped in then. The Temple screens
// use this paper palette regardless of system light/dark — the aesthetic is intentionally warm-light.

import { Platform } from 'react-native';

export const Temple = {
  paper: '#f4efe6', // --paper, warm paper background
  paperRaised: '#fbf8f2', // frosted surface over paper
  ink: '#2c2823', // --ink
  inkSoft: '#6b6358', // secondary text
  inkFaint: '#9a9286', // tertiary / captions
  inkGhost: '#c7c0b3', // hairline-on-ink, disabled
  line: 'rgba(44,40,35,0.12)', // --line, 0.5px hairline borders
  surface: 'rgba(255,255,255,0.62)', // --surface (frosted glass)
} as const;

// Four accent hues (each with a deep + a tint for fills). Sage = healthy/recovery,
// gold = caution/protect, lavender = experience/advanced, sky = neutral/info.
export const Accent = {
  sky: { base: '#5E86A8', deep: '#3F6688', tint: 'rgba(94,134,168,0.14)' },
  sage: { base: '#7E9B6E', deep: '#5C7A4E', tint: 'rgba(126,155,110,0.16)' },
  lavender: { base: '#8E7CC3', deep: '#6E5CA3', tint: 'rgba(142,124,195,0.16)' },
  gold: { base: '#C0A04A', deep: '#9C7E2E', tint: 'rgba(192,160,74,0.16)' },
} as const;

// The app's primary accent (spec §8 default gold/warm).
export const Primary = Accent.gold;

export const Radius = {
  card: 18,
  sheet: 34,
  pill: 9999,
} as const;

// Serif family for the wordmark + session/headline titles (Cormorant Garamond in the real build;
// iOS `ui-serif` = New York is a close stand-in until the font files are loaded via expo-font).
export const Serif = Platform.select({ ios: 'ui-serif', default: 'serif' });
// Serif italic for reflective lines / "considering…".
export const SerifItalic = Platform.select({ ios: 'ui-serif', default: 'serif' });

// "Here with you" status dot (calm sage green).
export const StatusGreen = '#6F9A6A';
