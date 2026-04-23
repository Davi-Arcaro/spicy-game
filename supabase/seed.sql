-- =========================================================================
-- seed.sql — dados de DESENVOLVIMENTO
-- 35 cartas do lote piloto (doc 03), distribuídas em 3 decks e 7 tiers.
-- Rodar via: supabase db reset (aplica migrations + este seed automaticamente).
-- NUNCA rodar em produção.
-- =========================================================================

-- Limpa conteúdo de cards preexistente para garantir idempotência local.
DELETE FROM card_tags
  WHERE card_id IN (
    SELECT c.id FROM cards c
    JOIN decks d ON d.id = c.deck_id
    WHERE d.slug IN ('leve', 'picante', 'beba')
  );
DELETE FROM cards
  WHERE deck_id IN (SELECT id FROM decks WHERE slug IN ('leve', 'picante', 'beba'));

-- -------------------------------------------------------------------------
-- DECK "leve" — Truth Soft + Dare Soft + Truth Medium + Dare Medium (20 cartas)
-- -------------------------------------------------------------------------
WITH deck AS (SELECT id FROM decks WHERE slug = 'leve')
INSERT INTO cards (deck_id, type, intensity, audience, prompt, duration_sec, requires_props)
SELECT deck.id, t.type::card_type, t.intensity::intensity_level, 'both', t.prompt, t.duration_sec, t.props
FROM deck, (VALUES
  -- Truth Soft
  ('truth', 'soft',
    'Qual foi o pior corte de cabelo que você já teve, e por quanto tempo manteve?',
    NULL::smallint, '{}'::text[]),
  ('truth', 'soft',
    'Conte a comida mais estranha que você já fingiu gostar para não ofender alguém.',
    NULL, '{}'),
  ('truth', 'soft',
    'Qual programa de TV vergonhoso você assistia escondido quando era mais novo?',
    NULL, '{}'),
  ('truth', 'soft',
    'Quem é o professor que você mais odiou na escola e por quê? Pode ser sem nome.',
    NULL, '{}'),
  ('truth', 'soft',
    'Qual foi a desculpa mais ridícula que você deu para faltar em algo?',
    NULL, '{}'),

  -- Dare Soft
  ('dare', 'soft',
    'Imite um professor seu contando uma história empolgante por 20 segundos.',
    20, '{}'),
  ('dare', 'soft',
    'Cante o refrão da primeira música que vier na sua cabeça, com voz de apaixonado.',
    NULL, '{}'),
  ('dare', 'soft',
    'Faça uma dancinha de 10 segundos como se tivesse ganho na loteria.',
    10, '{}'),
  ('dare', 'soft',
    'Explique seu trabalho para uma criança de 5 anos imaginária em 30 segundos.',
    30, '{}'),
  ('dare', 'soft',
    'Imite 3 emojis diferentes com a sua cara — o grupo adivinha quais.',
    NULL, '{}'),

  -- Truth Medium
  ('truth', 'medium',
    'Conte um crush que você teve nos últimos 2 anos e nunca disse para essa pessoa.',
    NULL, '{}'),
  ('truth', 'medium',
    'Qual foi a última mensagem que você apagou antes de mandar? Tenta lembrar.',
    NULL, '{}'),
  ('truth', 'medium',
    'Qual foi a última mentira que você contou no trabalho esta semana?',
    NULL, '{}'),
  ('truth', 'medium',
    'Se pudesse dizer uma verdade para alguém desta sala sem consequência, quem e o quê?',
    NULL, '{}'),
  ('truth', 'medium',
    'Qual foi a última vez que você chorou, e por quê?',
    NULL, '{}'),

  -- Dare Medium
  ('dare', 'medium',
    'Mande áudio dramático para o primeiro contato não-familiar da sua lista, sobre seu dia.',
    NULL, ARRAY['celular']),
  ('dare', 'medium',
    'Mostre ao grupo o último meme que você salvou no celular.',
    NULL, ARRAY['celular']),
  ('dare', 'medium',
    'Imite o jeito de falar de alguém desta sala — o grupo adivinha quem em 30 segundos.',
    30, '{}'),
  ('dare', 'medium',
    'Poste um story com legenda misteriosa escolhida pelo grupo — pode apagar em 5 minutos.',
    NULL, ARRAY['celular']),
  ('dare', 'medium',
    'Assuma um nome de vilão de novela escolhido pelo grupo pelas próximas 3 rodadas.',
    NULL, '{}')
) AS t(type, intensity, prompt, duration_sec, props);

-- -------------------------------------------------------------------------
-- DECK "picante" — Truth Spicy + Dare Spicy (10 cartas)
-- -------------------------------------------------------------------------
WITH deck AS (SELECT id FROM decks WHERE slug = 'picante')
INSERT INTO cards (deck_id, type, intensity, audience, prompt, duration_sec, requires_props)
SELECT deck.id, t.type::card_type, 'spicy'::intensity_level, 'both', t.prompt, t.duration_sec, t.props
FROM deck, (VALUES
  -- Truth Spicy
  ('truth',
    'Qual foi a última vez que você sentiu tesão em situação socialmente inadequada?',
    NULL::smallint, '{}'::text[]),
  ('truth',
    'Se pudesse beijar alguém desta sala sem consequências, beijaria? Pode não dizer quem.',
    NULL, '{}'),
  ('truth',
    'Conte a fantasia mais estranha que você já teve — sem precisar de muitos detalhes.',
    NULL, '{}'),
  ('truth',
    'Qual foi o DM mais constrangedor que você já enviou para um crush?',
    NULL, '{}'),
  ('truth',
    'Qual foi a última curtida que você tirou às 3 da manhã, arrependido?',
    NULL, '{}'),

  -- Dare Spicy
  ('dare',
    'Descreva o tipo de beijo que você mais gosta, em detalhes, por 30 segundos.',
    30, '{}'),
  ('dare',
    'Mostre ao grupo o emoji mais sugestivo que mandou nas últimas 48 horas.',
    NULL, ARRAY['celular']),
  ('dare',
    'Faça uma serenata de 20 segundos para a pessoa à sua esquerda, como se estivesse apaixonado.',
    20, '{}'),
  ('dare',
    'Conte em 30 segundos sua melhor história de paquera mal-sucedida.',
    30, '{}'),
  ('dare',
    'Mande áudio cantado para um ex. Pode mandar para você mesmo se preferir.',
    NULL, ARRAY['celular'])
) AS t(type, prompt, duration_sec, props);

-- -------------------------------------------------------------------------
-- DECK "beba" — Party Action, cerimonial (5 cartas)
-- -------------------------------------------------------------------------
WITH deck AS (SELECT id FROM decks WHERE slug = 'beba')
INSERT INTO cards (deck_id, type, intensity, audience, prompt, duration_sec, requires_props)
SELECT deck.id, 'party_action'::card_type, 'medium'::intensity_level, 'both', t.prompt, NULL::smallint, '{}'::text[]
FROM deck, (VALUES
  ('Brinde com a pessoa à sua esquerda pelo pior chefe que os dois já tiveram.'),
  ('Tome um gole se você chorou assistindo filme infantil nos últimos 6 meses.'),
  ('Faça um brinde ao amigo mais atrasado do grupo que não está aqui agora.'),
  ('Tome um gole simbólico ao seu eu de 5 anos atrás. Ele estaria orgulhoso?'),
  ('Brinde com a pessoa mais perto a algo que você fez esta semana e ninguém sabe.')
) AS t(prompt);

-- =========================================================================
-- TAGS por carta (associação via prompt — chave textual é estável dentro deste seed)
-- =========================================================================
-- Helper: anexa tags a uma carta pelo prefixo do prompt. Em prod usaríamos slug;
-- aqui, como o seed é determinístico, casamos por prompt exato.

-- leve / Truth Soft
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi o pior corte de cabelo que você já teve, e por quanto tempo manteve?'
  AND t.slug IN ('vergonha', 'infancia')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Conte a comida mais estranha que você já fingiu gostar para não ofender alguém.'
  AND t.slug IN ('comida', 'vergonha')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual programa de TV vergonhoso você assistia escondido quando era mais novo?'
  AND t.slug IN ('infancia', 'vergonha')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Quem é o professor que você mais odiou na escola e por quê? Pode ser sem nome.'
  AND t.slug IN ('infancia', 'opiniao')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi a desculpa mais ridícula que você deu para faltar em algo?'
  AND t.slug IN ('trabalho', 'vergonha')
ON CONFLICT DO NOTHING;

-- leve / Dare Soft
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Imite um professor seu contando uma história empolgante por 20 segundos.'
  AND t.slug IN ('imitacao', 'voz')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Cante o refrão da primeira música que vier na sua cabeça, com voz de apaixonado.'
  AND t.slug IN ('voz', 'imitacao')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Faça uma dancinha de 10 segundos como se tivesse ganho na loteria.'
  AND t.slug IN ('fisico')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Explique seu trabalho para uma criança de 5 anos imaginária em 30 segundos.'
  AND t.slug IN ('trabalho', 'voz')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Imite 3 emojis diferentes com a sua cara — o grupo adivinha quais.'
  AND t.slug IN ('fisico', 'imitacao')
ON CONFLICT DO NOTHING;

-- leve / Truth Medium
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Conte um crush que você teve nos últimos 2 anos e nunca disse para essa pessoa.'
  AND t.slug IN ('relacionamentos')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi a última mensagem que você apagou antes de mandar? Tenta lembrar.'
  AND t.slug IN ('celular', 'vergonha')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi a última mentira que você contou no trabalho esta semana?'
  AND t.slug IN ('trabalho', 'vergonha')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Se pudesse dizer uma verdade para alguém desta sala sem consequência, quem e o quê?'
  AND t.slug IN ('relacionamentos', 'opiniao')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi a última vez que você chorou, e por quê?'
  AND t.slug IN ('vergonha')
ON CONFLICT DO NOTHING;

-- leve / Dare Medium
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Mande áudio dramático para o primeiro contato não-familiar da sua lista, sobre seu dia.'
  AND t.slug IN ('celular', 'voz')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Mostre ao grupo o último meme que você salvou no celular.'
  AND t.slug IN ('celular', 'redes-sociais')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Imite o jeito de falar de alguém desta sala — o grupo adivinha quem em 30 segundos.'
  AND t.slug IN ('imitacao', 'voz')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Poste um story com legenda misteriosa escolhida pelo grupo — pode apagar em 5 minutos.'
  AND t.slug IN ('redes-sociais')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Assuma um nome de vilão de novela escolhido pelo grupo pelas próximas 3 rodadas.'
  AND t.slug IN ('imitacao', 'voz')
ON CONFLICT DO NOTHING;

-- picante / Truth Spicy
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi a última vez que você sentiu tesão em situação socialmente inadequada?'
  AND t.slug IN ('relacionamentos', 'vergonha')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Se pudesse beijar alguém desta sala sem consequências, beijaria? Pode não dizer quem.'
  AND t.slug IN ('relacionamentos')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Conte a fantasia mais estranha que você já teve — sem precisar de muitos detalhes.'
  AND t.slug IN ('relacionamentos')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi o DM mais constrangedor que você já enviou para um crush?'
  AND t.slug IN ('relacionamentos', 'celular')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Qual foi a última curtida que você tirou às 3 da manhã, arrependido?'
  AND t.slug IN ('redes-sociais', 'relacionamentos')
ON CONFLICT DO NOTHING;

-- picante / Dare Spicy
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Descreva o tipo de beijo que você mais gosta, em detalhes, por 30 segundos.'
  AND t.slug IN ('relacionamentos', 'voz')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Mostre ao grupo o emoji mais sugestivo que mandou nas últimas 48 horas.'
  AND t.slug IN ('celular', 'relacionamentos')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Faça uma serenata de 20 segundos para a pessoa à sua esquerda, como se estivesse apaixonado.'
  AND t.slug IN ('voz', 'relacionamentos')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Conte em 30 segundos sua melhor história de paquera mal-sucedida.'
  AND t.slug IN ('relacionamentos', 'vergonha')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Mande áudio cantado para um ex. Pode mandar para você mesmo se preferir.'
  AND t.slug IN ('celular', 'relacionamentos', 'voz')
ON CONFLICT DO NOTHING;

-- beba — todas recebem tag drinking; algumas recebem tags adicionais
INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id
FROM cards c
JOIN decks d ON d.id = c.deck_id
JOIN tags t ON t.slug = 'drinking'
WHERE d.slug = 'beba'
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Brinde com a pessoa à sua esquerda pelo pior chefe que os dois já tiveram.'
  AND t.slug IN ('trabalho')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Tome um gole se você chorou assistindo filme infantil nos últimos 6 meses.'
  AND t.slug IN ('vergonha')
ON CONFLICT DO NOTHING;

INSERT INTO card_tags (card_id, tag_id)
SELECT c.id, t.id FROM cards c, tags t
WHERE c.prompt = 'Brinde com a pessoa mais perto a algo que você fez esta semana e ninguém sabe.'
  AND t.slug IN ('vergonha')
ON CONFLICT DO NOTHING;
