import { View } from 'react-native';

import { Avatar } from './Avatar';
import { Text } from './Text';
import { useTheme } from '@/theme';
import type { PublicPlayer } from '@shared';

export interface PlayerChipProps {
  player: PublicPlayer;
  isOnline?: boolean;
  isCurrent?: boolean;
}

export function PlayerChip({ player, isOnline, isCurrent }: PlayerChipProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radii.full,
        backgroundColor: isCurrent
          ? theme.colors.intent.primaryMuted
          : theme.colors.surface.default,
        borderWidth: isCurrent ? 1 : 0,
        borderColor: theme.colors.intent.primary,
      }}
    >
      <Avatar
        size="sm"
        displayName={player.displayName}
        seed={player.avatarSeed}
        online={isOnline}
      />
      <Text variant="body.md" color="text.primary">
        {player.displayName}
        {player.isHost ? ' ★' : ''}
      </Text>
    </View>
  );
}
