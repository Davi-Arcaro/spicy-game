-- =========================================================================
-- 004 — Tabelas de sala (rooms, room_players, room_card_history, room_actions)
-- =========================================================================

-- -------------------------------------------------------------------------
-- ROOMS
-- Sessão de jogo. Código de 4 letras é a chave humana.
-- -------------------------------------------------------------------------
CREATE TABLE rooms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- código humano de entrada. 4 letras maiúsculas, gerado pela edge function.
  code            text NOT NULL,

  -- host inicial. FK virtual; não uso FK real aqui porque room_players
  -- depende de rooms, e FK circular complica.
  host_player_id  uuid,

  status          room_status NOT NULL DEFAULT 'lobby',
  mode            game_mode NOT NULL,

  -- configuração da sessão
  intensity_max   intensity_level NOT NULL DEFAULT 'medium',
  allowed_decks   uuid[] NOT NULL DEFAULT '{}',
  blocked_tags    uuid[] NOT NULL DEFAULT '{}',

  -- configuração de roleta (só relevante quando mode='roulette')
  spin_type       spin_type,
  last_spin_result jsonb,

  -- controle de turno
  turn_order      uuid[] NOT NULL DEFAULT '{}',
  turn_index      smallint NOT NULL DEFAULT 0,
  current_card_id uuid REFERENCES cards(id),
  current_player_id uuid,

  -- controle de pontuação
  show_scores     boolean NOT NULL DEFAULT false,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,

  -- sala expira sozinha. Edge function de cleanup usa isto.
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),

  CONSTRAINT rooms_code_format
    CHECK (code ~ '^[A-Z]{4}$'),
  CONSTRAINT rooms_turn_index_nonneg
    CHECK (turn_index >= 0)
);

COMMENT ON TABLE rooms IS
'Sessão ativa de jogo. Expira em 6h de inatividade.';

-- Unicidade só entre salas que ainda não terminaram.
CREATE UNIQUE INDEX idx_rooms_code_active
  ON rooms(code)
  WHERE status != 'ended';

CREATE INDEX idx_rooms_expires
  ON rooms(expires_at)
  WHERE status != 'ended';

-- -------------------------------------------------------------------------
-- ROOM_PLAYERS
-- -------------------------------------------------------------------------
CREATE TABLE room_players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,

  -- user_id referencia auth.users (pode ser anônimo). Sem FK direta — validação
  -- fica nas edge functions + RLS por convenção do Supabase.
  user_id       uuid NOT NULL,

  display_name  text NOT NULL,
  avatar_seed   text,
  is_host       boolean NOT NULL DEFAULT false,

  joined_at     timestamptz NOT NULL DEFAULT now(),
  left_at       timestamptz,

  CONSTRAINT room_players_display_name_length
    CHECK (char_length(display_name) BETWEEN 1 AND 32),

  UNIQUE (room_id, user_id)
);

COMMENT ON TABLE room_players IS
'Jogador na sala. left_at IS NULL = ainda está dentro.';

CREATE INDEX idx_room_players_active
  ON room_players(room_id)
  WHERE left_at IS NULL;

CREATE INDEX idx_room_players_user
  ON room_players(user_id);

-- -------------------------------------------------------------------------
-- ROOM_CARD_HISTORY
-- Toda carta jogada é registrada para anti-repetição e analytics.
-- -------------------------------------------------------------------------
CREATE TABLE room_card_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  card_id     uuid NOT NULL REFERENCES cards(id),
  player_id   uuid REFERENCES room_players(id),
  played_at   timestamptz NOT NULL DEFAULT now(),

  outcome     text,

  CONSTRAINT history_outcome_valid
    CHECK (outcome IS NULL OR outcome IN (
      'completed', 'refused', 'contested', 'skipped'
    ))
);

CREATE INDEX idx_history_room_recent
  ON room_card_history(room_id, played_at DESC);

-- -------------------------------------------------------------------------
-- ROOM_ACTIONS
-- Ações dos jogadores na rodada atual.
-- -------------------------------------------------------------------------
CREATE TABLE room_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id   uuid NOT NULL REFERENCES room_players(id) ON DELETE CASCADE,
  card_id     uuid REFERENCES cards(id),

  action_type text NOT NULL,
  payload     jsonb,

  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT actions_type_valid
    CHECK (action_type IN (
      'complete', 'refuse', 'contest', 'vote', 'answer', 'skip'
    ))
);

CREATE INDEX idx_actions_room_card
  ON room_actions(room_id, card_id, created_at DESC);
