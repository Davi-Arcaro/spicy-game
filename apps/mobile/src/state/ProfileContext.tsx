import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { generateAvatarSeed } from '@/lib/avatar';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';
import { storage, type LocalProfile } from '@/lib/storage';
import { api } from '@/lib/api';

interface ProfileState {
  profile: LocalProfile | null;
  userId: string | null;
  ready: boolean;
}

interface ProfileApi extends ProfileState {
  saveProfile: (input: { displayName: string; isAdult?: boolean }) => Promise<void>;
  updateAdult: (isAdult: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const ProfileContext = createContext<ProfileApi | null>(null);

function defaultName(): string {
  const n = Math.floor(Math.random() * 900) + 100;
  return `Jogador${n}`;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    userId: null,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = await ensureAnonymousSession();
        const local = await storage.getProfile();
        if (!cancelled) {
          setState({ profile: local, userId, ready: true });
        }
      } catch (err) {
        console.warn('[profile] bootstrap failed', err);
        if (!cancelled) setState((s) => ({ ...s, ready: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = useCallback(
    async ({ displayName, isAdult }: { displayName: string; isAdult?: boolean }) => {
      const trimmed = displayName.trim() || defaultName();
      const next: LocalProfile = {
        displayName: trimmed,
        avatarSeed: state.profile?.avatarSeed ?? generateAvatarSeed(),
        isAdult: isAdult ?? state.profile?.isAdult ?? false,
      };
      await storage.setProfile(next);
      try {
        await api.updateProfile({
          displayName: next.displayName,
          avatarSeed: next.avatarSeed ?? undefined,
          isAdult: next.isAdult,
          locale: 'pt-BR',
        });
      } catch (err) {
        // Server profile sync is best-effort; local save is what unblocks the UI.
        console.warn('[profile] server sync failed', err);
      }
      setState((s) => ({ ...s, profile: next }));
    },
    [state.profile]
  );

  const updateAdult = useCallback(
    async (isAdult: boolean) => {
      if (!state.profile) return;
      await saveProfile({ displayName: state.profile.displayName, isAdult });
    },
    [state.profile, saveProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await storage.clearProfile();
    await storage.clearActiveRoom();
    setState({ profile: null, userId: null, ready: true });
  }, []);

  const value = useMemo<ProfileApi>(
    () => ({ ...state, saveProfile, updateAdult, signOut }),
    [state, saveProfile, updateAdult, signOut]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileApi {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
