// Typed wrapper around the 10 edge functions.
// Validates input via shared zod schemas, normalizes the
// { data, error } envelope into a thrown ApiException on failure.

import {
  advanceTurnSchema,
  createRoomSchema,
  drawCardSchema,
  joinRoomSchema,
  leaveRoomSchema,
  spinRouletteSchema,
  startGameSchema,
  submitActionSchema,
  updateProfileSchema,
  type AdvanceTurnInput,
  type CreateRoomInput,
  type DrawCardInput,
  type JoinRoomInput,
  type LeaveRoomInput,
  type SpinRouletteInput,
  type StartGameInput,
  type SubmitActionInput,
  type UpdateProfileInput,
  type ApiError,
  type PublicCard,
  type PublicDeck,
  type PublicPlayer,
  type PublicRoom,
} from '@shared';
import type { z } from 'zod';

import { supabase } from './supabase';

export class ApiException extends Error {
  readonly code: string;
  readonly details?: unknown;
  constructor(error: ApiError) {
    super(error.message);
    this.code = error.code;
    this.details = error.details;
  }
}

async function callRaw<TOutput>(name: string, body: unknown): Promise<TOutput> {
  const { data, error: fnError } = await supabase.functions.invoke<{
    data: TOutput | null;
    error: ApiError | null;
  }>(name, { body: body ?? {} });

  if (fnError) {
    throw new ApiException({
      code: 'NETWORK_ERROR',
      message: fnError.message ?? 'Erro de rede',
    });
  }

  if (!data) {
    throw new ApiException({
      code: 'EMPTY_RESPONSE',
      message: `Função ${name} retornou vazio`,
    });
  }

  if (data.error) throw new ApiException(data.error);
  if (data.data === null) {
    throw new ApiException({
      code: 'EMPTY_DATA',
      message: `Função ${name} sem data`,
    });
  }
  return data.data;
}

async function call<TInput, TOutput>(
  name: string,
  schema: z.ZodSchema<TInput>,
  input: unknown
): Promise<TOutput> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiException({
      code: 'CLIENT_VALIDATION',
      message: 'Payload inválido no cliente',
      details: parsed.error.issues,
    });
  }
  return callRaw<TOutput>(name, parsed.data);
}

// ---- Response shapes (mirror the edge functions) -----------------

export interface RoomEnvelope {
  room: PublicRoom;
  player: PublicPlayer;
  accessToken?: string;
}

export interface JoinRoomResponse {
  room: PublicRoom;
  player: PublicPlayer;
  allPlayers: PublicPlayer[];
  currentCard: PublicCard | null;
  accessToken?: string;
}

export interface LeaveRoomResponse {
  roomId: string;
  newHostId: string | null;
}

export interface StartGameResponse {
  room: PublicRoom | null;
  firstPlayer: PublicPlayer | null;
  firstCard: PublicCard | null;
}

export interface DrawCardResponse {
  card: PublicCard;
  playerToAct: PublicPlayer | null;
  cardHistoryId: string | null;
}

export type SpinOutcome =
  | { kind: 'card_type'; cardType: 'truth' | 'dare' }
  | { kind: 'player_choice' }
  | { kind: 'skip' }
  | { kind: 'player'; playerId: string };

export interface SpinRouletteResponse {
  outcome: SpinOutcome;
  animationSeed: string;
  durationMs: number;
  resolvedCard: PublicCard | null;
}

export interface SubmitActionResponse {
  actionId: string;
  turnAdvanced: boolean;
  nextPlayer: PublicPlayer | null;
  penalty: PublicCard | null;
}

export interface AdvanceTurnResponse {
  room: PublicRoom | null;
  nextPlayer: PublicPlayer | null;
}

// ---- Public API ---------------------------------------------------

export const api = {
  listDecks: async (): Promise<PublicDeck[]> => {
    const res = await callRaw<{ decks: PublicDeck[] }>('list_decks', {});
    return res.decks;
  },

  updateProfile: (input: UpdateProfileInput) =>
    call<UpdateProfileInput, { updated: true }>(
      'update_profile',
      updateProfileSchema,
      input
    ),

  createRoom: (input: CreateRoomInput) =>
    call<CreateRoomInput, RoomEnvelope>('create_room', createRoomSchema, input),

  joinRoom: (input: JoinRoomInput) =>
    call<JoinRoomInput, JoinRoomResponse>('join_room', joinRoomSchema, input),

  leaveRoom: (input: LeaveRoomInput) =>
    call<LeaveRoomInput, LeaveRoomResponse>('leave_room', leaveRoomSchema, input),

  startGame: (input: StartGameInput) =>
    call<StartGameInput, StartGameResponse>('start_game', startGameSchema, input),

  drawCard: (input: DrawCardInput) =>
    call<DrawCardInput, DrawCardResponse>('draw_card', drawCardSchema, input),

  spinRoulette: (input: SpinRouletteInput) =>
    call<SpinRouletteInput, SpinRouletteResponse>(
      'spin_roulette',
      spinRouletteSchema,
      input
    ),

  submitAction: (input: SubmitActionInput) =>
    call<SubmitActionInput, SubmitActionResponse>(
      'submit_action',
      submitActionSchema,
      input
    ),

  advanceTurn: (input: AdvanceTurnInput) =>
    call<AdvanceTurnInput, AdvanceTurnResponse>(
      'advance_turn',
      advanceTurnSchema,
      input
    ),
};
