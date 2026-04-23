import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Text, useToast } from '@/components';
import { DeckToggle } from '@/components/DeckToggle';
import { IntensitySlider } from '@/components/IntensitySlider';
import { AdultGateModal } from '@/components/modals/AdultGateModal';
import { ApiException, api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useProfile } from '@/state/ProfileContext';
import { useTheme } from '@/theme';
import type { GameMode, IntensityLevel, PublicDeck, SpinType } from '@shared';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>;

const MODES: Array<{ value: GameMode; label: string; description: string }> = [
  { value: 'truth_dare', label: 'Verdade ou Desafio', description: 'Cada jogador escolhe' },
  { value: 'roulette', label: 'Roleta', description: 'A roleta decide' },
];

export function CreateRoomScreen({ navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { profile, updateAdult } = useProfile();

  const [mode, setMode] = useState<GameMode>('truth_dare');
  const [intensity, setIntensity] = useState<IntensityLevel>('medium');
  const [decks, setDecks] = useState<PublicDeck[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(['leve']);
  const [spinType, setSpinType] = useState<SpinType>('mode_spin');
  const [creating, setCreating] = useState(false);
  const [adultGate, setAdultGate] = useState<{ pendingDeck: string } | null>(null);

  useEffect(() => {
    api.listDecks().then(setDecks).catch(() => {
      toast.show({ type: 'error', message: 'Não deu para carregar decks' });
    });
  }, [toast]);

  const canCreate = selectedSlugs.length > 0 && !creating;

  const toggleDeck = (deck: PublicDeck, next: boolean) => {
    if (next && deck.requiresAdult && !profile?.isAdult) {
      setAdultGate({ pendingDeck: deck.slug });
      return;
    }
    setSelectedSlugs((curr) =>
      next ? [...new Set([...curr, deck.slug])] : curr.filter((s) => s !== deck.slug)
    );
  };

  const handleCreate = async () => {
    if (!profile) return;
    setCreating(true);
    try {
      const result = await api.createRoom({
        displayName: profile.displayName,
        mode,
        intensityMax: intensity,
        allowedDecks: selectedSlugs,
        spinType: mode === 'roulette' ? spinType : undefined,
        isAdult: profile.isAdult,
        idempotencyKey: cryptoUuid(),
      });
      await storage.setActiveRoom({
        roomId: result.room.id,
        code: result.room.code,
        joinedAt: new Date().toISOString(),
      });
      navigation.replace('Lobby', { roomId: result.room.id });
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : 'Falhou';
      toast.show({ type: 'error', message: `Não deu para criar: ${msg}` });
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[5] }}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text variant="heading.lg">Criar sala</Text>
      </View>

      <View style={{ gap: theme.spacing[5] }}>
        <Section title="Modo">
          <View style={{ gap: theme.spacing[2] }}>
            {MODES.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => setMode(m.value)}
                style={{
                  padding: theme.spacing[4],
                  borderRadius: theme.radii.md,
                  backgroundColor:
                    mode === m.value
                      ? theme.colors.intent.primaryMuted
                      : theme.colors.surface.default,
                  borderWidth: 1,
                  borderColor:
                    mode === m.value
                      ? theme.colors.intent.primary
                      : theme.colors.border.default,
                }}
              >
                <Text variant="heading.sm">{m.label}</Text>
                <Text variant="body.md" color="text.secondary">
                  {m.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {mode === 'roulette' ? (
          <Section title="Tipo de roleta">
            <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
              {(['mode_spin', 'player_spin'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSpinType(s)}
                  style={{
                    flex: 1,
                    padding: theme.spacing[3],
                    borderRadius: theme.radii.md,
                    backgroundColor:
                      spinType === s
                        ? theme.colors.intent.accentMuted
                        : theme.colors.surface.default,
                    borderWidth: 1,
                    borderColor:
                      spinType === s
                        ? theme.colors.intent.accent
                        : theme.colors.border.default,
                    alignItems: 'center',
                  }}
                >
                  <Text variant="button.md">
                    {s === 'mode_spin' ? 'Verdade/Desafio/Pular' : 'Sorteia jogador'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Intensidade máxima">
          <IntensitySlider value={intensity} onChange={setIntensity} />
        </Section>

        <Section title="Decks">
          <View style={{ gap: theme.spacing[2] }}>
            {decks.map((deck) => (
              <DeckToggle
                key={deck.id}
                deck={deck}
                selected={selectedSlugs.includes(deck.slug)}
                locked={deck.requiresAdult && !profile?.isAdult}
                onToggle={(next) => toggleDeck(deck, next)}
              />
            ))}
          </View>
        </Section>

        <Button onPress={handleCreate} loading={creating} disabled={!canCreate}>
          Criar sala
        </Button>
      </View>

      <AdultGateModal
        visible={!!adultGate}
        onCancel={() => setAdultGate(null)}
        onConfirm={async () => {
          await updateAdult(true);
          if (adultGate) {
            setSelectedSlugs((curr) => [...new Set([...curr, adultGate.pendingDeck])]);
          }
          setAdultGate(null);
        }}
      />
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[2] }}>
      <Text variant="caption" color="text.muted">
        {title}
      </Text>
      {children}
    </View>
  );
}

// Lightweight UUID v4 (good enough for idempotency keys; not for crypto).
function cryptoUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
