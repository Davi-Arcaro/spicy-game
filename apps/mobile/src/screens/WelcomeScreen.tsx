import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Text, useToast } from '@/components';
import { useProfile } from '@/state/ProfileContext';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { ready, userId } = useProfile();
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    setBusy(true);
    try {
      // anon session was already created by ProfileProvider on bootstrap
      if (!userId) {
        toast.show({ type: 'error', message: 'Não foi possível iniciar. Verifique conexão.' });
        return;
      }
      navigation.replace('ProfileSetup');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing[6] }}>
        <View style={{ gap: theme.spacing[3] }}>
          <Text variant="display.xl" color="intent.primary">
            Spicy
          </Text>
          <Text variant="body.lg" color="text.secondary">
            Verdade, desafio e o que der.
          </Text>
        </View>

        <Button onPress={handleStart} loading={busy || !ready}>
          Começar
        </Button>
      </View>
    </ScreenContainer>
  );
}
