import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  ProfileSetup: { fromSettings?: boolean } | undefined;
  Home: undefined;
  CreateRoom: undefined;
  JoinRoom: undefined;
  Lobby: { roomId: string };
  Playing: { roomId: string };
  SessionSummary: { roomId: string };
  Settings: undefined;
  About: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Force the import to be retained
export type _Force = NavigatorScreenParams<RootStackParamList>;
