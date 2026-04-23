import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';
import { withIdempotency } from '../_shared/idempotency.ts';
import {
  toPublicCard,
  toPublicPlayer,
  toPublicRoom,
} from '../_shared/mappers.ts';

const JoinRoomSchema = z.object({
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

Deno.serve(
  apiHandler(JoinRoomSchema, async (input, req) => {
    const caller = await authenticateCaller(req, { allowCreateAnonymous: true });
    if ('__isApiError' in caller) return caller;

    return withIdempotency({
      key: input.idempotencyKey,
      functionName: 'join_room',
      userId: caller.userId,
      execute: () => doJoinRoom(input, caller),
    });
  })
);

async function doJoinRoom(
  input: z.infer<typeof JoinRoomSchema>,
  caller: { userId: string; jwt: string }
) {
  const admin = adminClient();

  const { data: room, error: roomError } = await admin
    .from('rooms')
    .select('*')
    .eq('code', input.code)
    .neq('status', 'ended')
    .maybeSingle();

  if (roomError || !room) {
    return errorCodes.ROOM_NOT_FOUND('Sala não encontrada ou já encerrada');
  }

  const { data: decks } = await admin
    .from('decks')
    .select('id, slug, requires_adult, max_players')
    .in('id', room.allowed_decks as string[]);

  const requiresAdult = decks?.some((d) => d.requires_adult) ?? false;
  if (requiresAdult && !input.isAdult) {
    return errorCodes.ADULT_GATE_REQUIRED(
      'Esta sala contém conteúdo +18. Confirme sua maioridade.'
    );
  }

  const { data: existing } = await admin
    .from('room_players')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', caller.userId)
    .is('left_at', null)
    .maybeSingle();

  if (existing) {
    return buildJoinResponse(admin, room, existing, caller, decks ?? []);
  }

  const maxPlayers = Math.min(...(decks?.map((d) => d.max_players) ?? [12]));
  const { count } = await admin
    .from('room_players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .is('left_at', null);

  if ((count ?? 0) >= maxPlayers) {
    return errorCodes.ROOM_FULL(
      `Sala atingiu o limite de ${maxPlayers} jogadores`
    );
  }

  if (input.isAdult) {
    await admin.from('player_profiles').upsert({
      user_id: caller.userId,
      is_adult: true,
      display_name: input.displayName,
    });
  }

  const { data: newPlayer, error: insertError } = await admin
    .from('room_players')
    .insert({
      room_id: room.id,
      user_id: caller.userId,
      display_name: input.displayName,
      avatar_seed: input.avatarSeed ?? null,
      is_host: false,
    })
    .select('*')
    .single();

  if (insertError || !newPlayer) {
    return errorCodes.INTERNAL_ERROR('Falha ao entrar na sala', insertError);
  }

  await admin
    .from('rooms')
    .update({
      turn_order: [...(room.turn_order as string[]), newPlayer.id],
    })
    .eq('id', room.id);

  return buildJoinResponse(admin, room, newPlayer, caller, decks ?? []);
}

async function buildJoinResponse(
  admin: ReturnType<typeof adminClient>,
  room: any,
  player: any,
  caller: { jwt: string },
  decks: Array<{ id: string; slug: string }>
) {
  const { data: allPlayers } = await admin
    .from('room_players')
    .select('*')
    .eq('room_id', room.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true });

  let currentCard = null;
  if (room.current_card_id) {
    const { data: card } = await admin
      .from('cards')
      .select('*')
      .eq('id', room.current_card_id)
      .single();
    currentCard = card ? toPublicCard(card) : null;
  }

  const deckSlugsById = new Map(decks.map((d) => [d.id, d.slug]));
  return {
    room: toPublicRoom(room, deckSlugsById),
    player: toPublicPlayer(player),
    allPlayers: (allPlayers ?? []).map(toPublicPlayer),
    currentCard,
    accessToken: caller.jwt,
  };
}
