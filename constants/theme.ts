export const DARK_COLORS = {
  bg: '#121316',
  bgElevated: '#0D0E10',
  card: '#1C1E23',
  cardElevated: '#26282E',
  cardBorder: '#2A2D33',
  text: '#F2F2F0',
  muted: '#83878F',
  mutedDim: '#4A4E56',
  accent: '#FF4B2B',
  accentDim: '#4A241C',
  done: '#B4FF39',
  doneBg: '#1E2418',
  doneBorder: '#33421F',
  danger: '#FF5C5C',
} as const;

export const LIGHT_COLORS = {
  bg: '#F5F6F8',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#F0F1F4',
  cardBorder: '#E2E4E9',
  text: '#14161A',
  muted: '#6B7280',
  mutedDim: '#B8BCC4',
  accent: '#2563EB',
  accentDim: '#DCE6FB',
  done: '#15803D',
  doneBg: '#E7F5EC',
  doneBorder: '#BEE3C9',
  danger: '#DC2626',
} as const;

export type ThemeColors = { [K in keyof typeof DARK_COLORS]: string };

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const FONT = {
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
};
