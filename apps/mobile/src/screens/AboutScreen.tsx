import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';
import Constants from 'expo-constants';

import { Text } from '@/components';
import { useTheme } from '@/theme';

import { ScreenContainer } from './ScreenContainer';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  const theme = useTheme();
  const version = Constants.expoConfig?.version ?? '0.0.0';

  return (
    <ScreenContainer scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[5] }}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text variant="heading.lg">Sobre</Text>
      </View>

      <View style={{ gap: theme.spacing[4] }}>
        <Text variant="display.md" color="intent.primary">
          Spicy
        </Text>
        <Text variant="body.md" color="text.secondary">
          Versão {version}
        </Text>

        <Text variant="body.lg">
          Um party game de verdade ou desafio para amigos, casais e quem quiser
          mexer com a noite.
        </Text>

        <View style={{ gap: theme.spacing[2], marginTop: theme.spacing[5] }}>
          <Text variant="caption" color="text.muted">
            Créditos
          </Text>
          <Text variant="body.md" color="text.secondary">
            Inter — Rasmus Andersson (SIL OFL){'\n'}
            Fraunces — Phaedra Charles, Flavia Zimbardi, David Jonathan Ross (SIL OFL){'\n'}
            Lucide — Eric Mckervey Garmon e contribuidores (ISC)
          </Text>
        </View>

        <Pressable onPress={() => Linking.openURL('mailto:feedback@spicygame.app')}>
          <Text variant="button.md" color="intent.primary">
            Mandar feedback
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
