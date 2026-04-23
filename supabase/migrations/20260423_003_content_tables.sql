-- =========================================================================
-- 003 — Tabelas de conteúdo (decks, cards, tags)
-- =========================================================================
-- Conteúdo é o núcleo do jogo. Essas tabelas são populadas pelo seed
-- e pela pipeline de geração de cartas (doc 03).

-- -------------------------------------------------------------------------
-- DECKS
-- Container curado de cartas. No MVP temos: Leve, Picante, Beba.
-- -------------------------------------------------------------------------
CREATE TABLE decks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  description   text,
  cover_url     text,

  -- se TRUE, todos jogadores têm acesso sem precisar de entitlement
  is_free       boolean NOT NULL DEFAULT true,

  -- decks oficiais entram no catálogo padrão; user-generated fica FALSE
  is_official   boolean NOT NULL DEFAULT true,

  -- se TRUE, deck só aparece se pelo menos um jogador da sala
  -- tiver player_profiles.is_adult = true
  requires_adult boolean NOT NULL DEFAULT false,

  min_players   smallint NOT NULL DEFAULT 2,
  max_players   smallint NOT NULL DEFAULT 12,

  locale        text NOT NULL DEFAULT 'pt-BR',

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT decks_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT decks_name_length CHECK (char_length(name) BETWEEN 1 AND 80)
);

COMMENT ON TABLE decks IS
'Containers curados de cartas. MVP lança com: leve, picante, beba.';

-- -------------------------------------------------------------------------
-- TAGS
-- Taxonomia transversal. Cartas têm 1-3 tags (doc 03).
-- -------------------------------------------------------------------------
CREATE TABLE tags (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      text UNIQUE NOT NULL,
  label     text NOT NULL,

  -- tags 'não seguras' (ex: drinking) só aparecem em filtros relevantes
  is_safe   boolean NOT NULL DEFAULT true,

  CONSTRAINT tags_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE tags IS
'Taxonomia de conteúdo. Cada carta tem 1-3 tags para filtragem fina.';

-- -------------------------------------------------------------------------
-- CARDS
-- Unidade atômica jogável. Tudo que aparece pro jogador é uma carta.
-- -------------------------------------------------------------------------
CREATE TABLE cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id         uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  type            card_type NOT NULL,
  intensity       intensity_level NOT NULL,
  audience        audience_mode NOT NULL DEFAULT 'both',

  -- conteúdo principal. Limite duro de 180 chars vem do doc 03.
  prompt          text NOT NULL,

  -- contexto adicional (ex: "grupo escolhe a legenda"). Opcional.
  secondary_text  text,

  -- só preenchido em dares cronometrados
  duration_sec    smallint,

  -- props universais: apenas 'celular' e 'voz' são seguros no MVP
  requires_props  text[] NOT NULL DEFAULT '{}',

  locale          text NOT NULL DEFAULT 'pt-BR',

  -- peso de sorteio: 0-200. Default 100 = peso normal.
  weight          smallint NOT NULL DEFAULT 100,

  -- cartas podem ser desativadas sem deletar (preserva histórico de sessões)
  is_active       boolean NOT NULL DEFAULT true,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cards_prompt_length
    CHECK (char_length(prompt) BETWEEN 1 AND 180),
  CONSTRAINT cards_weight_range
    CHECK (weight BETWEEN 0 AND 200),
  CONSTRAINT cards_duration_sane
    CHECK (duration_sec IS NULL OR (duration_sec BETWEEN 5 AND 120))
);

COMMENT ON TABLE cards IS
'Cartas jogáveis. Limite de 180 chars no prompt vem da diretriz editorial.';

-- Índice essencial: filtragem em draw_card
CREATE INDEX idx_cards_filters
  ON cards(deck_id, type, intensity, audience)
  WHERE is_active;

CREATE INDEX idx_cards_deck_active
  ON cards(deck_id)
  WHERE is_active;

-- -------------------------------------------------------------------------
-- CARD_TAGS
-- Relação N:N entre cartas e tags.
-- -------------------------------------------------------------------------
CREATE TABLE card_tags (
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

CREATE INDEX idx_card_tags_tag ON card_tags(tag_id);
