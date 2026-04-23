CREATE OR REPLACE FUNCTION create_room_with_host(
  p_code text,
  p_mode game_mode,
  p_intensity_max intensity_level,
  p_allowed_decks uuid[],
  p_blocked_tags uuid[],
  p_spin_type spin_type,
  p_show_scores boolean,
  p_user_id uuid,
  p_display_name text
)
RETURNS jsonb AS $$
DECLARE
  v_room rooms;
  v_player room_players;
BEGIN
  INSERT INTO rooms (
    code, mode, intensity_max, allowed_decks, blocked_tags,
    spin_type, show_scores, status
  )
  VALUES (
    p_code, p_mode, p_intensity_max, p_allowed_decks, p_blocked_tags,
    p_spin_type, p_show_scores, 'lobby'
  )
  RETURNING * INTO v_room;

  INSERT INTO room_players (
    room_id, user_id, display_name, is_host
  )
  VALUES (
    v_room.id, p_user_id, p_display_name, true
  )
  RETURNING * INTO v_player;

  UPDATE rooms
  SET host_player_id = v_player.id,
      turn_order = ARRAY[v_player.id]
  WHERE id = v_room.id
  RETURNING * INTO v_room;

  RETURN jsonb_build_object(
    'room', row_to_json(v_room),
    'player', row_to_json(v_player)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
