import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Chip } from './Chip';
import { Text } from './Text';
import { useTheme } from '@/theme';
import type { PublicCard } from '@shared';

export interface CardPanelProps {
  card: PublicCard;
}

export function CardPanel({ card }: CardPanelProps) {
  const theme = useTheme();
  const remaining = useCountdown(card.durationSec);

  const typeLabel = (() => {
    switch (card.type) {
      case 'truth':
        return 'Verdade';
      case 'dare':
        return 'Desafio';
      case 'never_have_i':
        return 'Eu nunca';
      case 'vote':
        return 'Votação';
      default:
        return 'Carta';
    }
  })();

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.card.background,
          borderRadius: theme.radii.lg,
          borderColor: theme.colors.card.border,
          borderWidth: 1,
          padding: theme.spacing[6],
          gap: theme.spacing[5],
          overflow: 'hidden',
        },
        theme.shadows.lg,
      ]}
    >
      {/* Left accent stripe */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: theme.colors.card.accent,
        }}
      />

      <Text variant="caption" color="card.accent">
        {typeLabel}
      </Text>

      {card.requiresProps.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], flexWrap: 'wrap' }}>
          {card.requiresProps.map((p) => (
            <Chip key={p} variant="warning">
              Requer: {p}
            </Chip>
          ))}
        </View>
      ) : null}

      <Text
        variant="display.lg"
        color="text.primary"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        maxFontSizeMultiplier={1.3}
      >
        {card.prompt}
      </Text>

      {card.secondaryText ? (
        <Text variant="body.lg" color="text.secondary">
          {card.secondaryText}
        </Text>
      ) : null}

      {remaining !== null ? (
        <View style={{ alignItems: 'center', marginTop: 'auto' }}>
          <Text
            variant="display.md"
            style={{
              color:
                remaining <= 5
                  ? theme.colors.intent.danger
                  : remaining <= 10
                  ? theme.colors.intent.warning
                  : theme.colors.text.secondary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatTime(remaining)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function useCountdown(durationSec: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(durationSec);

  useEffect(() => {
    if (durationSec === null) {
      setRemaining(null);
      return;
    }
    setRemaining(durationSec);
    const id = setInterval(() => {
      setRemaining((r) => (r === null || r <= 0 ? r : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [durationSec]);

  return remaining;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}
