import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type ChipVariant = 'neutral' | 'primary' | 'accent' | 'warning' | 'danger';

export interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  icon?: ReactNode;
  style?: ViewStyle;
}

export function Chip({ children, variant = 'neutral', icon, style }: ChipProps) {
  const theme = useTheme();
  const bg = (() => {
    switch (variant) {
      case 'primary':
        return theme.colors.intent.primaryMuted;
      case 'accent':
        return theme.colors.intent.accentMuted;
      case 'warning':
        return theme.colors.intent.warningMuted;
      case 'danger':
        return theme.colors.intent.dangerMuted;
      default:
        return theme.colors.surface.muted;
    }
  })();

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[1],
          borderRadius: theme.radii.full,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[1],
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon}
      {typeof children === 'string' ? (
        <Text variant="body.sm" color="text.primary">
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
