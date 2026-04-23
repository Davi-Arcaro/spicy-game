import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

interface Summary {
  rounds: number;
  players: string[];
  reason: string;
}

export function SessionSummaryScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const load = async () => {
      const [historyRes, playersRes] = await Promise.all([
        supabase
          .from('room_card_history')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', route.params.roomId),
        supabase
          .from('room_players')
          .select('display_name')
          .eq('room_id', route.params.roomId),
      ]);
      setSummary({
        rounds: historyRes.count ?? 0,
        players: (playersRes.data ?? []).map((p) => p.display_name),
        reason: 'A sala foi encerrada',
      });
    };
    load().catch(() => {
      setSummary({ rounds: 0, players: [], reason: 'A sala foi encerrada' });
    });
    storage.clearActiveRoom();
  }, [route.params.roomId]);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing[5] }}>
        <Text variant="display.lg" color="intent.primary" align="center">
          Boa partida!
        </Text>
        {summary ? (
          <View style={{ gap: theme.spacing[3] }}>
            <Text variant="body.lg" color="text.secondary" align="center">
              {summary.rounds} rodada{summary.rounds === 1 ? '' : 's'} jogadas
            </Text>
            {summary.players.length > 0 ? (
              <Text variant="body.md" color="text.muted" align="center">
                Com: {summary.players.join(', ')}
              </Text>
            ) : null}
            <Text variant="body.sm" color="text.muted" align="center">
              {summary.reason}
            </Text>
          </View>
        ) : null}

        <Button
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          Voltar
        </Button>
      </View>
    </ScreenContainer>
  );
}
