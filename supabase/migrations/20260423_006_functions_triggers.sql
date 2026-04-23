-- =========================================================================
-- 006 — Funções auxiliares e triggers
-- =========================================================================

-- -------------------------------------------------------------------------
-- Trigger genérico de updated_at
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decks_updated
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cards_updated
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rooms_updated
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------------------------
-- Cleanup de salas expiradas
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS integer AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE rooms
  SET status = 'ended', ended_at = now()
  WHERE status != 'ended'
    AND expires_at < now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_rooms() IS
'Encerra salas com expires_at passado. Retorna quantas foram encerradas.';

-- -------------------------------------------------------------------------
-- Sorteio de carta
-- Implementa filtro + anti-repetição + pesos descritos no doc 01.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION draw_next_card(
  p_room_id        uuid,
  p_card_type      card_type DEFAULT NULL,
  p_recent_limit   integer DEFAULT 30
)
RETURNS TABLE (
  id             uuid,
  prompt         text,
  secondary_text text,
  type           card_type,
  intensity      intensity_level,
  duration_sec   smallint,
  requires_props text[]
) AS $$
DECLARE
  v_allowed_decks uuid[];
  v_blocked_tags  uuid[];
  v_intensity_max intensity_level;
  v_audience      audience_mode;
BEGIN
  SELECT allowed_decks, blocked_tags, intensity_max,
    CASE mode
      WHEN 'couple' THEN 'couple'::audience_mode
      WHEN 'group'  THEN 'group'::audience_mode
      ELSE 'both'::audience_mode
    END
  INTO v_allowed_decks, v_blocked_tags, v_intensity_max, v_audience
  FROM rooms
  WHERE rooms.id = p_room_id;

  IF v_allowed_decks IS NULL OR array_length(v_allowed_decks, 1) = 0 THEN
    RAISE EXCEPTION 'Sala % sem decks habilitados', p_room_id;
  END IF;

  RETURN QUERY
  WITH recent AS (
    SELECT card_id
    FROM room_card_history
    WHERE room_id = p_room_id
    ORDER BY played_at DESC
    LIMIT p_recent_limit
  )
  SELECT
    c.id, c.prompt, c.secondary_text, c.type,
    c.intensity, c.duration_sec, c.requires_props
  FROM cards c
  WHERE c.is_active
    AND c.deck_id = ANY(v_allowed_decks)
    AND c.intensity <= v_intensity_max
    AND c.audience IN ('both', v_audience)
    AND (p_card_type IS NULL OR c.type = p_card_type)
    AND c.id NOT IN (SELECT card_id FROM recent)
    AND NOT EXISTS (
      SELECT 1 FROM card_tags ct
      WHERE ct.card_id = c.id AND ct.tag_id = ANY(v_blocked_tags)
    )
  ORDER BY random() * (c.weight::float / 100.0) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION draw_next_card(uuid, card_type, integer) IS
'Sorteia próxima carta respeitando filtros da sala e anti-repetição.';
