import { View, type ViewStyle } from 'react-native';

import { avatarColorForSeed, avatarInitial } from '@/lib/avatar';
import { useTheme } from '@/theme';

import { Text } from './Text';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const SIZE_PX: Record<Size, number> = { sm: 24, md: 40, lg: 56, xl: 72 };

export interface AvatarProps {
  displayName: string;
  seed?: string | null;
  size?: Size;
  online?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  displayName,
  seed,
  size = 'md',
  online,
  style,
}: AvatarProps) {
  const theme = useTheme();
  const px = SIZE_PX[size];
  const bg = avatarColorForSeed(seed ?? displayName);

  return (
    <View style={[{ width: px, height: px }, style]}>
      <View
        style={{
          width: px,
          height: px,
          borderRadius: px / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          variant={size === 'sm' ? 'body.sm' : size === 'xl' ? 'heading.lg' : 'heading.sm'}
          style={{ color: theme.palette.white }}
        >
          {avatarInitial(displayName)}
        </Text>
      </View>
      {online !== undefined ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: px / 4,
            height: px / 4,
            borderRadius: px / 8,
            backgroundColor: online
              ? theme.colors.intent.success
              : theme.colors.surface.strong,
            borderWidth: 2,
            borderColor: theme.colors.background.base,
          }}
        />
      ) : null}
    </View>
  );
}
