import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { ShadowKey, SpacingKey } from '@/theme';

export interface CardProps {
  children: ReactNode;
  elevation?: ShadowKey;
  padding?: SpacingKey;
  style?: ViewStyle;
}

export function Card({ children, elevation = 'md', padding = 5, style }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.card.border,
          borderWidth: 1,
          borderRadius: theme.radii.lg,
          padding: theme.spacing[padding],
        },
        theme.shadows[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}
