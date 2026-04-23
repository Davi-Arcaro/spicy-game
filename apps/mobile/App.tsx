import { useCallback, useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components';
import { fontsToLoad } from '@/lib/fonts';
import { preloadSounds } from '@/lib/sounds';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ProfileProvider } from '@/state/ProfileContext';
import { ThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontsError] = useFonts(fontsToLoad);
  const [soundsReady, setSoundsReady] = useState(false);

  useEffect(() => {
    preloadSounds().finally(() => setSoundsReady(true));
  }, []);

  const ready = (fontsLoaded || !!fontsError) && soundsReady;

  const onLayoutReady = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <ProfileProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </ProfileProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
