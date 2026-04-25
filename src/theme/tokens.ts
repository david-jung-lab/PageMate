export const colors = {
  primary: '#4F86C6',
  primaryHover: '#3F6FA8',
  primaryPressed: '#325A8A',
  primarySoft: '#E8F0FA',
  secondary: '#F4A261',
  secondaryHover: '#E08A45',
  secondarySoft: '#FCEFE0',

  bg: '#FAFAF8',
  surface: '#FFFFFF',
  surface2: '#F5F4F0',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  success: '#4F9D7A',
  successSoft: '#E6F1EB',
  warning: '#D9A441',
  warningSoft: '#FBF3E0',
  danger: '#C8553D',
  dangerSoft: '#F7E4DF',
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
} as const;

export const fontSize = {
  h1: 28,
  h2: 24,
  h3: 18,
  body: 15,
  small: 13,
  caption: 12,
} as const;

export const bookCoverPalettes: Record<string, [string, string]> = {
  blue: ['#4F86C6', '#3F6FA8'],
  orange: ['#F4A261', '#E08A45'],
  sage: ['#8FA889', '#6E8C68'],
  plum: ['#7B5E8C', '#5F4870'],
  sand: ['#C9B79C', '#A8997D'],
  ink: ['#2A3340', '#1A2230'],
};
