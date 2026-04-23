// contracts.ts — fonte única de verdade (doc 05).
// Este arquivo é consumido pelo app mobile. As edge functions mantêm cópia
// em supabase/functions/_shared/contracts.ts (limitação do runtime Deno).

// ============================================================================
// DOMÍNIO
// ============================================================================

export type CardType =
  | 'question'
  | 'truth'
  | 'dare'
  | 'couple_prompt'
  | 'party_action'
  | 'vote'
  | 'never_have_i';

export type IntensityLevel = 'soft' | 'medium' | 'spicy' | 'extreme';

export type AudienceMode = 'couple' | 'group' | 'both';

export type GameMode = 'roulette' | 'couple' | 'group' | 'qa' | 'truth_dare';

export type RoomStatus = 'lobby' | 'playing' | 'paused' | 'ended';

export type SpinType =
  | 'mode_spin'
  | 'player_spin'
  | 'intensity_spin'
  | 'category_spin';

export type ActionType =
  | 'complete'
  | 'refuse'
  | 'contest'
  | 'vote'
  | 'answer'
  | 'skip';

export type Outcome = 'completed' | 'refused' | 'contested' | 'skipped';

// ============================================================================
// ENTIDADES PÚBLICAS
// ============================================================================

export interface PublicDeck {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isFree: boolean;
  requiresAdult: boolean;
  minPlayers: number;
  maxPlayers: number;
}

export interface PublicCard {
  id: string;
  type: CardType;
  intensity: IntensityLevel;
  prompt: string;
  secondaryText: string | null;
  durationSec: number | null;
  requiresProps: string[];
}

export interface PublicPlayer {
  id: string;
  userId: string;
  displayName: string;
  avatarSeed: string | null;
  isHost: boolean;
  joinedAt: string;
  leftAt: string | null;
}

export interface PublicRoom {
  id: string;
  code: string;
  status: RoomStatus;
  mode: GameMode;
  intensityMax: IntensityLevel;
  allowedDecks: string[];
  blockedTags: string[];
  spinType: SpinType | null;
  showScores: boolean;
  currentCardId: string | null;
  currentPlayerId: string | null;
  turnOrder: string[];
  turnIndex: number;
  createdAt: string;
  expiresAt: string;
}

// ============================================================================
// ERROS
// ============================================================================

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };
