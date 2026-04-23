import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Text, useToast } from '@/components';
import { storage, type ActiveRoomMarker } from '@/lib/storage';
import { useProfile } from '@/state/ProfileContext';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { profile } = useProfile();
  const [activeRoom, setActiveRoom] = useState<ActiveRoomMarker | null>(null);

  useEffect(() => {
    storage.getActiveRoom().then(setActiveRoom);
    const unsub = navigation.addListener('focus', () => {
      storage.getActiveRoom().then(setActiveRoom);
    });
    return unsub;
  }, [navigation]);

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="heading.md" color="text.primary">
          E aí, {profile?.displayName ?? 'jogador'}
        </Text>
        <Pressable
          hitSlop={12}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Configurações"
        >
          <SettingsIcon size={24} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing[5] }}>
        {activeRoom ? (
          <Card elevation="md" padding={5} style={{ gap: theme.spacing[3] }}>
            <Text variant="heading.sm">Você está na sala {activeRoom.code}</Text>
            <Text variant="body.md" color="text.secondary">
              Quer voltar?
            </Text>
            <Button
              variant="primary"
              size="md"
              onPress={() => navigation.navigate('Lobby', { roomId: activeRoom.roomId })}
            >
              Voltar à sala
            </Button>
          </Card>
        ) : null}

        <View style={{ gap: theme.spacing[3] }}>
          <Button onPress={() => navigation.navigate('CreateRoom')}>Criar sala</Button>
          <Button variant="secondary" onPress={() => navigation.navigate('JoinRoom')}>
            Entrar em sala
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}
