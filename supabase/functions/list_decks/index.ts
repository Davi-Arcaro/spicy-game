import { z } from 'https://esm.sh/zod@3.23.8';
import { adminClient } from '../_shared/client.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { apiHandler } from '../_shared/handler.ts';
import { toPublicDeck } from '../_shared/mappers.ts';

const ListDecksSchema = z.object({});

Deno.serve(
  apiHandler(ListDecksSchema, async (_input, req) => {
    const caller = await authenticateCaller(req, { allowCreateAnonymous: true });
    if ('__isApiError' in caller) return caller;

    const admin = adminClient();

    const { data: decks } = await admin
      .from('decks')
      .select('*')
      .eq('is_official', true)
      .order('name', { ascending: true });

    return {
      decks: (decks ?? []).map(toPublicDeck),
    };
  })
);
