import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({ children, scroll = false, padded = true, contentStyle }: Props) {
  const theme = useTheme();
  const padding: ViewStyle = padded
    ? { padding: theme.spacing[6] }
    : {};

  const inner = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ flexGrow: 1, ...padding }, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, ...padding }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.base }}
      edges={['top', 'bottom']}
    >
      {inner}
    </SafeAreaView>
  );
}
