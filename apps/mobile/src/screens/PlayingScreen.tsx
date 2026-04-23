import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogOut } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, ConfirmationModal, Text, useToast } from '@/components';
import { CardPanel } from '@/components/CardPanel';
import { Roulette } from '@/components/Roulette';
import { TurnIndicator } from '@/components/TurnIndicator';
import { ApiException, api, type SpinOutcome } from '@/lib/api';
import { playSound, stopSound } from '@/lib/sounds';
import { storage } from '@/lib/storage';
import { useProfile } from '@/state/ProfileContext';
import { RoomProvider, useRoom } from '@/state/RoomContext';
import { useTheme } from '@/theme';
import type { PublicCard } from '@shared';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Playing'>;

export function PlayingScreen(props: Props) {
  const { userId } = useProfile();
  if (!userId) return null;
  return (
    <RoomProvider roomId={props.route.params.roomId} userId={userId}>
      <PlayingScreenInner {...props} />
    </RoomProvider>
  );
}

function PlayingScreenInner({ navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { userId } = useProfile();
  const { room, players, refresh, leave } = useRoom();
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [activeCard, setActiveCard] = useState<PublicCard | null>(null);
  const [pendingPenalty, setPendingPenalty] = useState<PublicCard | null>(null);
  const [busy, setBusy] = useState(false);

  // Track room lifecycle transitions
  useEffect(() => {
    if (!room) return;
    if (room.status === 'ended') {
      navigation.replace('SessionSummary', { roomId: room.id });
    }
    if (room.status === 'lobby') {
      navigation.replace('Lobby', { roomId: room.id });
    }
  }, [room?.status, room?.id, navigation]);

  const me = players.find((p) => p.userId === userId);
  const currentPlayer = useMemo(
    () => players.find((p) => p.id === room?.currentPlayerId) ?? null,
    [players, room?.currentPlayerId]
  );
  const isMyTurn = !!me && me.id === room?.currentPlayerId;

  const handleLeave = async () => {
    if (!room) return;
    try {
      await api.leaveRoom({ roomId: room.id });
    } catch {}
    await storage.clearActiveRoom();
    leave();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleDraw = async (cardType: 'truth' | 'dare') => {
    if (!room) return;
    setBusy(true);
    try {
      const res = await api.drawCard({ roomId: room.id, cardTypeFilter: cardType });
      setActiveCard(res.card);
      playSound('cardFlip');
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : 'Falhou';
      toast.show({ type: 'error', message: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (actionType: 'complete' | 'refuse' | 'skip') => {
    if (!room) return;
    setBusy(true);
    try {
      const res = await api.submitAction({ roomId: room.id, actionType });
      if (actionType === 'refuse' && res.penalty) {
        setPendingPenalty(res.penalty);
        setActiveCard(null);
      } else {
        setActiveCard(null);
        playSound('successChime');
        // submit_action records the action but does not advance the turn;
        // we always advance here unless a penalty kicks in.
        if (!res.turnAdvanced) {
          await api.advanceTurn({ roomId: room.id, reason: 'manual' });
        }
        refresh();
      }
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : 'Falhou';
      toast.show({ type: 'error', message: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleSpin = async () => {
    if (!room) return;
    setBusy(true);
    try {
      playSound('rouletteTick');
      const res = await api.spinRoulette({ roomId: room.id });
      // Wait for animation duration before resolving outcome.
      setTimeout(async () => {
        stopSound('rouletteTick');
        playSound('rouletteEnd');
        await handleSpinOutcome(res.outcome, res.resolvedCard);
        setBusy(false);
      }, res.durationMs);
    } catch (err) {
      stopSound('rouletteTick');
      setBusy(false);
      const msg = err instanceof ApiException ? err.message : 'Falhou';
      toast.show({ type: 'error', message: msg });
    }
  };

  const handleSpinOutcome = async (
    outcome: SpinOutcome,
    resolvedCard: PublicCard | null
  ) => {
    if (outcome.kind === 'card_type' && resolvedCard) {
      setActiveCard(resolvedCard);
      return;
    }
    if (outcome.kind === 'skip') {
      toast.show({ type: 'success', message: `${currentPlayer?.displayName ?? 'Você'} escapou!` });
      if (room) {
        await api.advanceTurn({ roomId: room.id, reason: 'manual' });
        refresh();
      }
      return;
    }
    if (outcome.kind === 'player_choice') {
      toast.show({ type: 'info', message: 'Escolha verdade ou desafio' });
    }
  };

  if (!room) {
    return (
      <ScreenContainer>
        <Text variant="body.lg" color="text.secondary" align="center">
          Carregando...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing[4],
        }}
      >
        <Text variant="caption" color="text.muted">
          Sala {room.code} · {players.length} jogador{players.length === 1 ? '' : 'es'}
        </Text>
        <Pressable hitSlop={12} onPress={() => setConfirmingLeave(true)}>
          <LogOut size={22} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      <TurnIndicator player={currentPlayer} isYou={isMyTurn} />

      <View style={{ flex: 1, marginVertical: theme.spacing[5], justifyContent: 'center' }}>
        {pendingPenalty ? (
          <PenaltyView
            card={pendingPenalty}
            onAccept={() => {
              setActiveCard(pendingPenalty);
              setPendingPenalty(null);
            }}
            onSkip={async () => {
              setPendingPenalty(null);
              if (room) {
                await api.advanceTurn({ roomId: room.id, reason: 'manual' });
                refresh();
              }
            }}
          />
        ) : activeCard ? (
          <CardView
            card={activeCard}
            isMyTurn={isMyTurn}
            busy={busy}
            onComplete={() => handleAction('complete')}
            onRefuse={() => handleAction('refuse')}
          />
        ) : room.mode === 'roulette' ? (
          <RouletteView
            spinning={busy}
            canSpin={isMyTurn}
            onSpin={handleSpin}
          />
        ) : (
          <TruthOrDareChoice
            isMyTurn={isMyTurn}
            currentPlayerName={currentPlayer?.displayName ?? '...'}
            busy={busy}
            onChoose={handleDraw}
          />
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
        {players.map((p) => (
          <Text
            key={p.id}
            variant="body.sm"
            color={p.id === room.currentPlayerId ? 'intent.primary' : 'text.muted'}
          >
            {p.displayName}
          </Text>
        ))}
      </View>

      <ConfirmationModal
        visible={confirmingLeave}
        title="Sair da sala?"
        description="O jogo continua sem você."
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

// ---- sub-views ---------------------------------------------------

function TruthOrDareChoice({
  isMyTurn,
  currentPlayerName,
  busy,
  onChoose,
}: {
  isMyTurn: boolean;
  currentPlayerName: string;
  busy: boolean;
  onChoose: (t: 'truth' | 'dare') => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <Button
        size="lg"
        disabled={!isMyTurn || busy}
        loading={busy}
        onPress={() => onChoose('truth')}
      >
        {isMyTurn ? 'Verdade' : `${currentPlayerName} está escolhendo...`}
      </Button>
      <Button
        size="lg"
        variant="secondary"
        disabled={!isMyTurn || busy}
        onPress={() => onChoose('dare')}
      >
        Desafio
      </Button>
    </View>
  );
}

function CardView({
  card,
  isMyTurn,
  busy,
  onComplete,
  onRefuse,
}: {
  card: PublicCard;
  isMyTurn: boolean;
  busy: boolean;
  onComplete: () => void;
  onRefuse: () => void;
}) {
  return (
    <View style={{ flex: 1, gap: 16 }}>
      <CardPanel card={card} />
      {isMyTurn ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button onPress={onComplete} loading={busy}>
              Feito
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" destructive onPress={onRefuse} disabled={busy}>
              Passei
            </Button>
          </View>
        </View>
      ) : (
        <Text variant="body.md" color="text.muted" align="center">
          Aguardando jogador completar...
        </Text>
      )}
    </View>
  );
}

function PenaltyView({
  card,
  onAccept,
  onSkip,
}: {
  card: PublicCard;
  onAccept: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={{ flex: 1, gap: 16 }}>
      <Text variant="caption" color="intent.danger">
        Penalidade
      </Text>
      <CardPanel card={card} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" onPress={onSkip}>
            Passei de novo
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button onPress={onAccept}>Aceitar</Button>
        </View>
      </View>
    </View>
  );
}

function RouletteView({
  spinning,
  canSpin,
  onSpin,
}: {
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 24 }}>
      <Roulette spinning={spinning} />
      <Button onPress={onSpin} disabled={!canSpin || spinning} loading={spinning}>
        {canSpin ? 'Girar' : 'Aguardando jogador'}
      </Button>
    </View>
  );
}
