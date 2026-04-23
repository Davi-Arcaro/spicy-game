import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';
import { toPublicCard } from '../_shared/mappers.ts';

const SpinRouletteSchema = z.object({
  roomId: z.string().uuid(),
});

type ModeSpinOutcome =
  | { kind: 'card_type'; cardType: 'truth' | 'dare' }
  | { kind: 'player_choice' }
  | { kind: 'skip' };

type PlayerSpinOutcome =
  | { kind: 'player'; playerId: string };

type SpinOutcome = ModeSpinOutcome | PlayerSpinOutcome;

Deno.serve(
  apiHandler(SpinRouletteSchema, async (input, req) => {
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
    if (room.mode !== 'roulette') {
      return errorCodes.NOT_ROULETTE_MODE('Esta sala não está em modo roleta');
    }
    if (!room.spin_type) {
      return errorCodes.VALIDATION_FAILED('Sala sem spinType configurado');
    }

    const isMyTurn = room.current_player_id === playerRow.id;
    if (!isMyTurn && !playerRow.is_host) {
      return errorCodes.NOT_YOUR_TURN('Não é a sua vez de girar');
    }

    const seed = randomSeed();
    let outcome: SpinOutcome;
    let resolvedCard = null;

    switch (room.spin_type) {
      case 'mode_spin':
        outcome = resolveModeSpin(seed);
        break;
      case 'player_spin':
        outcome = resolvePlayerSpin(seed, room.turn_order, room.current_player_id);
        break;
      default:
        return errorCodes.INTERNAL_ERROR(
          `spin_type '${room.spin_type}' não implementado no MVP`
        );
    }

    if (outcome.kind === 'card_type') {
      const { data: card } = await admin
        .rpc('draw_next_card', {
          p_room_id: input.roomId,
          p_card_type: outcome.cardType,
        })
        .maybeSingle();

      if (card) {
        resolvedCard = toPublicCard(card);
        await admin.from('room_card_history').insert({
          room_id: input.roomId,
          card_id: card.id,
          player_id: room.current_player_id,
        });
        await admin
          .from('rooms')
          .update({ current_card_id: card.id })
          .eq('id', input.roomId);
      }
    }

    await admin
      .from('rooms')
      .update({
        last_spin_result: {
          outcome,
          seed,
          at: new Date().toISOString(),
        },
      })
      .eq('id', input.roomId);

    return {
      outcome,
      animationSeed: seed,
      durationMs: 2800,
      resolvedCard,
    };
  })
);

function resolveModeSpin(seed: string): ModeSpinOutcome {
  // 8 setores: 3 verdade, 3 desafio, 1 escolha, 1 pular
  const n = seedToInt(seed, 8);
  if (n < 3) return { kind: 'card_type', cardType: 'truth' };
  if (n < 6) return { kind: 'card_type', cardType: 'dare' };
  if (n === 6) return { kind: 'player_choice' };
  return { kind: 'skip' };
}

function resolvePlayerSpin(
  seed: string,
  turnOrder: string[],
  currentPlayerId: string | null
): PlayerSpinOutcome {
  // Exclui o jogador atual — roleta não cai em si mesmo.
  const candidates = turnOrder.filter((id) => id !== currentPlayerId);
  if (candidates.length === 0) {
    return { kind: 'player', playerId: turnOrder[0] };
  }
  const n = seedToInt(seed, candidates.length);
  return { kind: 'player', playerId: candidates[n] };
}

function randomSeed(): string {
  return crypto.randomUUID().slice(0, 8);
}

function seedToInt(seed: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}
