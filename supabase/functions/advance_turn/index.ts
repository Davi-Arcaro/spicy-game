import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';
import { toPublicPlayer, toPublicRoom } from '../_shared/mappers.ts';

const AdvanceTurnSchema = z.object({
  roomId: z.string().uuid(),
  reason: z.enum(['manual', 'timeout']).optional().default('manual'),
});

Deno.serve(
  apiHandler(AdvanceTurnSchema, async (input, req) => {
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

    const turnOrder = room.turn_order as string[];
    if (!turnOrder?.length) {
      return errorCodes.VALIDATION_FAILED('Sala sem ordem de turnos');
    }

    const { data: activePlayers } = await admin
      .from('room_players')
      .select('id, user_id, display_name, avatar_seed, is_host, joined_at, left_at')
      .eq('room_id', input.roomId)
      .is('left_at', null);

    const activeIds = new Set((activePlayers ?? []).map((p) => p.id));

    // Pula jogadores que saíram.
    let nextIndex = room.turn_index;
    let nextPlayerId: string | null = null;
    for (let i = 1; i <= turnOrder.length; i++) {
      const candidateIdx = (room.turn_index + i) % turnOrder.length;
      const candidateId = turnOrder[candidateIdx];
      if (activeIds.has(candidateId)) {
        nextIndex = candidateIdx;
        nextPlayerId = candidateId;
        break;
      }
    }

    if (!nextPlayerId) {
      return errorCodes.INTERNAL_ERROR('Nenhum jogador ativo para avançar turno');
    }

    const { data: updatedRoom } = await admin
      .from('rooms')
      .update({
        turn_index: nextIndex,
        current_player_id: nextPlayerId,
        current_card_id: null,
      })
      .eq('id', input.roomId)
      .select('*')
      .single();

    const { data: decks } = await admin
      .from('decks')
      .select('id, slug')
      .in('id', room.allowed_decks as string[]);

    const deckSlugsById = new Map((decks ?? []).map((d) => [d.id, d.slug]));
    const nextPlayerRow = (activePlayers ?? []).find((p) => p.id === nextPlayerId);

    return {
      room: updatedRoom ? toPublicRoom(updatedRoom, deckSlugsById) : null,
      nextPlayer: nextPlayerRow ? toPublicPlayer(nextPlayerRow) : null,
    };
  })
);
