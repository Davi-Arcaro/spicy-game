import { adminClient, userClient } from './client.ts';
import { ApiErrorObject, errorCodes } from './errors.ts';

export interface AuthedCaller {
  userId: string;
  isAnonymous: boolean;
  jwt: string;
}

// Autentica o caller via JWT. Se o endpoint aceita usuários novos,
// cria um anônimo automaticamente.
export async function authenticateCaller(
  req: Request,
  options: { allowCreateAnonymous?: boolean } = {}
): Promise<AuthedCaller | ApiErrorObject> {
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '');

  if (jwt && jwt !== Deno.env.get('SUPABASE_ANON_KEY')) {
    const client = userClient(req);
    const { data, error } = await client.auth.getUser();

    if (error || !data.user) {
      return errorCodes.UNAUTHENTICATED('Token inválido ou expirado');
    }

    return {
      userId: data.user.id,
      isAnonymous: data.user.is_anonymous ?? false,
      jwt,
    };
  }

  if (options.allowCreateAnonymous) {
    const admin = adminClient();
    const { data, error } = await admin.auth.signInAnonymously();

    if (error || !data.user || !data.session) {
      return errorCodes.INTERNAL_ERROR('Falha ao criar sessão anônima');
    }

    return {
      userId: data.user.id,
      isAnonymous: true,
      jwt: data.session.access_token,
    };
  }

  return errorCodes.UNAUTHENTICATED('Autenticação necessária');
}
