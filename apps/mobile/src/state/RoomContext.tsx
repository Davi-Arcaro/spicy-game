import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import type { PublicPlayer, PublicRoom } from '@shared';

interface RoomState {
  room: PublicRoom | null;
  players: PublicPlayer[];
  presence: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

interface RoomApi extends RoomState {
  setSnapshot: (next: { room: PublicRoom; players?: PublicPlayer[] }) => void;
  refresh: () => Promise<void>;
  leave: () => void;
}

const RoomContext = createContext<RoomApi | null>(null);

interface ProviderProps {
  roomId: string;
  userId: string;
  children: ReactNode;
}

// Maps DB row -> PublicRoom shape (camelCase). The edge functions normalize
// for their own returns, but realtime postgres_changes hands us the raw row.
function rowToPublicRoom(row: any, deckSlugs: string[] = []): PublicRoom {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    mode: row.mode,
    intensityMax: row.intensity_max,
    allowedDecks: deckSlugs,
    blockedTags: [],
    spinType: row.spin_type ?? null,
    showScores: row.show_scores ?? false,
    currentCardId: row.current_card_id ?? null,
    currentPlayerId: row.current_player_id ?? null,
    turnOrder: row.turn_order ?? [],
    turnIndex: row.turn_index ?? 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function rowToPublicPlayer(row: any): PublicPlayer {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarSeed: row.avatar_seed ?? null,
    isHost: row.is_host,
    joinedAt: row.joined_at,
    leftAt: row.left_at ?? null,
  };
}

export function RoomProvider({ roomId, userId, children }: ProviderProps) {
  const [state, setState] = useState<RoomState>({
    room: null,
    players: [],
    presence: {},
    loading: true,
    error: null,
  });
  const deckSlugsRef = useRef<string[]>([]);

  const loadInitial = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data: roomRow, error: roomErr } = await supabase
        .from('rooms')
        .select('*, room_allowed_decks!inner(decks(slug))')
        .eq('id', roomId)
        .single();
      if (roomErr || !roomRow) throw roomErr ?? new Error('Sala não encontrada');

      const slugs: string[] = (roomRow.room_allowed_decks ?? [])
        .map((rad: any) => rad.decks?.slug)
        .filter(Boolean);
      deckSlugsRef.current = slugs;

      const { data: playerRows } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .is('left_at', null);

      setState({
        room: rowToPublicRoom(roomRow, slugs),
        players: (playerRows ?? []).map(rowToPublicPlayer),
        presence: {},
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err?.message ?? 'erro' }));
    }
  }, [roomId]);

  // Initial load + DB subscriptions
  useEffect(() => {
    loadInitial();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          setState((s) => ({
            ...s,
            room: rowToPublicRoom(payload.new, deckSlugsRef.current),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        () => {
          // simple strategy: re-fetch player list on any change
          supabase
            .from('room_players')
            .select('*')
            .eq('room_id', roomId)
            .is('left_at', null)
            .then(({ data }) => {
              setState((s) => ({
                ...s,
                players: (data ?? []).map(rowToPublicPlayer),
              }));
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, loadInitial]);

  // Presence channel — separate from db channel so we can track user ids cleanly.
  useEffect(() => {
    const presenceChannel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: userId } },
    });

    const sync = () => {
      const presenceState = presenceChannel.presenceState() as Record<
        string,
        unknown[]
      >;
      const next: Record<string, boolean> = {};
      Object.keys(presenceState).forEach((key) => {
        next[key] = true;
      });
      setState((s) => ({ ...s, presence: next }));
    };

    presenceChannel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId, userId]);

  const setSnapshot = useCallback(
    (next: { room: PublicRoom; players?: PublicPlayer[] }) => {
      deckSlugsRef.current = next.room.allowedDecks;
      setState((s) => ({
        ...s,
        room: next.room,
        players: next.players ?? s.players,
        loading: false,
      }));
    },
    []
  );

  const leave = useCallback(() => {
    storage.clearActiveRoom();
    setState({
      room: null,
      players: [],
      presence: {},
      loading: false,
      error: null,
    });
  }, []);

  const value = useMemo<RoomApi>(
    () => ({ ...state, setSnapshot, refresh: loadInitial, leave }),
    [state, setSnapshot, loadInitial, leave]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomApi {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside RoomProvider');
  return ctx;
}
