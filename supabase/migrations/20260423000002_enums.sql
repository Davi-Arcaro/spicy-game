-- =========================================================================
-- 002 — Tipos enumerados
-- =========================================================================
-- Enums ficam isolados porque alterar enum em Postgres é doloroso.
-- Trate esta migration como quase-imutável. Adicionar valores OK;
-- remover ou renomear requer manobra.

-- Tipo de carta jogável. Controla qual fluxo de UI é ativado.
CREATE TYPE card_type AS ENUM (
  'question',        -- P&R clássico (futuro)
  'truth',           -- Verdade
  'dare',            -- Desafio
  'couple_prompt',   -- Modo casal (futuro)
  'party_action',    -- Ação coletiva ou cerimonial (Beba usa isto)
  'vote',            -- "Quem é mais provável..." (futuro)
  'never_have_i'     -- Eu nunca (futuro)
);

-- Escala de intensidade. SPICY é o teto do MVP; EXTREME fica preparado.
-- IMPORTANTE: ordem de criação determina ordem de comparação (<=, >=).
-- Não reordene nem insira valores no meio — quebra draw_next_card.
CREATE TYPE intensity_level AS ENUM (
  'soft',
  'medium',
  'spicy',
  'extreme'
);

-- Compatibilidade da carta com a dinâmica social alvo.
-- 'both' = serve em qualquer modo. 'couple'/'group' = específicos.
CREATE TYPE audience_mode AS ENUM (
  'couple',
  'group',
  'both'
);

-- Estado de uma sala ao longo da sessão.
CREATE TYPE room_status AS ENUM (
  'lobby',    -- jogadores entrando, jogo não começou
  'playing',  -- em rodada ativa
  'paused',   -- host pausou (raro no MVP)
  'ended'     -- encerrada manual, por inatividade, ou expirada
);

-- Modo de jogo selecionado pela sala. MVP usa 'roulette' e 'truth_dare'.
CREATE TYPE game_mode AS ENUM (
  'roulette',
  'couple',
  'group',
  'qa',
  'truth_dare'
);

-- Tipo de roleta (só aplicável quando mode = 'roulette').
CREATE TYPE spin_type AS ENUM (
  'mode_spin',       -- sorteia verdade/desafio/etc
  'player_spin',     -- sorteia quem joga agora
  'intensity_spin',  -- fase 2
  'category_spin'    -- fase 2
);
