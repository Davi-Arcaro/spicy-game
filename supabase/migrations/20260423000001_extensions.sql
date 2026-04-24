-- =========================================================================
-- 001 — Extensões do Postgres necessárias para o projeto
-- =========================================================================
-- Executar UMA VEZ por banco. Idempotente via IF NOT EXISTS.

-- pgcrypto: usado para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- uuid-ossp: backup caso pgcrypto não esteja disponível
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm: útil para futuras buscas fuzzy em cartas (fase 2)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
