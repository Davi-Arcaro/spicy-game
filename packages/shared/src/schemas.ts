// Zod schemas reusáveis. Extraídos dos docs 05 e 08.
// Consumidos pelo app mobile antes de chamar edge functions.
// Edge functions mantêm cópias inline (limitação do runtime Deno).

import { z } from 'zod';

export const createRoomSchema = z.object({
  displayName: z.string().min(1).max(32),
  mode: z.enum(['roulette', 'couple', 'group', 'qa', 'truth_dare']),
  intensityMax: z.enum(['soft', 'medium', 'spicy', 'extreme']),
  allowedDecks: z.array(z.string()).min(1),
  blockedTags: z.array(z.string()).optional().default([]),
  spinType: z
    .enum(['mode_spin', 'player_spin', 'intensity_spin', 'category_spin'])
    .optional(),
  showScores: z.boolean().optional().default(false),
  isAdult: z.boolean().optional().default(false),
  idempotencyKey: z.string().uuid().optional(),
});

export const joinRoomSchema = z.object({
  code: z
    .string()
    .length(4)
    .regex(/^[A-Za-z]{4}$/)
    .transform((s) => s.toUpperCase()),
  displayName: z.string().min(1).max(32),
  avatarSeed: z.string().optional(),
  isAdult: z.boolean().optional().default(false),
  idempotencyKey: z.string().uuid().optional(),
});

export const leaveRoomSchema = z.object({
  roomId: z.string().uuid(),
});

export const startGameSchema = z.object({
  roomId: z.string().uuid(),
  shuffleTurnOrder: z.boolean().optional().default(true),
});

export const drawCardSchema = z.object({
  roomId: z.string().uuid(),
  cardTypeFilter: z
    .enum([
      'question',
      'truth',
      'dare',
      'couple_prompt',
      'party_action',
      'vote',
      'never_have_i',
    ])
    .optional(),
});

export const spinRouletteSchema = z.object({
  roomId: z.string().uuid(),
});

export const submitActionSchema = z.object({
  roomId: z.string().uuid(),
  actionType: z.enum([
    'complete',
    'refuse',
    'contest',
    'vote',
    'answer',
    'skip',
  ]),
  payload: z.unknown().optional(),
});

export const advanceTurnSchema = z.object({
  roomId: z.string().uuid(),
  reason: z.enum(['manual', 'timeout']).optional().default('manual'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(32).optional(),
  avatarSeed: z.string().optional(),
  isAdult: z.boolean().optional(),
  locale: z.string().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type StartGameInput = z.infer<typeof startGameSchema>;
export type DrawCardInput = z.infer<typeof drawCardSchema>;
export type SpinRouletteInput = z.infer<typeof spinRouletteSchema>;
export type SubmitActionInput = z.infer<typeof submitActionSchema>;
export type AdvanceTurnInput = z.infer<typeof advanceTurnSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
