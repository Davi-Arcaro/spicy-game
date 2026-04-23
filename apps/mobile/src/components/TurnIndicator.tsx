import { View } from 'react-native';

import { Avatar } from './Avatar';
import { Text } from './Text';
import { useTheme } from '@/theme';
import type { PublicPlayer } from '@shared';

export interface TurnIndicatorProps {
  player: PublicPlayer | null;
  isYou: boolean;
}

export function TurnIndicator({ player, isYou }: TurnIndicatorProps) {
  const theme = useTheme();
  if (!player) {
    return (
      <Text variant="heading.md" color="text.muted">
        Aguardando próximo jogador...
      </Text>
    );
  }
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[4],
        borderRadius: theme.radii.lg,
        backgroundColor: isYou
          ? theme.colors.intent.primaryMuted
          : theme.colors.surface.muted,
      }}
    >
      <Avatar size="md" displayName={player.displayName} seed={player.avatarSeed} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="text.muted">
          Vez de
        </Text>
        <Text variant="heading.md" color="text.primary">
          {isYou ? `Você (${player.displayName})` : player.displayName}
        </Text>
      </View>
    </View>
  );
}
