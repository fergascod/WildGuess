import { Platform } from 'react-native';

export const colors = {
  bg: '#f4f6f2',
  surface: '#ffffff',
  border: '#e2e8dc',
  text: '#1e2a1a',
  muted: '#6b7a63',
  accent: '#3a6b35',
  accentHover: '#2c5229',
  accentLight: '#eaf2e8',
  link: '#3a6b35',
  linkHover: '#2c5229',
  correct: '#22c55e',
  wrong: '#ef4444',
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  card: 16,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const navbarHeight = 56;

// Cross-platform card shadow approximating `0 4px 24px rgba(30,42,26,0.08)`.
export const cardShadow = Platform.select({
  web: { boxShadow: '0 4px 24px 0 rgba(30, 42, 26, 0.08)' },
  ios: {
    shadowColor: '#1e2a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
}) as object;

export const accentShadow = Platform.select({
  web: { boxShadow: '0 2px 8px 0 rgba(58, 107, 53, 0.18)' },
  ios: {
    shadowColor: '#3a6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
}) as object;

export const fonts = {
  // Custom display/body fonts were referenced in the old CSS but never loaded;
  // fall back to platform system fonts.
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, sans-serif' }),
};
