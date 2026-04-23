import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { errorCodes } from '../_shared/errors.ts';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(32).optional(),
  avatarSeed: z.string().optional(),
  isAdult: z.boolean().optional(),
  locale: z.string().optional(),
});

Deno.serve(
  apiHandler(UpdateProfileSchema, async (input, req) => {
    const caller = await authenticateCaller(req);
    if ('__isApiError' in caller) return caller;

    const admin = adminClient();

    const patch: Record<string, unknown> = { user_id: caller.userId };
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.avatarSeed !== undefined) patch.avatar_seed = input.avatarSeed;
    if (input.isAdult !== undefined) patch.is_adult = input.isAdult;
    if (input.locale !== undefined) patch.locale = input.locale;

    const { error } = await admin
      .from('player_profiles')
      .upsert(patch, { onConflict: 'user_id' });

    if (error) {
      return errorCodes.INTERNAL_ERROR('Falha ao atualizar perfil', error);
    }

    return { updated: true };
  })
);
