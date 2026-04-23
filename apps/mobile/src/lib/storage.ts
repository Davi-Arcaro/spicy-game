// Thin wrapper over AsyncStorage with typed keys + JSON encoding.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  profile: 'spicy.profile',
  activeRoom: 'spicy.activeRoom',
  preferences: 'spicy.preferences',
} as const;

export interface LocalProfile {
  displayName: string;
  avatarSeed: string | null;
  isAdult: boolean;
}

export interface ActiveRoomMarker {
  roomId: string;
  code: string;
  joinedAt: string;
}

export interface Preferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getProfile: () => readJSON<LocalProfile>(KEYS.profile),
  setProfile: (p: LocalProfile) => writeJSON(KEYS.profile, p),
  clearProfile: () => AsyncStorage.removeItem(KEYS.profile),

  getActiveRoom: () => readJSON<ActiveRoomMarker>(KEYS.activeRoom),
  setActiveRoom: (m: ActiveRoomMarker) => writeJSON(KEYS.activeRoom, m),
  clearActiveRoom: () => AsyncStorage.removeItem(KEYS.activeRoom),

  getPreferences: async (): Promise<Preferences> =>
    (await readJSON<Preferences>(KEYS.preferences)) ?? {
      soundEnabled: true,
      hapticsEnabled: false,
    },
  setPreferences: (p: Preferences) => writeJSON(KEYS.preferences, p),
};
