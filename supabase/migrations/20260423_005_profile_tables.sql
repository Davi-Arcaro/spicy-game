-- =========================================================================
-- 005 — Tabelas de perfil e entitlements
-- =========================================================================

-- -------------------------------------------------------------------------
-- PLAYER_PROFILES
-- Perfil persistente do jogador (sobrevive entre salas).
-- -------------------------------------------------------------------------
CREATE TABLE player_profiles (
  user_id       uuid PRIMARY KEY,

  display_name  text,
  avatar_seed   text,

  -- autodeclaração. Gate para conteúdo extreme e deck Beba.
  is_adult      boolean NOT NULL DEFAULT false,

  locale        text NOT NULL DEFAULT 'pt-BR',

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_display_name_length
    CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 32)
);

COMMENT ON TABLE player_profiles IS
'Perfil persistente do jogador. is_adult habilita Beba e conteúdo spicy.';

-- -------------------------------------------------------------------------
-- USER_DECK_ENTITLEMENTS
-- Acesso do jogador a decks pagos. MVP todos free, mas tabela existe
-- para não precisar migration na fase 2.
-- -------------------------------------------------------------------------
CREATE TABLE user_deck_entitlements (
  user_id     uuid NOT NULL,
  deck_id     uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  source      text NOT NULL,

  granted_at  timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, deck_id),

  CONSTRAINT entitlement_source_valid
    CHECK (source IN ('free', 'purchase', 'code', 'gift'))
);

CREATE INDEX idx_entitlements_user ON user_deck_entitlements(user_id);
