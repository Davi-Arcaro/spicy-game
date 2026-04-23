import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';
import { toPublicPlayer, toPublicRoom } from '../_shared/mappers.ts';

const StartGameSchema = z.object({
  roomId: z.string().uuid(),
  shuffleTurnOrder: z.boolean().optional().default(true),
});

Deno.serve(
  apiHandler(StartGameSchema, async (input, req) => {
    const caller = await authenticateCaller(req);
    if ('__isApiError' in caller) return caller;

    const admin = adminClient();

    const { data: playerRow } = await admin
      .from('room_players')
      .select('id, is_host')
      .eq('room_id', input.roomId)
      .eq('user_id', caller.userId)
      .is('left_at', null)
      .maybeSingle();

    if (!playerRow) return errorCodes.FORBIDDEN('Você não está nesta sala');
    if (!playerRow.is_host) return errorCodes.NOT_HOST('Apenas o host pode iniciar');

    const { data: room } = await admin
      .from('rooms')
      .select('*')
      .eq('id', input.roomId)
      .single();

    if (!room) return errorCodes.NOT_FOUND('Sala não encontrada');
    if (room.status !== 'lobby') {
      return errorCodes.ALREADY_STARTED('Jogo já começou');
    }

    const { data: activePlayers } = await admin
      .from('room_players')
      .select('*')
      .eq('room_id', input.roomId)
      .is('left_at', null)
      .order('joined_at', { ascending: true });

    const { data: decks } = await admin
      .from('decks')
      .select('id, slug, min_players')
      .in('id', room.allowed_decks as string[]);

    const minPlayers = Math.max(...(decks?.map((d) => d.min_players) ?? [2]));
    if ((activePlayers?.length ?? 0) < minPlayers) {
      return errorCodes.NOT_ENOUGH_PLAYERS(
        `Precisa de ao menos ${minPlayers} jogadores`
      );
    }

    let turnOrder = (activePlayers ?? []).map((p) => p.id);
    if (input.shuffleTurnOrder) {
      turnOrder = shuffle(turnOrder);
    }

    const { data: updatedRoom } = await admin
      .from('rooms')
      .update({
        status: 'playing',
        turn_order: turnOrder,
        turn_index: 0,
        current_player_id: turnOrder[0],
        current_card_id: null,
      })
      .eq('id', input.roomId)
      .select('*')
      .single();

    const firstPlayer = (activePlayers ?? []).find((p) => p.id === turnOrder[0]);
    const deckSlugsById = new Map((decks ?? []).map((d) => [d.id, d.slug]));

    return {
      room: updatedRoom ? toPublicRoom(updatedRoom, deckSlugsById) : null,
      firstPlayer: firstPlayer ? toPublicPlayer(firstPlayer) : null,
      firstCard: null,
    };
  })
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
