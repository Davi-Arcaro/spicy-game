import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';
import { withIdempotency } from '../_shared/idempotency.ts';
import { toPublicPlayer, toPublicRoom } from '../_shared/mappers.ts';

const CreateRoomSchema = z.object({
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

Deno.serve(
  apiHandler(CreateRoomSchema, async (input, req) => {
    const caller = await authenticateCaller(req, { allowCreateAnonymous: true });
    if ('__isApiError' in caller) return caller;

    if (input.mode === 'roulette' && !input.spinType) {
      return errorCodes.ROULETTE_REQUIRES_SPIN_TYPE(
        'Modo roleta requer spinType definido'
      );
    }

    if (input.allowedDecks.includes('beba') && !input.isAdult) {
      return errorCodes.ADULT_GATE_REQUIRED(
        'Deck Beba requer confirmação de maioridade'
      );
    }

    return withIdempotency({
      key: input.idempotencyKey,
      functionName: 'create_room',
      userId: caller.userId,
      execute: () => doCreateRoom(input, caller),
    });
  })
);

async function doCreateRoom(
  input: z.infer<typeof CreateRoomSchema>,
  caller: { userId: string; jwt: string }
) {
  const admin = adminClient();

  const { data: decks, error: decksError } = await admin
    .from('decks')
    .select('id, slug, min_players, max_players, requires_adult')
    .in('slug', input.allowedDecks);

  if (decksError || !decks || decks.length !== input.allowedDecks.length) {
    return errorCodes.DECKS_NOT_FOUND(
      'Um ou mais decks não existem',
      { requested: input.allowedDecks, found: decks?.map((d) => d.slug) }
    );
  }

  if (input.isAdult) {
    await admin
      .from('player_profiles')
      .upsert({
        user_id: caller.userId,
        is_adult: true,
        display_name: input.displayName,
      });
  }

  let blockedTagIds: string[] = [];
  if (input.blockedTags.length > 0) {
    const { data: tags } = await admin
      .from('tags')
      .select('id')
      .in('slug', input.blockedTags);
    blockedTagIds = tags?.map((t) => t.id) ?? [];
  }

  const code = await generateUniqueRoomCode(admin);

  const { data: createResult, error: createError } = await admin.rpc(
    'create_room_with_host',
    {
      p_code: code,
      p_mode: input.mode,
      p_intensity_max: input.intensityMax,
      p_allowed_decks: decks.map((d) => d.id),
      p_blocked_tags: blockedTagIds,
      p_spin_type: input.spinType ?? null,
      p_show_scores: input.showScores,
      p_user_id: caller.userId,
      p_display_name: input.displayName,
    }
  );

  if (createError || !createResult) {
    return errorCodes.INTERNAL_ERROR('Falha ao criar sala', createError);
  }

  const deckSlugsById = new Map(decks.map((d) => [d.id, d.slug]));
  return {
    room: toPublicRoom(createResult.room, deckSlugsById),
    player: toPublicPlayer(createResult.player),
    accessToken: caller.jwt,
  };
}

// Gera código único de 4 letras. Tenta até 10x em colisão.
async function generateUniqueRoomCode(admin: ReturnType<typeof adminClient>) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomRoomCode();
    const { data } = await admin
      .from('rooms')
      .select('id')
      .eq('code', code)
      .neq('status', 'ended')
      .maybeSingle();

    if (!data) return code;
  }
  throw new Error('Esgotou tentativas de gerar código único');
}

function randomRoomCode(): string {
  // Sem O para evitar confusão com 0.
  const letters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () =>
    letters[Math.floor(Math.random() * letters.length)]
  ).join('');
}
