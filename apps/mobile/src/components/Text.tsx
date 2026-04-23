import {
  Text as RNText,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { useColors } from '@/theme';
import type { ColorTokens } from '@/theme/colors';
import { resolveVariant, type TypographyVariant } from '@/theme/typography';

type ColorPath =
  | `text.${keyof ColorTokens['text']}`
  | `intent.${keyof ColorTokens['intent']}`
  | `card.${keyof ColorTokens['card']}`;

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorPath;
  align?: TextStyle['textAlign'];
}

function resolveColor(colors: ColorTokens, path?: ColorPath): string {
  if (!path) return colors.text.primary;
  const [group, key] = path.split('.') as [
    'text' | 'intent' | 'card',
    string,
  ];
  return (colors[group] as Record<string, string>)[key] ?? colors.text.primary;
}

export function Text({
  variant = 'body.lg',
  color,
  align,
  style,
  ...rest
}: TextProps) {
  const colors = useColors();
  const variantStyle = resolveVariant(variant);
  const resolved: StyleProp<TextStyle> = [
    variantStyle,
    { color: resolveColor(colors, color) },
    align ? { textAlign: align } : null,
    style,
  ];
  return <RNText style={resolved} {...rest} />;
}
