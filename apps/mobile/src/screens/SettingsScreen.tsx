import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { Button, Card, ConfirmationModal, Text } from '@/components';
import { storage, type Preferences } from '@/lib/storage';
import { useProfile } from '@/state/ProfileContext';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { profile, updateAdult, signOut } = useProfile();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  useEffect(() => {
    storage.getPreferences().then(setPrefs);
  }, []);

  const updatePrefs = (next: Preferences) => {
    setPrefs(next);
    storage.setPreferences(next);
  };

  return (
    <ScreenContainer scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[5] }}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text variant="heading.lg">Configurações</Text>
      </View>

      <Section title="Perfil">
        <Row
          label={profile?.displayName ?? 'Sem nome'}
          rightLabel="Editar"
          onPress={() => navigation.navigate('ProfileSetup', { fromSettings: true })}
        />
      </Section>

      <Section title="Áudio">
        <Row
          label="Som da roleta e cartas"
          right={
            <Switch
              value={prefs?.soundEnabled ?? true}
              onValueChange={(v) =>
                updatePrefs({
                  soundEnabled: v,
                  hapticsEnabled: prefs?.hapticsEnabled ?? false,
                })
              }
            />
          }
        />
      </Section>

      <Section title="Maioridade">
        <Row
          label="Sou maior de 18"
          right={
            <Switch
              value={profile?.isAdult ?? false}
              onValueChange={(v) => updateAdult(v)}
            />
          }
        />
      </Section>

      <Section title="Sobre">
        <Row label="Sobre o app" rightLabel=">" onPress={() => navigation.navigate('About')} />
      </Section>

      <View style={{ marginTop: theme.spacing[6] }}>
        <Button variant="ghost" destructive onPress={() => setConfirmingSignOut(true)}>
          Sair do app
        </Button>
      </View>

      <ConfirmationModal
        visible={confirmingSignOut}
        title="Sair do app?"
        description="Você precisará configurar o perfil de novo."
        confirmLabel="Sair"
        destructive
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={async () => {
          setConfirmingSignOut(false);
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        }}
      />
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing[5] }}>
      <Text
        variant="caption"
        color="text.muted"
        style={{ marginBottom: theme.spacing[2] }}
      >
        {title}
      </Text>
      <Card elevation="sm" padding={2}>
        {children}
      </Card>
    </View>
  );
}

function Row({
  label,
  right,
  rightLabel,
  onPress,
}: {
  label: string;
  right?: React.ReactNode;
  rightLabel?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing[3],
        paddingHorizontal: theme.spacing[3],
      }}
    >
      <Text variant="body.lg" color="text.primary">
        {label}
      </Text>
      {right ? (
        right
      ) : rightLabel ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text variant="body.md" color="text.secondary">
            {rightLabel}
          </Text>
          <ChevronRight size={18} color={theme.colors.text.muted} />
        </View>
      ) : null}
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
