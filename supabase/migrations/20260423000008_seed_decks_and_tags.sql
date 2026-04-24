-- =========================================================================
-- 008 — Seed de decks oficiais e tags
-- =========================================================================
-- Idempotente via ON CONFLICT. Seguro para rerun.

-- -------------------------------------------------------------------------
-- TAGS oficiais do MVP
-- -------------------------------------------------------------------------
INSERT INTO tags (slug, label, is_safe) VALUES
  ('relacionamentos',  'Relacionamentos', true),
  ('trabalho',         'Trabalho',        true),
  ('familia',          'Família',         true),
  ('infancia',         'Infância',        true),
  ('vergonha',         'Vergonha',        true),
  ('opiniao',          'Opinião',         true),
  ('fisico',           'Físico',          true),
  ('imitacao',         'Imitação',        true),
  ('celular',          'Celular',         true),
  ('redes-sociais',    'Redes sociais',   true),
  ('voz',              'Voz',             true),
  ('comida',           'Comida',          true),
  ('drinking',         'Bebida',          false)
ON CONFLICT (slug) DO UPDATE
  SET label = EXCLUDED.label,
      is_safe = EXCLUDED.is_safe;

-- -------------------------------------------------------------------------
-- DECKS oficiais do MVP
-- -------------------------------------------------------------------------
INSERT INTO decks (slug, name, description, is_free, is_official, requires_adult, min_players, max_players)
VALUES
  (
    'leve',
    'Leve',
    'Cartas para qualquer grupo. Soft e medium. Jantar em família com amigos ok.',
    true, true, false, 2, 12
  ),
  (
    'picante',
    'Picante',
    'Cartas mais ousadas. Apenas spicy. Amigos íntimos ou casais confiantes.',
    true, true, false, 2, 10
  ),
  (
    'beba',
    'Beba',
    'Deck cerimonial opcional. Brindes e goles simbólicos. Sem competição.',
    true, true, true, 3, 12
  )
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      requires_adult = EXCLUDED.requires_adult;
