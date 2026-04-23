import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogOut, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, ConfirmationModal, Text, useToast } from '@/components';
import { PlayerChip } from '@/components/PlayerChip';
import { RoomCodeDisplay } from '@/components/RoomCodeDisplay';
import { ApiException, api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useProfile } from '@/state/ProfileContext';
import { RoomProvider, useRoom } from '@/state/RoomContext';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

export function LobbyScreen(props: Props) {
  const { userId } = useProfile();
  if (!userId) return null;
  return (
    <RoomProvider roomId={props.route.params.roomId} userId={userId}>
      <LobbyScreenInner {...props} />
    </RoomProvider>
  );
}

function LobbyScreenInner({ navigation, route }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { userId } = useProfile();
  const { room, players, presence, loading, error, leave } = useRoom();

  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [starting, setStarting] = useState(false);

  // Auto-transition when host starts game
  useEffect(() => {
    if (room?.status === 'playing') {
      navigation.replace('Playing', { roomId: room.id });
    }
    if (room?.status === 'ended') {
      navigation.replace('SessionSummary', { roomId: room.id });
    }
  }, [room?.status, room?.id, navigation]);

  const me = players.find((p) => p.userId === userId);
  const isHost = !!me?.isHost;

  const handleStart = async () => {
    if (!room) return;
    setStarting(true);
    try {
      await api.startGame({ roomId: room.id });
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : 'Falhou';
      toast.show({ type: 'error', message: msg });
    } finally {
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    if (!room) return;
    try {
      await api.leaveRoom({ roomId: room.id });
    } catch {}
    await storage.clearActiveRoom();
    leave();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text variant="body.lg" color="text.secondary" align="center">
            Carregando sala...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !room) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing[4] }}>
          <Text variant="heading.md" align="center">
            Não foi possível carregar a sala
          </Text>
          <Button onPress={() => navigation.replace('Home')}>Voltar à Home</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing[5],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
          <Users size={20} color={theme.colors.text.secondary} />
          <Text variant="heading.sm" color="text.secondary">
            {players.length} jogador{players.length === 1 ? '' : 'es'}
          </Text>
        </View>
        <Pressable hitSlop={12} onPress={() => setConfirmingLeave(true)}>
          <LogOut size={22} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      <RoomCodeDisplay code={room.code} />

      <Text
        variant="caption"
        color="text.muted"
        style={{ marginTop: theme.spacing[5], marginBottom: theme.spacing[2] }}
      >
        Jogadores
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: theme.spacing[2] }}>
        {players.length <= 1 ? (
          <View style={{ alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[6] }}>
            <Users size={48} color={theme.colors.text.muted} />
            <Text variant="body.lg" color="text.secondary" align="center">
              Compartilhe o código acima{'\n'}para começar
            </Text>
          </View>
        ) : (
          players.map((p) => (
            <PlayerChip
              key={p.id}
              player={p}
              isOnline={presence[p.userId] ?? false}
              isCurrent={p.userId === userId}
            />
          ))
        )}
      </ScrollView>

      {isHost ? (
        <Button
          onPress={handleStart}
          loading={starting}
          disabled={players.length < 2}
          style={{ marginTop: theme.spacing[4] }}
        >
          {players.length >= 2
            ? `Começar (${players.length} jogadores)`
            : 'Aguardando mais 1 jogador'}
        </Button>
      ) : (
        <Text
          variant="body.md"
          color="text.muted"
          align="center"
          style={{ marginTop: theme.spacing[4] }}
        >
          Aguardando host começar
        </Text>
      )}

      <ConfirmationModal
        visible={confirmingLeave}
        title="Sair da sala?"
        description="Você pode entrar de novo com o código."
        confirmLabel="Sair"
        destructive
        onCancel={() => setConfirmingLeave(false)}
        onConfirm={() => {
          setConfirmingLeave(false);
          handleLeave();
        }}
      />
    </ScreenContainer>
  );
}
