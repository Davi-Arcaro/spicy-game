import { Lock } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { PublicDeck } from '@shared';

import { Text } from './Text';
import { useTheme } from '@/theme';

export interface DeckToggleProps {
  deck: PublicDeck;
  selected: boolean;
  locked?: boolean;
  onToggle: (next: boolean) => void;
}

export function DeckToggle({ deck, selected, locked, onToggle }: DeckToggleProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onToggle(!selected)}
      disabled={locked && !selected}
      style={{
        padding: theme.spacing[4],
        borderRadius: theme.radii.md,
        backgroundColor: selected
          ? theme.colors.intent.primaryMuted
          : theme.colors.surface.default,
        borderWidth: 1,
        borderColor: selected
          ? theme.colors.intent.primary
          : theme.colors.border.default,
        opacity: locked && !selected ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
        <Text variant="heading.sm" style={{ flex: 1 }}>
          {deck.name}
        </Text>
        {locked ? <Lock size={16} color={theme.colors.text.muted} /> : null}
      </View>
      {deck.description ? (
        <Text variant="body.md" color="text.secondary" style={{ marginTop: theme.spacing[1] }}>
          {deck.description}
        </Text>
      ) : null}
    </Pressable>
  );
}
