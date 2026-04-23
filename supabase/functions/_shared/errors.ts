export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiErrorObject = { __isApiError: true; error: ApiError; status: number };

export function isApiError(value: unknown): value is ApiErrorObject {
  return typeof value === 'object' && value !== null && '__isApiError' in value;
}

function buildError(
  code: string,
  status: number
): (message: string, details?: unknown) => ApiErrorObject {
  return (message, details) => ({
    __isApiError: true,
    status,
    error: { code, message, details },
  });
}

// Códigos de erro padronizados. Referenciados no doc 05.
export const errorCodes = {
  // Genéricos
  UNAUTHENTICATED: buildError('UNAUTHENTICATED', 401),
  FORBIDDEN: buildError('FORBIDDEN', 403),
  NOT_FOUND: buildError('NOT_FOUND', 404),
  VALIDATION_FAILED: buildError('VALIDATION_FAILED', 422),
  RATE_LIMITED: buildError('RATE_LIMITED', 429),
  INTERNAL_ERROR: buildError('INTERNAL_ERROR', 500),

  // create_room
  DECKS_NOT_FOUND: buildError('DECKS_NOT_FOUND', 422),
  ADULT_GATE_REQUIRED: buildError('ADULT_GATE_REQUIRED', 403),
  ROULETTE_REQUIRES_SPIN_TYPE: buildError('ROULETTE_REQUIRES_SPIN_TYPE', 422),

  // join_room
  ROOM_NOT_FOUND: buildError('ROOM_NOT_FOUND', 404),
  ROOM_FULL: buildError('ROOM_FULL', 403),
  ROOM_IN_PROGRESS: buildError('ROOM_IN_PROGRESS', 403),
  ALREADY_JOINED: buildError('ALREADY_JOINED', 200),

  // start_game
  NOT_HOST: buildError('NOT_HOST', 403),
  NOT_ENOUGH_PLAYERS: buildError('NOT_ENOUGH_PLAYERS', 422),
  ALREADY_STARTED: buildError('ALREADY_STARTED', 422),

  // draw_card
  NO_CARDS_AVAILABLE: buildError('NO_CARDS_AVAILABLE', 404),
  NOT_YOUR_TURN: buildError('NOT_YOUR_TURN', 403),
  GAME_NOT_STARTED: buildError('GAME_NOT_STARTED', 422),

  // spin_roulette
  NOT_ROULETTE_MODE: buildError('NOT_ROULETTE_MODE', 422),

  // submit_action
  NO_ACTIVE_CARD: buildError('NO_ACTIVE_CARD', 422),
  ACTION_NOT_ALLOWED: buildError('ACTION_NOT_ALLOWED', 403),
  DUPLICATE_ACTION: buildError('DUPLICATE_ACTION', 422),
};
