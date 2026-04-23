-- =========================================================================
-- rls_tests.sql — testes manuais de RLS
-- Rodar no SQL Editor do Supabase. Cada bloco simula um usuário diferente.
-- =========================================================================

-- ------ Setup: cria 2 usuários fake e 2 salas ------
-- Substitua os UUIDs abaixo por auth.users reais criados via Supabase Auth.
-- Em ambiente local pode usar: INSERT INTO auth.users(id, email, ...)

-- user_a tenta ler sala onde não é jogador (deve retornar 0 linhas)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user_a_uuid_aqui';

SELECT count(*) AS vazamento_de_sala_alheia
FROM rooms
WHERE id IN (SELECT id FROM rooms LIMIT 5);
-- ESPERADO: 0 (user_a não é jogador de nenhuma sala no teste)

-- user_a tenta ler cards de deck Free (deve retornar > 0)
SELECT count(*) AS cards_free_acessiveis
FROM cards c
JOIN decks d ON d.id = c.deck_id
WHERE d.is_free = true AND d.is_official = true;
-- ESPERADO: > 0

-- user_a tenta escrever em room_players sem estar na sala (deve falhar).
-- Inserção direta; edge function de join é quem deve fazer via service_role.
INSERT INTO room_players(room_id, user_id, display_name)
VALUES (
  (SELECT id FROM rooms LIMIT 1),
  'user_a_uuid_aqui',
  'Invasor'
);
-- ESPERADO: erro de RLS (new row violates policy)

RESET ROLE;
