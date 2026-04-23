import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders, handleCors } from './cors.ts';
import { ApiError, ApiErrorObject, errorCodes, isApiError } from './errors.ts';

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

// Wrapper que envolve toda Edge Function. Trata CORS preflight, parsing
// do JSON, validação Zod, execução com try/catch e envelope de resposta.
export function apiHandler<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  impl: (input: TInput, req: Request) => Promise<TOutput | ApiErrorObject>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const cors = handleCors(req);
    if (cors) return cors;

    try {
      let body: unknown;
      try {
        body = req.method === 'POST' ? await req.json() : {};
      } catch {
        return jsonResponse(
          errorCodes.VALIDATION_FAILED('Body inválido: JSON malformado'),
          422
        );
      }

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(
          errorCodes.VALIDATION_FAILED('Payload inválido', parsed.error.issues),
          422
        );
      }

      const result = await impl(parsed.data, req);

      if (isApiError(result)) {
        return jsonResponse(result, result.status);
      }

      return new Response(
        JSON.stringify({ data: result, error: null }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (err) {
      console.error('Unhandled error in function:', err);
      return jsonResponse(
        errorCodes.INTERNAL_ERROR('Erro interno inesperado', String(err)),
        500
      );
    }
  };
}

function jsonResponse(apiError: ApiErrorObject, status: number): Response {
  return new Response(
    JSON.stringify({ data: null, error: apiError.error }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}
