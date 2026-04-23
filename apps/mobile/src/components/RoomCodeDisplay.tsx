import * as Clipboard from 'expo-clipboard';
import { Copy, Share2 } from 'lucide-react-native';
import { Pressable, Share, View } from 'react-native';

import { useToast } from './Toast';
import { Text } from './Text';
import { useTheme } from '@/theme';

export interface RoomCodeDisplayProps {
  code: string;
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const theme = useTheme();
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      toast.show({ type: 'success', message: `Código ${code} copiado` });
    } catch {
      toast.show({ type: 'error', message: 'Não deu para copiar' });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Entre na minha sala no Spicy: ${code}` });
    } catch {}
  };

  return (
    <View
      style={{
        gap: theme.spacing[3],
        padding: theme.spacing[5],
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.strong,
        backgroundColor: theme.colors.background.raised,
        alignItems: 'center',
      }}
    >
      <Text variant="caption" color="text.muted">
        Código da sala
      </Text>
      <Pressable onPress={handleCopy} hitSlop={12}>
        <Text
          variant="display.xl"
          style={{
            letterSpacing: 8,
            fontVariant: ['tabular-nums'],
          }}
          color="text.primary"
        >
          {code}
        </Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: theme.spacing[5] }}>
        <Pressable
          hitSlop={12}
          onPress={handleCopy}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}
        >
          <Copy size={16} color={theme.colors.text.secondary} />
          <Text variant="body.md" color="text.secondary">
            Copiar
          </Text>
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={handleShare}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}
        >
          <Share2 size={16} color={theme.colors.text.secondary} />
          <Text variant="body.md" color="text.secondary">
            Compartilhar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
