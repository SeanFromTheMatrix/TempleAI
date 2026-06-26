// Temple design tokens — ported 1:1 from the prototype's app/temple.css (the marble theme).
// Colors are exact; the oklch accents were converted to sRGB hex. Fonts are the real
// Cormorant Garamond (display) + Jost (UI), loaded via expo-font in src/app/_layout.tsx.

export const Temple = {
  marble: '#f4efe6', // --marble, the warm limestone background field
  marbleDeep: '#ece5d8', // --marble-deep (gradient foot)
  paper: '#fbf8f2', // --paper, card surfaces
  surface: 'rgba(252,250,244,0.72)', // --surface, frosted glass

  ink: '#2c2823', // --ink
  inkSoft: '#6f685d', // --ink-soft
  inkFaint: '#a39c8f', // --ink-faint
  inkGhost: '#c5bdae', // --ink-ghost

  line: 'rgba(44,40,35,0.09)', // --line
  hair: 'rgba(44,40,35,0.06)', // --hair
} as const;

// The four "lightsaber pastel" accents (base · deep · tint). Sage = healthy/recovery,
// gold = caution/protect, lavender = significant/advanced, sky = info/neutral.
export const Accent = {
  sky: { base: '#acd4ed', deep: '#3495d0', tint: '#d6ecf9' },
  sage: { base: '#b5d8bb', deep: '#4d9965', tint: '#dbeede' },
  lavender: { base: '#d6c5eb', deep: '#8d6cc2', tint: '#ece3f8' },
  gold: { base: '#e3cfa5', deep: '#c29647', tint: '#f6ead1' },
} as const;

// Temple's warm primary accent (gold).
export const Primary = Accent.gold;

// "Here with you" status dot.
export const StatusGreen = Accent.sage.deep;

// Font families (exact @expo-google-fonts export names).
export const Type = {
  display: 'CormorantGaramond_500Medium', // wordmark + session/headline titles
  displayLight: 'CormorantGaramond_400Regular',
  displaySemi: 'CormorantGaramond_600SemiBold',
  serifItalic: 'CormorantGaramond_400Regular_Italic', // reflective lines, cues, "considering…"
  body: 'Jost_400Regular',
  bodyLight: 'Jost_300Light',
  bodyMedium: 'Jost_500Medium',
  bodySemi: 'Jost_600SemiBold',
} as const;

export const Radius = {
  card: 22, // --radius
  lg: 30, // --radius-lg
  sm: 14, // --radius-sm
  pill: 9999,
} as const;
