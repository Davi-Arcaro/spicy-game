import type {
  PublicCard,
  PublicDeck,
  PublicPlayer,
  PublicRoom,
} from './contracts.ts';

type RoomRow = {
  id: string;
  code: string;
  status: string;
  mode: string;
  intensity_max: string;
  allowed_decks: string[];
  blocked_tags: string[];
  spin_type: string | null;
  show_scores: boolean;
  current_card_id: string | null;
  current_player_id: string | null;
  turn_order: string[];
  turn_index: number;
  created_at: string;
  expires_at: string;
};

type DeckRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_free: boolean;
  requires_adult: boolean;
  min_players: number;
  max_players: number;
};

type PlayerRow = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_seed: string | null;
  is_host: boolean;
  joined_at: string;
  left_at: string | null;
};

type CardRow = {
  id: string;
  type: string;
  intensity: string;
  prompt: string;
  secondary_text: string | null;
  duration_sec: number | null;
  requires_props: string[];
};

export function toPublicRoom(
  row: RoomRow,
  deckSlugsById: Map<string, string>
): PublicRoom {
  return {
    id: row.id,
    code: row.code,
    status: row.status as PublicRoom['status'],
    mode: row.mode as PublicRoom['mode'],
    intensityMax: row.intensity_max as PublicRoom['intensityMax'],
    allowedDecks: row.allowed_decks
      .map((id) => deckSlugsById.get(id))
      .filter((slug): slug is string => !!slug),
    blockedTags: row.blocked_tags, // TODO: mapear para slugs se necessário
    spinType: row.spin_type as PublicRoom['spinType'],
    showScores: row.show_scores,
    currentCardId: row.current_card_id,
    currentPlayerId: row.current_player_id,
    turnOrder: row.turn_order,
    turnIndex: row.turn_index,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function toPublicDeck(row: DeckRow): PublicDeck {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    coverUrl: row.cover_url,
    isFree: row.is_free,
    requiresAdult: row.requires_adult,
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
  };
}

export function toPublicPlayer(row: PlayerRow): PublicPlayer {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarSeed: row.avatar_seed,
    isHost: row.is_host,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
  };
}

export function toPublicCard(row: CardRow): PublicCard {
  return {
    id: row.id,
    type: row.type as PublicCard['type'],
    intensity: row.intensity as PublicCard['intensity'],
    prompt: row.prompt,
    secondaryText: row.secondary_text,
    durationSec: row.duration_sec,
    requiresProps: row.requires_props,
  };
}
