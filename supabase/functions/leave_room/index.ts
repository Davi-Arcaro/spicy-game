import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';

const LeaveRoomSchema = z.object({
  roomId: z.string().uuid(),
});

Deno.serve(
  apiHandler(LeaveRoomSchema, async (input, req) => {
    const caller = await authenticateCaller(req);
    if ('__isApiError' in caller) return caller;

    const admin = adminClient();

    const { data: player } = await admin
      .from('room_players')
      .select('id, is_host, room_id')
      .eq('room_id', input.roomId)
      .eq('user_id', caller.userId)
      .is('left_at', null)
      .maybeSingle();

    if (!player) return errorCodes.NOT_FOUND('Você não está nesta sala');

    await admin
      .from('room_players')
      .update({ left_at: new Date().toISOString() })
      .eq('id', player.id);

    let newHostId: string | null = null;
    if (player.is_host) {
      const { data: nextHost } = await admin
        .from('room_players')
        .select('id')
        .eq('room_id', input.roomId)
        .is('left_at', null)
        .neq('id', player.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextHost) {
        await admin
          .from('room_players')
          .update({ is_host: true })
          .eq('id', nextHost.id);
        await admin
          .from('rooms')
          .update({ host_player_id: nextHost.id })
          .eq('id', input.roomId);
        newHostId = nextHost.id;
      } else {
        await admin
          .from('rooms')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', input.roomId);
      }
    }

    return { roomId: input.roomId, newHostId };
  })
);
