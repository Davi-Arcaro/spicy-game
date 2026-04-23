import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Input, Text, useToast } from '@/components';
import { useProfile } from '@/state/ProfileContext';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { profile, saveProfile } = useProfile();
  const fromSettings = route.params?.fromSettings ?? false;

  const [name, setName] = useState(profile?.displayName ?? '');
  const [isAdult, setIsAdult] = useState(profile?.isAdult ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 32) {
      setError('Nome precisa ter entre 1 e 32 caracteres');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveProfile({ displayName: trimmed, isAdult });
      if (fromSettings) navigation.goBack();
      else navigation.replace('Home');
    } catch (err) {
      toast.show({ type: 'error', message: 'Não deu para salvar. Tente de novo.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <View style={{ flex: 1, gap: theme.spacing[5], justifyContent: 'center' }}>
        <View style={{ gap: theme.spacing[2] }}>
          <Text variant="heading.lg">Como quer ser chamado?</Text>
          <Text variant="body.md" color="text.secondary">
            Esse é o nome que aparece para todo mundo na sala.
          </Text>
        </View>

        <Input
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          maxLength={32}
          autoFocus
          autoCorrect={false}
          autoCapitalize="words"
          error={error ?? undefined}
        />

        <AdultToggle value={isAdult} onChange={setIsAdult} />

        <Button onPress={handleSave} loading={saving}>
          Salvar
        </Button>

        {fromSettings ? (
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            Cancelar
          </Button>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function AdultToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: theme.radii.sm,
          borderWidth: 2,
          borderColor: value
            ? theme.colors.intent.primary
            : theme.colors.border.strong,
          backgroundColor: value
            ? theme.colors.intent.primary
            : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value ? (
          <Text variant="body.sm" style={{ color: theme.colors.text.onPrimary }}>
            ✓
          </Text>
        ) : null}
      </View>
      <Text variant="body.lg" color="text.primary">
        Sou maior de 18 anos
      </Text>
    </Pressable>
  );
}
