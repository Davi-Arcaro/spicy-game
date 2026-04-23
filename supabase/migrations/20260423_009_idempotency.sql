-- =========================================================================
-- 009 — Cache de idempotência para Edge Functions
-- =========================================================================
-- Guarda resultados por idempotencyKey. TTL de 5 minutos.

CREATE TABLE _idempotency_cache (
  key           uuid PRIMARY KEY,
  function_name text NOT NULL,
  user_id       uuid NOT NULL,
  result        jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX idx_idempotency_expires ON _idempotency_cache(expires_at);

-- Cleanup periódico (pg_cron se disponível, ou edge function agendada).
CREATE OR REPLACE FUNCTION cleanup_idempotency()
RETURNS integer AS $$
DECLARE
  n integer;
BEGIN
  DELETE FROM _idempotency_cache WHERE expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE _idempotency_cache ENABLE ROW LEVEL SECURITY;

-- Cache nunca é acessado via API direta, só via service_role.
-- Sem policies de SELECT/INSERT por usuários finais.
