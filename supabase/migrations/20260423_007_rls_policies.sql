-- =========================================================================
-- 007 — Row Level Security
-- =========================================================================
-- Regra de ouro: RLS em TODAS as tabelas. Mesmo 'públicas' têm RLS
-- com policies permissivas — evita regressão silenciosa se alguém
-- adicionar coluna sensível depois.

ALTER TABLE decks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_card_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_actions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deck_entitlements ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- DECKS
-- -------------------------------------------------------------------------
CREATE POLICY decks_read_public ON decks
  FOR SELECT USING (is_official = true);

-- -------------------------------------------------------------------------
-- TAGS
-- -------------------------------------------------------------------------
CREATE POLICY tags_read ON tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- -------------------------------------------------------------------------
-- CARDS: lê se deck é grátis OU se tem entitlement
-- -------------------------------------------------------------------------
CREATE POLICY cards_read ON cards
  FOR SELECT USING (
    is_active
    AND (
      EXISTS (
        SELECT 1 FROM decks d
        WHERE d.id = cards.deck_id
          AND d.is_official = true
          AND d.is_free = true
      )
      OR EXISTS (
        SELECT 1 FROM user_deck_entitlements e
        WHERE e.deck_id = cards.deck_id
          AND e.user_id = auth.uid()
      )
    )
  );

-- -------------------------------------------------------------------------
-- CARD_TAGS
-- -------------------------------------------------------------------------
CREATE POLICY card_tags_read ON card_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cards c
      WHERE c.id = card_tags.card_id
        AND c.is_active
    )
  );

-- -------------------------------------------------------------------------
-- ROOMS
-- -------------------------------------------------------------------------
CREATE POLICY rooms_read ON rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_players rp
      WHERE rp.room_id = rooms.id
        AND rp.user_id = auth.uid()
        AND rp.left_at IS NULL
    )
  );

CREATE POLICY rooms_update_host ON rooms
  FOR UPDATE USING (
    host_player_id IN (
      SELECT id FROM room_players
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- -------------------------------------------------------------------------
-- ROOM_PLAYERS
-- -------------------------------------------------------------------------
CREATE POLICY room_players_read ON room_players
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room_players
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  );

CREATE POLICY room_players_update_self ON room_players
  FOR UPDATE USING (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- ROOM_CARD_HISTORY
-- -------------------------------------------------------------------------
CREATE POLICY history_read ON room_card_history
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room_players
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- -------------------------------------------------------------------------
-- ROOM_ACTIONS
-- -------------------------------------------------------------------------
CREATE POLICY actions_read ON room_actions
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room_players
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY actions_insert_self ON room_actions
  FOR INSERT WITH CHECK (
    player_id IN (
      SELECT id FROM room_players
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- -------------------------------------------------------------------------
-- PLAYER_PROFILES
-- -------------------------------------------------------------------------
CREATE POLICY profiles_read_self ON player_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY profiles_upsert_self ON player_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update_self ON player_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- USER_DECK_ENTITLEMENTS
-- -------------------------------------------------------------------------
CREATE POLICY entitlements_read_self ON user_deck_entitlements
  FOR SELECT USING (user_id = auth.uid());
