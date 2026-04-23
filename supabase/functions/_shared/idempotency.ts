import { adminClient } from './client.ts';

// Guarda resultados de operações por idempotencyKey.
// Usa tabela _idempotency_cache no banco (migration 20260423_009).
export async function withIdempotency<T>(
  params: {
    key: string | undefined;
    functionName: string;
    userId: string;
    execute: () => Promise<T>;
  }
): Promise<T> {
  if (!params.key) {
    return params.execute();
  }

  const admin = adminClient();

  const { data: cached } = await admin
    .from('_idempotency_cache')
    .select('result')
    .eq('key', params.key)
    .eq('user_id', params.userId)
    .eq('function_name', params.functionName)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached) {
    return cached.result as T;
  }

  const result = await params.execute();

  await admin.from('_idempotency_cache').insert({
    key: params.key,
    function_name: params.functionName,
    user_id: params.userId,
    result: result as unknown as object,
  });

  return result;
}
