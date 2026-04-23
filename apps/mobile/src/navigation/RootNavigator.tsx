import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { useProfile } from '@/state/ProfileContext';
import { useTheme } from '@/theme';

import { AboutScreen } from '@/screens/AboutScreen';
import { CreateRoomScreen } from '@/screens/CreateRoomScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { JoinRoomScreen } from '@/screens/JoinRoomScreen';
import { LobbyScreen } from '@/screens/LobbyScreen';
import { PlayingScreen } from '@/screens/PlayingScreen';
import { ProfileSetupScreen } from '@/screens/ProfileSetupScreen';
import { SessionSummaryScreen } from '@/screens/SessionSummaryScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { profile, ready } = useProfile();
  const theme = useTheme();

  const navTheme = useMemo(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.colors.background.base,
        card: theme.colors.background.raised,
        primary: theme.colors.intent.primary,
        text: theme.colors.text.primary,
        border: theme.colors.border.muted,
      },
    };
  }, [theme]);

  if (!ready) return null;

  const initialRoute: keyof RootStackParamList = profile ? 'Home' : 'Welcome';

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background.base },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
        <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="Playing" component={PlayingScreen} />
        <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
