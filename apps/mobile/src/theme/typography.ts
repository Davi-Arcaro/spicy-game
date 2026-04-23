import type { TextStyle } from 'react-native';

// Family names match the file basenames registered in expo-font.
// Doc 09 calls this out: when loading individual weights, the fontFamily
// must be the file name (no `fontWeight` resolution across platforms).
type Variant = TextStyle;

export const typography = {
  display: {
    xl: {
      fontFamily: 'Fraunces-Bold',
      fontSize: 48,
      lineHeight: 54,
      letterSpacing: -0.5,
    } satisfies Variant,
    lg: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 36,
      lineHeight: 42,
      letterSpacing: -0.3,
    } satisfies Variant,
    md: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.2,
    } satisfies Variant,
  },
  heading: {
    lg: {
      fontFamily: 'Inter-Bold',
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.2,
    } satisfies Variant,
    md: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.1,
    } satisfies Variant,
    sm: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: 0,
    } satisfies Variant,
  },
  body: {
    lg: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      lineHeight: 24,
    } satisfies Variant,
    md: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      lineHeight: 20,
    } satisfies Variant,
    sm: {
      fontFamily: 'Inter-Regular',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.1,
    } satisfies Variant,
  },
  button: {
    lg: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0.2,
    } satisfies Variant,
    md: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0.2,
    } satisfies Variant,
  },
  caption: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } satisfies Variant,
} as const;

// Dotted-path variant keys used by <Text variant="display.xl" />
export type TypographyVariant =
  | `display.${keyof typeof typography.display}`
  | `heading.${keyof typeof typography.heading}`
  | `body.${keyof typeof typography.body}`
  | `button.${keyof typeof typography.button}`
  | 'caption';

export function resolveVariant(variant: TypographyVariant): TextStyle {
  if (variant === 'caption') return typography.caption;
  const [group, size] = variant.split('.') as [
    'display' | 'heading' | 'body' | 'button',
    string,
  ];
  return (typography[group] as Record<string, TextStyle>)[size];
}
