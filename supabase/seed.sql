-- =========================================================================
-- seed.sql — dados de DESENVOLVIMENTO
-- Rodar manualmente via: supabase db reset, ou psql direto.
-- NUNCA rodar em produção.
-- =========================================================================

-- 5 cartas de teste no deck 'leve'
WITH deck AS (SELECT id FROM decks WHERE slug = 'leve')
INSERT INTO cards (deck_id, type, intensity, audience, prompt, duration_sec)
SELECT deck.id, t.type, t.intensity, 'both', t.prompt, t.duration_sec
FROM deck, (VALUES
  ('truth'::card_type, 'soft'::intensity_level,
    'Qual foi o pior corte de cabelo que você já teve, e por quanto tempo manteve?', NULL::smallint),
  ('truth'::card_type, 'soft'::intensity_level,
    'Qual apelido você odeia mais?', NULL::smallint),
  ('dare'::card_type, 'soft'::intensity_level,
    'Imite um professor seu contando uma história empolgante por 20 segundos.', 20::smallint),
  ('dare'::card_type, 'medium'::intensity_level,
    'Imite o jeito de falar de alguém desta sala — o grupo adivinha quem em 30 segundos.', 30::smallint),
  ('truth'::card_type, 'medium'::intensity_level,
    'Qual foi a última mensagem que você apagou antes de mandar? Tenta lembrar.', NULL::smallint)
) AS t(type, intensity, prompt, duration_sec);

-- 3 cartas de teste no deck 'picante'
WITH deck AS (SELECT id FROM decks WHERE slug = 'picante')
INSERT INTO cards (deck_id, type, intensity, audience, prompt, duration_sec)
SELECT deck.id, t.type, 'spicy'::intensity_level, 'both', t.prompt, t.duration_sec
FROM deck, (VALUES
  ('truth'::card_type,
    'Qual foi a última vez que você sentiu tesão em situação socialmente inadequada?', NULL::smallint),
  ('dare'::card_type,
    'Descreva o tipo de beijo que você mais gosta, em detalhes, por 30 segundos.', 30::smallint),
  ('truth'::card_type,
    'Qual foi o DM mais constrangedor que você já enviou para um crush?', NULL::smallint)
) AS t(type, prompt, duration_sec);

-- 2 cartas de teste no deck 'beba'
WITH deck AS (SELECT id FROM decks WHERE slug = 'beba')
INSERT INTO cards (deck_id, type, intensity, audience, prompt, requires_props)
SELECT deck.id, 'party_action'::card_type, 'medium'::intensity_level, 'both', t.prompt, '{}'::text[]
FROM deck, (VALUES
  ('Brinde com a pessoa à sua esquerda pelo pior chefe que os dois já tiveram.'),
  ('Tome um gole se você chorou assistindo filme infantil nos últimos 6 meses.')
) AS t(prompt);

-- Associar cartas com tag 'drinking' quando no deck beba
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id
FROM cards c
JOIN decks d ON d.id = c.deck_id
JOIN tags t ON t.slug = 'drinking'
WHERE d.slug = 'beba'
ON CONFLICT DO NOTHING;
