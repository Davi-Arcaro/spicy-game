import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text, useToast } from '@/components';
import { AdultGateModal } from '@/components/modals/AdultGateModal';
import { ApiException, api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useProfile } from '@/state/ProfileContext';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinRoom'>;

export function JoinRoomScreen({ navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { profile, updateAdult } = useProfile();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adultGate, setAdultGate] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const submit = async (rawCode: string, isAdultOverride?: boolean) => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.joinRoom({
        code: rawCode,
        displayName: profile.displayName,
        avatarSeed: profile.avatarSeed ?? undefined,
        isAdult: isAdultOverride ?? profile.isAdult,
        idempotencyKey: cryptoUuid(),
      });
      await storage.setActiveRoom({
        roomId: result.room.id,
        code: result.room.code,
        joinedAt: new Date().toISOString(),
      });
      const target = result.room.status === 'playing' ? 'Playing' : 'Lobby';
      navigation.replace(target, { roomId: result.room.id });
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.code === 'ADULT_GATE_REQUIRED') {
          setAdultGate(true);
          return;
        }
        if (err.code === 'ROOM_NOT_FOUND') setError('Sala não encontrada');
        else if (err.code === 'ROOM_FULL') setError('Sala cheia');
        else setError(err.message);
      } else {
        setError('Não deu para entrar. Tente de novo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
    setCode(cleaned);
    setError(null);
    if (cleaned.length === 4) {
      submit(cleaned);
    }
  };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[7] }}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text variant="heading.lg">Entrar em sala</Text>
      </View>

      <View style={{ alignItems: 'center', gap: theme.spacing[5] }}>
        <Text variant="body.lg" color="text.secondary">
          Digite o código de 4 letras
        </Text>

        <Pressable onPress={() => inputRef.current?.focus()}>
          <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
            {[0, 1, 2, 3].map((i) => {
              const ch = code[i] ?? '';
              const filled = !!ch;
              return (
                <View
                  key={i}
                  style={{
                    width: 56,
                    height: 64,
                    borderRadius: theme.radii.md,
                    borderWidth: 2,
                    borderColor: error
                      ? theme.colors.intent.danger
                      : filled
                      ? theme.colors.intent.primary
                      : theme.colors.border.strong,
                    backgroundColor: theme.colors.background.raised,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="display.md" color="text.primary">
                    {ch}
                  </Text>
                </View>
              );
            })}
          </View>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={4}
            editable={!loading}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </Pressable>

        {error ? (
          <Text variant="body.md" color="intent.danger">
            {error}
          </Text>
        ) : null}

        {loading ? (
          <Text variant="body.md" color="text.muted">
            Procurando sala...
          </Text>
        ) : null}
      </View>

      <AdultGateModal
        visible={adultGate}
        onCancel={() => setAdultGate(false)}
        onConfirm={async () => {
          setAdultGate(false);
          await updateAdult(true);
          submit(code, true);
        }}
      />
    </ScreenContainer>
  );
}

function cryptoUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
