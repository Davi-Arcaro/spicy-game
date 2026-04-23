import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';
import { toPublicCard, toPublicPlayer } from '../_shared/mappers.ts';

const DrawCardSchema = z.object({
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

Deno.serve(
  apiHandler(DrawCardSchema, async (input, req) => {
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

    if (!playerRow) {
      return errorCodes.FORBIDDEN('Você não está nesta sala');
    }

    const { data: room } = await admin
      .from('rooms')
      .select('*')
      .eq('id', input.roomId)
      .single();

    if (!room) return errorCodes.NOT_FOUND('Sala não encontrada');
    if (room.status !== 'playing') {
      return errorCodes.GAME_NOT_STARTED('Jogo ainda não começou');
    }

    const isHost = playerRow.is_host;
    const isMyTurn = room.current_player_id === playerRow.id;
    if (!isHost && !isMyTurn) {
      return errorCodes.NOT_YOUR_TURN('Não é a sua vez');
    }

    const { data: card, error: drawError } = await admin
      .rpc('draw_next_card', {
        p_room_id: input.roomId,
        p_card_type: input.cardTypeFilter ?? null,
      })
      .maybeSingle();

    if (drawError) {
      return errorCodes.INTERNAL_ERROR('Falha no sorteio', drawError);
    }

    if (!card) {
      return errorCodes.NO_CARDS_AVAILABLE(
        'Nenhuma carta disponível com os filtros atuais'
      );
    }

    const { data: historyRow } = await admin
      .from('room_card_history')
      .insert({
        room_id: input.roomId,
        card_id: card.id,
        player_id: room.current_player_id,
      })
      .select('id')
      .single();

    await admin
      .from('rooms')
      .update({ current_card_id: card.id })
      .eq('id', input.roomId);

    const { data: playerToAct } = await admin
      .from('room_players')
      .select('*')
      .eq('id', room.current_player_id)
      .single();

    return {
      card: toPublicCard(card),
      playerToAct: playerToAct ? toPublicPlayer(playerToAct) : null,
      cardHistoryId: historyRow?.id ?? null,
    };
  })
);
