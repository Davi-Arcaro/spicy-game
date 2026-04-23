import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';
import { toPublicCard, toPublicPlayer } from '../_shared/mappers.ts';

const SubmitActionSchema = z.object({
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

Deno.serve(
  apiHandler(SubmitActionSchema, async (input, req) => {
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

    const { data: room } = await admin
      .from('rooms')
      .select('*')
      .eq('id', input.roomId)
      .single();

    if (!room) return errorCodes.NOT_FOUND('Sala não encontrada');
    if (!room.current_card_id) {
      return errorCodes.NO_ACTIVE_CARD('Nenhuma carta ativa');
    }

    const isCurrentPlayer = room.current_player_id === playerRow.id;

    if (
      (input.actionType === 'complete' ||
        input.actionType === 'refuse' ||
        input.actionType === 'skip') &&
      !isCurrentPlayer
    ) {
      return errorCodes.ACTION_NOT_ALLOWED(
        'Apenas o jogador da vez pode realizar essa ação'
      );
    }

    if (input.actionType === 'contest' && isCurrentPlayer) {
      return errorCodes.ACTION_NOT_ALLOWED(
        'Você não pode contestar sua própria carta'
      );
    }

    const { data: existingAction } = await admin
      .from('room_actions')
      .select('id')
      .eq('room_id', input.roomId)
      .eq('card_id', room.current_card_id)
      .eq('player_id', playerRow.id)
      .eq('action_type', input.actionType)
      .maybeSingle();

    if (existingAction) {
      return errorCodes.DUPLICATE_ACTION(
        'Você já registrou essa ação nesta carta'
      );
    }

    const { data: action, error: insertError } = await admin
      .from('room_actions')
      .insert({
        room_id: input.roomId,
        player_id: playerRow.id,
        card_id: room.current_card_id,
        action_type: input.actionType,
        payload: input.payload ?? null,
      })
      .select('id')
      .single();

    if (insertError || !action) {
      return errorCodes.INTERNAL_ERROR('Falha ao registrar ação', insertError);
    }

    let penalty = null;
    let turnAdvanced = false;
    let nextPlayer = null;

    if (input.actionType === 'refuse') {
      const { data: penaltyCard } = await admin
        .rpc('draw_next_card', {
          p_room_id: input.roomId,
          p_card_type: 'party_action',
        })
        .maybeSingle();

      if (penaltyCard) {
        penalty = toPublicCard(penaltyCard);
      }
    }

    if (input.actionType === 'contest') {
      const { count: contestCount } = await admin
        .from('room_actions')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', input.roomId)
        .eq('card_id', room.current_card_id)
        .eq('action_type', 'contest');

      const { count: activeCount } = await admin
        .from('room_players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', input.roomId)
        .is('left_at', null);

      const others = (activeCount ?? 1) - 1;
      if ((contestCount ?? 0) > others / 2) {
        await admin
          .from('room_card_history')
          .update({ contested: true })
          .eq('room_id', input.roomId)
          .eq('card_id', room.current_card_id);
      }
    }

    return {
      actionId: action.id,
      turnAdvanced,
      nextPlayer,
      penalty,
    };
  })
);
