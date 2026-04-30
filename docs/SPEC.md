# Spicy Game — Especificação completa do projeto

> **Para uso com IAs assistentes (Claude, GPT-4, Gemini, etc.).** Este documento é auto-contido: cole-o como contexto e a IA terá tudo que precisa para colaborar na construção do site. Não há referências externas obrigatórias.

> **Última atualização:** abril/2026.
> **Idioma do produto:** português brasileiro (`pt-BR`).
> **Status:** especificação. O backend está pronto; o cliente web ainda não foi escrito.

---

## Sumário

1. [Visão e identidade](#1-visão-e-identidade)
2. [Mudança de direção: de app mobile para site web](#2-mudança-de-direção-de-app-mobile-para-site-web)
3. [Estado atual do repositório](#3-estado-atual-do-repositório)
4. [Stack recomendada para o site](#4-stack-recomendada-para-o-site)
5. [Arquitetura geral](#5-arquitetura-geral)
6. [Schema do banco de dados](#6-schema-do-banco-de-dados)
7. [Edge Functions — contratos completos](#7-edge-functions--contratos-completos)
8. [Autenticação e sessão](#8-autenticação-e-sessão)
9. [Realtime — sincronização multiplayer](#9-realtime--sincronização-multiplayer)
10. [Fluxos de gameplay detalhados](#10-fluxos-de-gameplay-detalhados)
11. [Mapa de páginas / rotas web](#11-mapa-de-páginas--rotas-web)
12. [Estrutura de pastas proposta](#12-estrutura-de-pastas-proposta)
13. [Componentes e estado do cliente](#13-componentes-e-estado-do-cliente)
14. [Reaproveitamento do código mobile existente](#14-reaproveitamento-do-código-mobile-existente)
15. [Features novas exigidas pela versão web](#15-features-novas-exigidas-pela-versão-web)
16. [Deploy: Vercel + Supabase](#16-deploy-vercel--supabase)
17. [Observabilidade e features de produção](#17-observabilidade-e-features-de-produção)
18. [Roadmap de implementação por fases](#18-roadmap-de-implementação-por-fases)
19. [Convenções de código e qualidade](#19-convenções-de-código-e-qualidade)
20. [Como usar este documento com outras IAs](#20-como-usar-este-documento-com-outras-ias)

---

## 1. Visão e identidade

**Spicy Game** é um jogo de **festa multiplayer** entre amigos. Mistura mecânicas clássicas de **verdade ou desafio**, **roleta**, **eu nunca**, **vote em alguém**, **perguntas e respostas** e **prendas em grupo**, organizadas em decks com gradação de intensidade (de leve a picante). É pensado para um grupo presencialmente reunido, com cada pessoa em seu próprio dispositivo, conectados a uma **sala** identificada por um **código de 4 letras**.

Personalidade do produto: **direto**, **adulto sem ser obsceno**, **rápido**, **sem fricção**. Sem cadastro de e-mail, sem login social. Você cai na home, escolhe um nome de exibição, cria uma sala (vira host) ou entra com um código (vira convidado).

Cores e clima:

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#0C0906` | Fundo principal — quase preto, levemente quente |
| `--bg-elev` | `#1A140E` | Cards, modais, surfaces elevadas |
| `--accent` | `#E94F37` | Botões primários, destaques, "spicy" |
| `--accent-soft` | `#F79E89` | Hover, estados secundários |
| `--text` | `#F5EFE6` | Texto principal sobre fundo escuro |
| `--muted` | `#B5A79A` | Texto secundário, descrições |

(Os tokens vêm do tema mobile em `apps/mobile/src/theme/`.)

**Público:** 18+ por padrão (intensidade `spicy` e `extreme`); existe flag `is_adult` no perfil que destrava decks `requires_adult = true`.

---

## 2. Mudança de direção: de app mobile para site web

### O que era

Inicialmente o projeto foi pensado como **app mobile** (Expo / React Native) com backend em Supabase. O backend e a maior parte da lógica já existem no repositório.

### O que vai ser

**Site web 100%.** Sem app mobile. Sem APK. Sem TestFlight. O jogo inteiro roda no navegador — desktop e mobile (responsive). O backend Supabase é mantido tal como está.

### Por que essa virada faz sentido

- **Distribuição zero-fricção:** o usuário compartilha um link (`https://spicy-game.vercel.app/r/AAAA`) e a galera entra direto. Sem download, sem permissão, sem loja.
- **Custo zero:** Vercel Hobby + Supabase Free cobrem o tráfego inicial. EAS, Apple Developer, Play Store deixam de ser necessários.
- **Iteração mais rápida:** uma mudança = um `git push` = deploy automático em produção. Sem OTA, sem rebuild, sem versionamento de APK.
- **Mobile-first responsive:** o mesmo site funciona no celular do amigo via QR code e cobre o caso de uso original.

### O que muda concretamente

| Antes (app) | Agora (site) |
|---|---|
| `apps/mobile/` | **descontinuar** (mantém referência histórica, mas não evolui mais) |
| Expo, React Native, EAS, OTA | Next.js 15 + React 19 |
| AsyncStorage | `localStorage` + cookies HTTP-only quando precisar |
| React Navigation native-stack | App Router do Next (rotas baseadas em pastas) |
| Polling/manual refetch | **Supabase Realtime** (essencial — multiplayer no web) |
| APK distribuído | URL pública |
| Deep linking `spicy://` | URLs HTTPS (`/r/<code>`) |

---

## 3. Estado atual do repositório

### Topologia

```
spicy-game/
├── apps/
│   └── mobile/              # legado — não evolui mais
├── packages/
│   └── shared/
│       └── src/schemas.ts   # Zod schemas — REUSAR no web
├── supabase/
│   ├── config.toml
│   ├── seed.sql             # decks + cartas
│   ├── migrations/          # 10 migrations versionadas — PRONTAS
│   ├── functions/           # 10 Edge Functions Deno — PRONTAS
│   │   ├── _shared/         # auth, client, contracts, cors, errors, handler, idempotency, mappers
│   │   ├── advance_turn/
│   │   ├── create_room/
│   │   ├── draw_card/
│   │   ├── join_room/
│   │   ├── leave_room/
│   │   ├── list_decks/
│   │   ├── spin_roulette/
│   │   ├── start_game/
│   │   ├── submit_action/
│   │   └── update_profile/
│   └── tests/
├── docs/
│   ├── SPEC.md              # ← este documento
│   └── pipeline/            # plano antigo (mobile + landing) — ignorar/atualizar
├── README.md
├── SETUP.md                 # como rodar dev (Bun + Expo + Supabase local)
├── bun.lock
├── package.json             # bun workspaces
└── tsconfig.json
```

### Projeto Supabase hospedado

- **Project URL:** `https://fuhjywhulyojxpiphakv.supabase.co`
- **Project Ref:** `fuhjywhulyojxpiphakv`
- **Publishable (anon) Key:** `sb_publishable_OQnaMXHfhyQ9phhbI_y1nw_8AeJ1ASv`
- **Região:** `sa-east-1` (São Paulo)

> Migrations e funções **estão no repositório** mas **podem ainda não ter sido aplicadas** no projeto hospedado. Antes de qualquer deploy do site, rodar `supabase db push` e `supabase functions deploy` (ver §16).

### O que NÃO existe ainda

- Site web (`apps/web/`) — a ser criado.
- Realtime subscriptions — backend está pronto para suportar via `postgres_changes` ou `broadcast`, mas o cliente precisa implementar.
- Páginas legais (privacidade, termos, suporte).
- CI/CD.
- Observabilidade (Sentry, PostHog).
- Páginas administrativas (curadoria de decks/cartas).

---

## 4. Stack recomendada para o site

### Núcleo
- **Next.js 15** (App Router, RSC, Route Handlers).
- **React 19**.
- **TypeScript** (strict mode).
- **Tailwind CSS 4** + variáveis CSS para os tokens.
- **Bun** como runtime/manager (já é o padrão do monorepo).

### Cliente Supabase
- `@supabase/supabase-js` v2.45+ — SDK oficial.
- `@supabase/ssr` — para auth em Server Components / Route Handlers do Next.

### Estado e dados
- **TanStack Query (React Query) v5** — cache de queries do Supabase, refetch on focus, retry inteligente.
- **Zustand** — estado global leve (perfil do usuário, conexão Realtime ativa). Evitar Redux.
- **Zod** — validação de payloads (já existe em `packages/shared`).

### UI
- **Componentes acessíveis:** Radix UI primitives (Dialog, Toast, DropdownMenu, Tabs, Popover, AlertDialog).
- **Animações:** Framer Motion (transições de cartas, roleta).
- **Ícones:** Lucide React (já usado no mobile como `lucide-react-native`; troca direta).

### Outros
- **next-themes** — dark mode (default dark, mas pronto para light).
- **react-hot-toast** ou Radix Toast — feedback rápido.
- **clsx** + **tailwind-merge** — composição de classes.
- **nanoid** — IDs locais (idempotency keys etc.).

### Sem necessidade
- ❌ React Native, Expo, EAS — descartar.
- ❌ React Native Web — não tentar reusar via essa rota; gera mais atrito que valor.
- ❌ tRPC — Edge Functions já são o RPC de fato.
- ❌ Prisma — usamos o cliente Supabase direto.

---

## 5. Arquitetura geral

```
┌───────────────────────────────────────────────────────────────┐
│ Browser (jogador)                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Next.js App Router (apps/web)                           │  │
│  │  • Server Components: páginas estáticas, /privacy, /    │  │
│  │  • Client Components: tudo que envolve sala (realtime)  │  │
│  │  • Route Handlers: /api/health, /download (opcional)    │  │
│  └────────────┬────────────────────────────┬──────────────-┘  │
│               │ supabase-js                │ realtime ws       │
└───────────────┼────────────────────────────┼──────────────────┘
                │                            │
                │ HTTPS                      │ WebSocket
                ▼                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Supabase (sa-east-1)                                          │
│  ┌──────────────┐   ┌──────────────────┐   ┌───────────────┐  │
│  │ Postgres 17  │   │ Edge Functions   │   │ Realtime      │  │
│  │ (RLS ativa)  │◀──│ (Deno, 10 fns)   │   │ (postgres_ch) │  │
│  └──────────────┘   └──────────────────┘   └───────────────┘  │
│  ┌──────────────┐   ┌──────────────────┐                      │
│  │ Auth         │   │ Storage          │ (não usado no MVP)   │
│  │ (anonymous)  │   │                  │                      │
│  └──────────────┘   └──────────────────┘                      │
└───────────────────────────────────────────────────────────────┘
                ▲
                │ supabase CLI (deploy)
┌───────────────┴───────────────────────────────────────────────┐
│ GitHub Actions (CI/CD opcional)                               │
└───────────────────────────────────────────────────────────────┘
                ▲
                │ git push
┌───────────────┴───────────────────────────────────────────────┐
│ Vercel (apps/web)                                             │
│  • Auto-deploy do main branch                                 │
│  • Preview deploys por PR                                     │
└───────────────────────────────────────────────────────────────┘
```

### Princípios

1. **Edge Function = mutação. Read = query direta com RLS.** Mutações de estado de jogo (criar sala, sortear carta, avançar turno) passam por edge functions porque exigem regras de negócio com `service_role` controlado. Leituras simples (lista de decks, dados da sala) podem usar `supabase-js` direto, com RLS garantindo segurança.
2. **Realtime para mudanças de sala.** Quando o host inicia o jogo, todos os clientes precisam reagir em <1s. Usar `supabase.channel('room:<id>').on('postgres_changes', ...)`.
3. **Cliente fino.** Lógica complexa fica nas edge functions. O front faz UI + fetch + realtime sub + otimismo opcional.
4. **Server Components onde fizer sentido.** Páginas estáticas (privacy, about, home antes do perfil) podem ser RSC. Tudo dentro de `/r/<code>` é client por causa do realtime.

---

## 6. Schema do banco de dados

10 migrations já versionadas em `supabase/migrations/` cobrem o schema completo. Resumo abaixo (autoritativo: o SQL).

### 6.1 Enums (migration 02)

| Enum | Valores | Notas |
|---|---|---|
| `card_type` | `question`, `truth`, `dare`, `couple_prompt`, `party_action`, `vote`, `never_have_i` | MVP usa `truth`, `dare`, `party_action`. Outros são futuro. |
| `intensity_level` | `soft`, `medium`, `spicy`, `extreme` | Ordem importa para comparações `<=`. **Nunca reordene.** |
| `audience_mode` | `couple`, `group`, `both` | Casamento de carta com modo da sala. |
| `room_status` | `lobby`, `playing`, `paused`, `ended` | Transições controladas pelas edge functions. |
| `game_mode` | `roulette`, `couple`, `group`, `qa`, `truth_dare` | MVP: `roulette` e `truth_dare`. |
| `spin_type` | `mode_spin`, `player_spin`, `intensity_spin`, `category_spin` | Só relevante quando `mode = 'roulette'`. |

### 6.2 Tabelas de conteúdo (migration 03)

**`decks`** — containers curados de cartas.
- `id uuid pk`, `slug text unique` (regex `^[a-z0-9]+(-[a-z0-9]+)*$`), `name`, `description`, `cover_url`.
- `is_free bool default true`, `is_official bool default true`, `requires_adult bool default false`.
- `min_players smallint default 2`, `max_players smallint default 12`, `locale text default 'pt-BR'`.
- MVP traz três decks no seed: `leve`, `picante`, `beba`.

**`tags`** — taxonomia transversal.
- `id uuid pk`, `slug unique`, `label`, `is_safe bool default true`.

**`cards`** — unidade jogável.
- `id`, `deck_id`, `type card_type`, `intensity intensity_level`, `audience audience_mode default 'both'`.
- `prompt text` (1–180 chars, **limite duro**), `secondary_text text` opcional.
- `duration_sec smallint` (5–120, só para `dare` cronometrado), `requires_props text[]` (no MVP só `'celular'` e `'voz'`).
- `weight smallint default 100` (0–200) para sorteio ponderado, `is_active bool default true`.
- Index principal: `(deck_id, type, intensity, audience) WHERE is_active`.

**`card_tags`** — relação N:N.

### 6.3 Tabelas de sala (migration 04)

**`rooms`**
- `id`, `code text` (regex `^[A-Z]{4}$`), `host_player_id uuid` (FK virtual em `room_players`).
- `status room_status default 'lobby'`, `mode game_mode`.
- `intensity_max default 'medium'`, `allowed_decks uuid[]`, `blocked_tags uuid[]`.
- `spin_type` opcional, `last_spin_result jsonb`.
- `turn_order uuid[]`, `turn_index smallint default 0`, `current_card_id`, `current_player_id`.
- `show_scores bool default false`.
- `created_at`, `updated_at`, `ended_at`, `expires_at default now() + 6h`.
- **Unicidade do código** só entre salas não-encerradas: `UNIQUE INDEX (code) WHERE status != 'ended'`.

**`room_players`**
- `id`, `room_id`, `user_id` (sem FK direta para `auth.users`), `display_name` (1–32), `avatar_seed`, `is_host bool`.
- `joined_at`, `left_at` (NULL = ainda dentro).
- Index ativo: `(room_id) WHERE left_at IS NULL`.

**`room_card_history`** — toda carta jogada é registrada.
- `id`, `room_id`, `card_id`, `player_id`, `played_at`, `outcome text` (`completed|refused|contested|skipped`).
- Index: `(room_id, played_at DESC)`.

**`room_actions`** — ações da rodada atual.
- `id`, `room_id`, `player_id`, `card_id`, `action_type` (`complete|refuse|contest|vote|answer|skip`), `payload jsonb`, `created_at`.

### 6.4 Perfis (migration 05)

**`player_profiles`** — perfil persistente do `user_id` (anônimo).
- `display_name`, `avatar_seed`, `is_adult bool default false`, `locale`, `created_at`, `updated_at`.

### 6.5 Funções, triggers, RLS, seeds, idempotência, RPCs (migrations 06–10)

- Migration 06: triggers de `updated_at` automático, função `generate_room_code()`, função `draw_next_card()` com seleção ponderada e anti-repetição.
- Migration 07: **RLS habilitada em todas as tabelas públicas**. Policies garantem que jogador só lê dados de sala onde está, etc. **Não desabilite RLS sem entender o que está fazendo.**
- Migration 08: seed inicial de decks oficiais e tags-base.
- Migration 09: tabela `idempotency_keys` para evitar duplicação em retries (chave por `user_id + endpoint + key`).
- Migration 10: RPCs PostgreSQL invocáveis via `supabase.rpc(...)` para operações atômicas de sala.

---

## 7. Edge Functions — contratos completos

Todas as 10 functions ficam em `supabase/functions/<nome>/index.ts` e seguem o **envelope padrão**:

```ts
// Sucesso
{ data: <T>, error: null }
// Falha
{ data: null, error: { code: string, message: string, details?: unknown } }
```

O cliente (`@spicy-game/shared` Zod schemas) valida payload **antes** de invocar. As funções fazem validação de novo no servidor (defense-in-depth).

Helpers compartilhados em `supabase/functions/_shared/`:
- `auth.ts` — extrai `userId` da JWT.
- `client.ts` — cliente service-role para queries que ignoram RLS.
- `contracts.ts` — schemas Zod inline (cópia do shared, exigência do Deno runtime).
- `cors.ts` — headers CORS (importante para o web! revisar §16).
- `errors.ts` — `ApiError` e códigos.
- `handler.ts` — wrapper que padroniza envelope + try/catch + logging.
- `idempotency.ts` — checagem de `idempotency_keys`.
- `mappers.ts` — converte rows do DB para shapes públicos.

### 7.1 `list_decks`

**Input:** `{}`.
**Output:**
```ts
{ decks: PublicDeck[] }
PublicDeck = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  requiresAdult: boolean;
  minPlayers: number;
  maxPlayers: number;
  cardCount: number;
}
```
Lê apenas decks `is_official AND is_free`. Filtro por `requires_adult` é client-side (depende do flag do perfil).

### 7.2 `update_profile`

**Input:**
```ts
{
  displayName?: string;   // 1..32
  avatarSeed?: string;
  isAdult?: boolean;
  locale?: string;
}
```
**Output:** `{ updated: true }`.
Upsert em `player_profiles` pelo `user_id` da JWT.

### 7.3 `create_room`

**Input:**
```ts
{
  displayName: string;        // 1..32
  mode: 'roulette' | 'couple' | 'group' | 'qa' | 'truth_dare';
  intensityMax: 'soft' | 'medium' | 'spicy' | 'extreme';
  allowedDecks: string[];     // ≥1 deck slug
  blockedTags?: string[];
  spinType?: 'mode_spin' | 'player_spin' | 'intensity_spin' | 'category_spin';
  showScores?: boolean;
  isAdult?: boolean;
  idempotencyKey?: string;    // uuid
}
```
**Output:**
```ts
{
  room: PublicRoom;
  player: PublicPlayer;
  accessToken?: string;
}
```
Cria sala com `status='lobby'`, gera código de 4 letras único, insere o host como primeiro `room_players` com `is_host=true`, atualiza `host_player_id`. Retorna o estado já consistente.

### 7.4 `join_room`

**Input:**
```ts
{
  code: string;          // 4 letters, case-insensitive (uppercased no servidor)
  displayName: string;   // 1..32
  avatarSeed?: string;
  isAdult?: boolean;
  idempotencyKey?: string;
}
```
**Output:**
```ts
{
  room: PublicRoom;
  player: PublicPlayer;
  allPlayers: PublicPlayer[];
  currentCard: PublicCard | null;
  accessToken?: string;
}
```
Valida que sala existe e `status != 'ended'`. Insere `room_players` (ou reativa se `user_id` já existia com `left_at != NULL`). **Idempotente:** mesmo `user_id` chamando duas vezes retorna o mesmo player.

### 7.5 `leave_room`

**Input:** `{ roomId: string }`.
**Output:** `{ roomId: string; newHostId: string | null }`.
Marca `left_at = now()`. Se era host, transfere para o jogador mais antigo ainda ativo (ou encerra a sala se sobrou ninguém).

### 7.6 `start_game`

**Input:** `{ roomId: string; shuffleTurnOrder?: boolean }`.
**Output:**
```ts
{
  room: PublicRoom | null;
  firstPlayer: PublicPlayer | null;
  firstCard: PublicCard | null;
}
```
**Só o host pode chamar.** Transiciona `status: 'lobby' → 'playing'`, define `turn_order` (shuffle por padrão) e `turn_index = 0`. Sorteia primeira carta via RPC `draw_next_card`.

### 7.7 `draw_card`

**Input:**
```ts
{
  roomId: string;
  cardTypeFilter?: 'question' | 'truth' | 'dare' | 'couple_prompt' | 'party_action' | 'vote' | 'never_have_i';
}
```
**Output:**
```ts
{
  card: PublicCard;
  playerToAct: PublicPlayer | null;
  cardHistoryId: string | null;
}
```
Sorteio ponderado com anti-repetição (não tira a mesma carta no mesmo room nas últimas N tiradas). Atualiza `current_card_id`. Insere row em `room_card_history` (sem `outcome` ainda).

### 7.8 `spin_roulette`

**Input:** `{ roomId: string }`.
**Output:**
```ts
{
  outcome:
    | { kind: 'card_type'; cardType: 'truth' | 'dare' }
    | { kind: 'player_choice' }
    | { kind: 'skip' }
    | { kind: 'player'; playerId: string };
  animationSeed: string;   // determinístico — todos os clientes animam igual
  durationMs: number;      // ex: 3000
  resolvedCard: PublicCard | null;
}
```
Resolve sorteio de roleta no servidor para evitar trapaça. `animationSeed` permite que todos os clientes mostrem a mesma animação ao reproduzir via Realtime.

### 7.9 `submit_action`

**Input:**
```ts
{
  roomId: string;
  actionType: 'complete' | 'refuse' | 'contest' | 'vote' | 'answer' | 'skip';
  payload?: unknown;       // depende do actionType (vote tem playerId, answer tem texto, etc.)
}
```
**Output:**
```ts
{
  actionId: string;
  turnAdvanced: boolean;
  nextPlayer: PublicPlayer | null;
  penalty: PublicCard | null;   // não-nulo quando actionType='refuse' e regra aplica prenda
}
```
Insere `room_actions`, atualiza `outcome` da última `room_card_history`. Pode avançar turno automaticamente (no `truth_dare`, sim; em modos com vote, só após N votos).

### 7.10 `advance_turn`

**Input:**
```ts
{
  roomId: string;
  reason?: 'manual' | 'timeout';
}
```
**Output:** `{ room: PublicRoom | null; nextPlayer: PublicPlayer | null }`.
Move `turn_index = (turn_index + 1) % turn_order.length`. Atualiza `current_player_id`. Limpa `current_card_id`.

### Códigos de erro padronizados

| Code | Significado |
|---|---|
| `CLIENT_VALIDATION` | Payload inválido detectado pelo Zod no cliente. |
| `NETWORK_ERROR` | Falha de transporte (fetch). |
| `EMPTY_RESPONSE` / `EMPTY_DATA` | Função retornou shape inesperado. |
| `UNAUTHORIZED` | JWT ausente ou inválida. |
| `FORBIDDEN` | Usuário autenticado mas sem permissão (ex: convidado tentando `start_game`). |
| `ROOM_NOT_FOUND`, `ROOM_ENDED`, `ROOM_FULL` | Estados de sala. |
| `INVALID_CODE` | Código de 4 letras inválido. |
| `DUPLICATE_REQUEST` | Idempotency key já consumida. |
| `RATE_LIMITED` | Excedeu limite (a definir caso aplique). |

---

## 8. Autenticação e sessão

### Modelo

**Auth anônima** do Supabase. Usuário nunca digita e-mail/senha. No primeiro carregamento do site:

```ts
const { data } = await supabase.auth.getSession();
if (!data.session) {
  await supabase.auth.signInAnonymously();
}
```

Isso cria uma `auth.users` row com `is_anonymous = true`. A sessão JWT vai automaticamente em todas as chamadas a edge functions e queries.

### Persistência

- SDK do Supabase usa `localStorage` por padrão na web. Sessão sobrevive a refreshes.
- **Importante:** `localStorage` é **per-origem**. Se você usar custom domain depois, sessões na URL antiga continuam vivas no Vercel domain (não migra).

### Considerações server-side (Next.js)

- Em **Server Components / Route Handlers**, use `@supabase/ssr` para ler a sessão de cookies. Configure middleware do Next para refresh automático.
- Páginas que **dependem do estado da sala** devem ser **Client Components** — Realtime exige WebSocket, que só roda no browser.

### Display name e perfil

Independente de auth, o jogador escolhe um **display_name** no `/onboarding`. Ele é guardado em `player_profiles` via `update_profile`. O `display_name` é o que aparece para os outros — `user_id` jamais é exposto.

---

## 9. Realtime — sincronização multiplayer

**Crítico para a versão web.** Sem realtime, o jogo não funciona: o convidado não saberia quando o host iniciou, quando uma carta nova foi sorteada, etc.

### Estratégia recomendada: `postgres_changes`

Cada cliente, ao entrar na sala (ou em `/r/<code>`), abre um canal Realtime escutando mudanças nas tabelas relevantes filtradas pelo `room_id`:

```ts
const channel = supabase
  .channel(`room:${roomId}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
    (payload) => onRoomUpdate(payload.new)
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
    (payload) => onPlayerChange(payload)
  )
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'room_card_history', filter: `room_id=eq.${roomId}` },
    (payload) => onCardPlayed(payload.new)
  )
  .subscribe();
```

### Tabelas que precisam ter Realtime habilitado

No dashboard Supabase → **Database → Replication** → tabela → `Realtime`:

- `rooms`
- `room_players`
- `room_card_history`
- `room_actions`

Sem isso, os eventos `postgres_changes` não chegam.

### Estratégia complementar: `broadcast` para animações efêmeras

`postgres_changes` só dispara em mudanças persistidas. Para algo como "host clicou em girar a roleta — todos os clientes começam a animar agora, mesmo antes do servidor responder", use **broadcast**:

```ts
channel.send({
  type: 'broadcast',
  event: 'roulette_starting',
  payload: { startedAt: Date.now() },
});
```

Útil para sincronizar a animação da roleta entre todos os clientes (reproduzir o `animationSeed` ao mesmo tempo).

### RLS e Realtime

Realtime respeita RLS. Cada cliente só recebe eventos de linhas que ele teria permissão de ler — o que já está coberto pelas policies da migration 07.

### Reconnect e backoff

O SDK reconecta automaticamente com backoff exponencial. Mostre um indicador visual ("reconectando...") quando `channel.state !== 'joined'` por > 2s.

---

## 10. Fluxos de gameplay detalhados

### 10.1 Fluxo "host cria sala"

1. Usuário cai em `/` (home).
2. Se ainda não tem `display_name`, redireciona para `/onboarding`.
3. Em `/onboarding`: input de nome, avatar (DiceBear seed), checkbox "tenho 18+". Submete → `update_profile`.
4. Volta para `/` (home).
5. Clica "Criar sala" → `/new`.
6. Em `/new`: escolhe modo (`truth_dare` ou `roulette` no MVP), intensidade máxima, decks permitidos (multi-select com cards ilustrados).
7. Submete → `create_room`. Recebe `{ room, player }`.
8. Redireciona para `/r/<code>` (lobby). Entra como host.
9. Compartilha o link `https://spicy-game.vercel.app/r/AAAA` ou QR code (gerar com `qrcode.react`).

### 10.2 Fluxo "convidado entra"

1. Convidado abre `https://spicy-game.vercel.app/r/AAAA`.
2. Se não tem `display_name`, redireciona para `/onboarding?next=/r/AAAA`.
3. Após onboarding, volta para `/r/AAAA`.
4. Página chama `join_room({ code: 'AAAA', displayName, avatarSeed })`.
5. Sucesso → renderiza lobby com lista de jogadores. Inicia subscription Realtime.

### 10.3 Fluxo "iniciar jogo"

1. Host vê botão "Começar" no lobby (convidados veem texto "Aguardando host").
2. Host clica → `start_game({ roomId, shuffleTurnOrder: true })`.
3. Servidor: `status: lobby → playing`, define `turn_order`, sorteia primeira carta.
4. Trigger Realtime: `rooms.UPDATE` chega em todos. Cliente detecta `status = 'playing'` e `current_card_id` novo, redireciona para a tela de jogo (mesma rota, condicional na UI).

### 10.4 Fluxo "rodada — modo truth_dare"

1. UI mostra: jogador da vez (avatar grande), botão "Tirar Verdade" e "Tirar Desafio".
2. Jogador da vez (apenas ele) clica em uma das opções → `draw_card({ roomId, cardTypeFilter: 'truth' | 'dare' })`.
3. Servidor sorteia carta filtrada, retorna `card`. Atualiza `current_card_id`.
4. Realtime → todos clientes mostram a carta com animação de flip.
5. Jogador da vez vê botões: "Cumpri", "Recuso".
6. Clica → `submit_action({ roomId, actionType: 'complete' | 'refuse' })`.
7. Servidor avança turno automaticamente, limpa `current_card_id`.
8. Realtime → próximo jogador é destacado, UI volta ao estado "tirar carta".

### 10.5 Fluxo "rodada — modo roulette"

1. UI mostra: roleta (visualização circular), botão "Girar" (só host ou jogador da vez, depende de `spin_type`).
2. Clica → `broadcast('roulette_starting', { seed })` para sincronizar animação **+** `spin_roulette({ roomId })`.
3. Servidor retorna `outcome` + `animationSeed`. Os clientes animam até pousar no resultado.
4. Resultado:
   - `kind: 'card_type'` → automaticamente `draw_card` com `cardTypeFilter`.
   - `kind: 'player'` → marca `current_player_id` e mostra "agora é a vez de X".
   - `kind: 'player_choice'` → jogador escolhe o tipo.
   - `kind: 'skip'` → avança turno sem carta.

### 10.6 Fluxo "encerrar sessão"

- **Host** pode clicar "Encerrar sala" → ainda não há edge function para isso (gap, ver §15). Por enquanto: `leave_room` do host transfere para outro jogador OU encerra se vazio.
- **Convidado** pode `leave_room` a qualquer momento → some da lista para os outros via Realtime.
- **Sala expira** após 6h → cleanup periódico (a implementar via cron ou edge function disparada por `pg_cron`).

### 10.7 Fluxo "tela de resumo"

Ao `status: 'ended'`, redirecionar para `/r/<code>/summary` que mostra:
- Total de cartas jogadas.
- Top jogadores (se `show_scores = true`).
- "Jogar de novo" (cria nova sala com mesmas configs).

---

## 11. Mapa de páginas / rotas web

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | RSC | Home/landing. Botões "Criar sala" e "Entrar com código". |
| `/onboarding` | Client | Setup inicial: nome, avatar, isAdult. |
| `/new` | Client | Configurar e criar sala. |
| `/join` | Client | Form de entrada com código (alternativa à URL direta). |
| `/r/[code]` | Client | Lobby + jogo + summary, condicional ao `room.status`. **A página principal do produto.** |
| `/about` | RSC | Sobre o jogo, créditos. |
| `/privacy` | RSC | Política de privacidade. |
| `/terms` | RSC | Termos de uso. |
| `/support` | RSC | Contato e FAQ. |
| `/api/health` | Route Handler | Healthcheck do site (200 OK + version). |

### Por que `/r/[code]` é uma página única

O estado da sala (`lobby`, `playing`, `paused`, `ended`) é a fonte de verdade. A UI **renderiza diferente para cada status, mas a rota é a mesma**. Isso simplifica:

- O usuário sempre tem **uma URL** para compartilhar — `/r/AAAA`.
- Realtime já está conectado quando o status muda.
- Refresh do navegador no meio do jogo retorna direto para o estado correto.

Sub-rota opcional: `/r/[code]/summary` para a tela final, que pode ser linkada externamente.

---

## 12. Estrutura de pastas proposta

```
apps/web/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx           # header + footer "marketing"
│   │   ├── page.tsx             # /
│   │   ├── about/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── support/page.tsx
│   ├── (game)/
│   │   ├── layout.tsx           # header minimalista durante o jogo
│   │   ├── onboarding/page.tsx
│   │   ├── new/page.tsx
│   │   ├── join/page.tsx
│   │   └── r/
│   │       └── [code]/
│   │           ├── page.tsx     # roteador interno por status
│   │           ├── lobby.tsx
│   │           ├── playing.tsx
│   │           └── summary.tsx
│   ├── api/
│   │   └── health/route.ts
│   ├── globals.css
│   ├── layout.tsx               # root layout (html, providers globais)
│   └── error.tsx                # boundary global
├── components/
│   ├── ui/                      # primitives (Button, Card, Dialog, ...)
│   ├── game/                    # CardDisplay, Roulette, PlayerList, TurnIndicator
│   ├── marketing/               # Hero, Features, FAQ
│   └── layout/                  # Header, Footer
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # createClient para client components
│   │   ├── server.ts            # createServerClient (RSC, Route Handlers)
│   │   └── api.ts               # wrapper das edge functions (porta de api.ts mobile)
│   ├── realtime/
│   │   └── room-channel.ts      # hook useRoomChannel
│   ├── hooks/
│   │   ├── useProfile.ts
│   │   ├── useRoom.ts
│   │   └── useDeviceOS.ts
│   ├── stores/
│   │   └── profile-store.ts     # zustand
│   ├── utils.ts                 # cn(), etc.
│   └── analytics.ts             # PostHog wrapper
├── public/
│   ├── og.png
│   ├── favicon.ico
│   └── screenshots/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md

packages/shared/                 # mantém — usado pelo web
└── src/
    └── schemas.ts

supabase/                        # inalterado
```

---

## 13. Componentes e estado do cliente

### 13.1 Providers no `app/layout.tsx`

```tsx
<html lang="pt-BR">
  <body>
    <ThemeProvider>            {/* next-themes */}
      <QueryProvider>          {/* TanStack Query */}
        <SupabaseProvider>     {/* contexto com client + sessão */}
          <ProfileProvider>    {/* zustand já é global, mas bootstrap aqui */}
            <ToastProvider>    {/* Radix Toast */}
              {children}
            </ToastProvider>
          </ProfileProvider>
        </SupabaseProvider>
      </QueryProvider>
    </ThemeProvider>
  </body>
</html>
```

### 13.2 `lib/supabase/api.ts` — porta direta do mobile

O arquivo `apps/mobile/src/lib/api.ts` é **portável quase 1:1**. Trocar:
- `import { supabase } from './supabase'` → cliente do `lib/supabase/client.ts` (browser).
- Manter `ApiException`, `call`, `callRaw`.
- Manter os 9 métodos: `listDecks`, `updateProfile`, `createRoom`, `joinRoom`, `leaveRoom`, `startGame`, `drawCard`, `spinRoulette`, `submitAction`, `advanceTurn`.

### 13.3 `useRoomChannel(roomId)` — hook central

```ts
export function useRoomChannel(roomId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { /* rooms */ }, (p) => {
        queryClient.setQueryData(['room', roomId], p.new);
      })
      .on('postgres_changes', { /* room_players */ }, () => {
        queryClient.invalidateQueries({ queryKey: ['room-players', roomId] });
      })
      // ... outras subs
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);
}
```

### 13.4 Componentes-chave

- `<CardDisplay card={...} onComplete onRefuse />` — exibe carta com animação de flip.
- `<Roulette outcome={...} seed={...} />` — animação determinística de roleta com Framer Motion.
- `<PlayerList players currentPlayerId hostId />` — lista lateral com avatares (DiceBear).
- `<TurnIndicator player />` — destaque grande do jogador da vez.
- `<RoomCodeBadge code />` — exibe código grande, copiável, com QR code expandível.
- `<ShareSheet url />` — Web Share API com fallback de copy-to-clipboard.

### 13.5 Estado global (Zustand)

```ts
// stores/profile-store.ts
type ProfileState = {
  userId: string | null;
  displayName: string | null;
  avatarSeed: string;
  isAdult: boolean;
  setProfile: (p: Partial<ProfileState>) => void;
  reset: () => void;
};
```

Persistir em `localStorage` via `zustand/middleware`.

### 13.6 Cache (TanStack Query)

| Query key | TTL | Refetch |
|---|---|---|
| `['decks']` | 1h | onWindowFocus |
| `['room', roomId]` | só Realtime | nunca (Realtime atualiza) |
| `['room-players', roomId]` | só Realtime | nunca |
| `['profile', userId]` | até logout | onMount |

Mutações (createRoom, joinRoom, etc.) usam `useMutation` com optimistic updates onde aplicável.

---

## 14. Reaproveitamento do código mobile existente

| Origem | Destino | Estratégia |
|---|---|---|
| `packages/shared/src/schemas.ts` | usar diretamente em `apps/web` | **import direto via `@spicy-game/shared`** (workspace já configurado) |
| `apps/mobile/src/lib/api.ts` | `apps/web/lib/supabase/api.ts` | **port 1:1** — só troca import do supabase client. Sem mudanças de API pública. |
| `apps/mobile/src/lib/supabase.ts` | `apps/web/lib/supabase/client.ts` | **adaptar** — trocar `AsyncStorage` por default (`localStorage`); manter `ensureAnonymousSession`. |
| `apps/mobile/src/theme/` (cores) | `apps/web/app/globals.css` (CSS vars) | **copiar tokens** (cores, espaçamentos). Componentes JSX são incompatíveis (RN ≠ HTML). |
| `apps/mobile/src/lib/avatar.ts` | `apps/web/lib/avatar.ts` | **port** se for puro TS (DiceBear ou similar). |
| `apps/mobile/src/lib/storage.ts` | `apps/web/lib/storage.ts` | **reescrever** com `localStorage` direto — é trivial. |
| `apps/mobile/src/screens/*.tsx` | **inspirar**, não copiar | RN components não rodam no browser. Ler para entender o fluxo de UX, mas reescrever em JSX puro com Tailwind. |
| `apps/mobile/src/navigation/` | App Router do Next | descartar — a navegação muda de paradigma. |
| `apps/mobile/App.tsx` | `apps/web/app/layout.tsx` | inspirar (providers), reescrever. |
| `supabase/**` | inalterado | reusar 100%. |

**Não tente** usar `react-native-web` para reusar componentes do mobile. O custo (lidar com diferenças de layout, animações, gestos) é maior do que reescrever ~11 telas em JSX puro.

---

## 15. Features novas exigidas pela versão web

### 15.1 Críticas para multiplayer
- **Realtime subscriptions** (§9) — não existe no mobile, é nova.
- **Habilitar Realtime nas 4 tabelas** no dashboard Supabase.
- **Reconnect indicator** quando o canal desconecta.

### 15.2 Adaptações para web
- **Web Share API + QR code** para compartilhar `/r/<code>`.
- **CORS** das edge functions: revisar `_shared/cors.ts` para permitir `https://spicy-game.vercel.app` e `http://localhost:3000`.
- **Responsive design** mobile-first: breakpoints `sm` (640), `md` (768), `lg` (1024). Layout-chave deve funcionar em portrait 375px.
- **Sem WakeLock por padrão** — opcional, considerar `navigator.wakeLock` para manter tela acesa durante o jogo.

### 15.3 Páginas novas
- `/onboarding`
- `/new`
- `/join`
- `/r/[code]`
- `/about`, `/privacy`, `/terms`, `/support`

### 15.4 Backend (gaps detectados)
- **`end_room` edge function** — encerrar sala explicitamente pelo host. Hoje é coberto indiretamente por `leave_room`, mas para UX clara é melhor ter.
- **Cleanup automático de salas expiradas** — `pg_cron` + função SQL que faz `UPDATE rooms SET status='ended' WHERE expires_at < now() AND status != 'ended'`.
- **Endpoint `/list_room_summary`** (opcional) — para a tela de resumo: total de cartas, top jogadores, etc.

### 15.5 Deduplicação de tabs
Se o mesmo `user_id` abre duas tabs na mesma sala, ele aparece "duas vezes" em `room_players` — não, na verdade `(room_id, user_id)` é único, então a segunda entrada falha. **Comportamento esperado:** tabs duplicadas compartilham o mesmo player. Cuidar disso garante que o realtime não conflite.

### 15.6 Bot/anti-abuso
- Rate limiting em `create_room` (ex: 5/min/usuario) via tabela `idempotency_keys` ou check explícito.
- `display_name` validado por regex no servidor (já vem do Zod, mas confirmar não-vazio após trim).
- Não expor `user_id` no payload público — o `PublicPlayer` não tem.

---

## 16. Deploy: Vercel + Supabase

### 16.1 Supabase (uma vez)

```bash
supabase login
supabase link --project-ref fuhjywhulyojxpiphakv
supabase db push                                   # aplica migrations
psql "$DATABASE_URL" -f supabase/seed.sql          # decks + cartas
for fn in advance_turn create_room draw_card join_room leave_room \
          list_decks spin_roulette start_game submit_action update_profile; do
  supabase functions deploy "$fn"
done
```

No dashboard Supabase:
- **Authentication → URL Configuration:**
  - Site URL: `https://spicy-game.vercel.app`
  - Additional Redirect URLs: `https://spicy-game.vercel.app/*`, `http://localhost:3000/*`
  - Anonymous sign-ins: **enabled**
- **Database → Replication:** habilitar Realtime para `rooms`, `room_players`, `room_card_history`, `room_actions`.
- **Edge Functions → secrets:** `SENTRY_DSN`, `POSTHOG_KEY`, `POSTHOG_HOST` (opcional).

### 16.2 Vercel

1. https://vercel.com/new → importar repo do GitHub.
2. Project Settings:
   - **Root Directory:** `apps/web`
   - **Framework:** Next.js (auto)
   - **Install Command:** `bun install`
   - **Build Command:** `next build`
   - **Node Version:** 20.x
3. Environment Variables (Production + Preview):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fuhjywhulyojxpiphakv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_OQnaMXHfhyQ9phhbI_y1nw_8AeJ1ASv` |
| `NEXT_PUBLIC_POSTHOG_KEY` | (PostHog Project API Key) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` ou eu |
| `NEXT_PUBLIC_SITE_URL` | `https://spicy-game.vercel.app` |

4. Deploy. URL: `https://spicy-game.vercel.app`.

### 16.3 CORS das edge functions

Confirmar em `supabase/functions/_shared/cors.ts` que `Access-Control-Allow-Origin` cobre o domínio do Vercel. Se está restrito a um valor único, mudar para lista permitida:

```ts
const ALLOWED = new Set([
  'http://localhost:3000',
  'https://spicy-game.vercel.app',
]);
```

E ecoar o origin recebido se estiver no set, ou usar `*` se a key for anon (público mesmo).

---

## 17. Observabilidade e features de produção

### 17.1 Sentry
- Pacote: `@sentry/nextjs`. Setup com `bun add @sentry/nextjs && bunx @sentry/wizard@latest -i nextjs`.
- DSN como `SENTRY_DSN_WEB` no Vercel env (não-public, o wizard configura tudo automaticamente).
- Edge functions: SDK Sentry para Deno em `_shared/sentry.ts`, secret `SENTRY_DSN_EDGE`.

### 17.2 PostHog
- Pacote: `posthog-js`. Init em provider client-side.
- Eventos mínimos:
  - `room_created`, `room_joined`, `game_started`
  - `card_drawn` `{ cardType }`
  - `roulette_spun` `{ outcomeKind }`
  - `action_submitted` `{ actionType }`
  - `room_left`
- Identify: `posthog.identify(supabase.auth.user.id, { displayName, isAdult })`.

### 17.3 Métricas-alvo (3 meses pós-launch)
- D1 retention > 25%.
- Sessões com ≥ 3 jogadores > 50%.
- Cartas/sessão (mediana) ≥ 12.
- Erro nas edge functions < 0.5% das chamadas.

---

## 18. Roadmap de implementação por fases

Cada fase é um marco entregável. Não pular fases — cada uma destrava a seguinte.

### Fase 0 — Backend disponível (1 dia)
- [ ] `supabase db push`.
- [ ] Aplicar `seed.sql`.
- [ ] Deploy das 10 edge functions.
- [ ] Habilitar Realtime nas 4 tabelas.
- [ ] Testar `list_decks` via curl.

### Fase 1 — Skeleton do site (2 dias)
- [ ] `bun create next-app apps/web`.
- [ ] Configurar Tailwind + tokens CSS.
- [ ] Layout root, providers (Theme, Query, Supabase, Toast).
- [ ] Auth anônima funcionando (`signInAnonymously`).
- [ ] Página `/` minimalista.
- [ ] Deploy preview no Vercel.

### Fase 2 — Onboarding e home (1 dia)
- [ ] Página `/onboarding` (form de profile).
- [ ] Persistência via Zustand + `update_profile`.
- [ ] Home com botões "Criar" / "Entrar com código".

### Fase 3 — Criar e entrar em sala (2 dias)
- [ ] Página `/new` com seletor de modo, intensidade, decks.
- [ ] `/join` com input de código.
- [ ] Página `/r/[code]` carregando estado inicial via `join_room`.
- [ ] Hook `useRoomChannel`.

### Fase 4 — Lobby (1 dia)
- [ ] Lista de jogadores com avatares.
- [ ] Indicador de host.
- [ ] Botão "Compartilhar" com Web Share / QR.
- [ ] Botão "Iniciar" (só host).

### Fase 5 — Gameplay truth_dare (2 dias)
- [ ] UI de turno (jogador da vez destacado).
- [ ] `<CardDisplay>` com flip animado.
- [ ] Botões "Verdade" / "Desafio" (chama `draw_card`).
- [ ] Botões "Cumpri" / "Recusei" (chama `submit_action`).
- [ ] Realtime atualizando `current_card_id`, `turn_index`.

### Fase 6 — Roleta (1 dia)
- [ ] `<Roulette>` com animação determinística.
- [ ] `spin_roulette` + broadcast para sincronizar.
- [ ] Resoluções: card_type, player, player_choice, skip.

### Fase 7 — Encerramento e summary (1 dia)
- [ ] `leave_room` no botão "Sair".
- [ ] Edge function `end_room` (criar — gap §15.4).
- [ ] Tela summary em `/r/[code]/summary`.

### Fase 8 — Polimento e produção (2 dias)
- [ ] Páginas legais (privacy, terms, support).
- [ ] Sentry + PostHog instrumentados.
- [ ] CORS confirmado.
- [ ] Lighthouse perf > 90.
- [ ] Smoke test multiplayer com 3 dispositivos reais.
- [ ] Cleanup automático de salas expiradas (`pg_cron`).

**Total estimado:** ~13 dias de trabalho focado de uma pessoa.

---

## 19. Convenções de código e qualidade

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`.
- Todo input externo passa por Zod.
- Sem `any`. Use `unknown` + narrow.

### Componentes
- **Server Components por padrão.** `'use client'` só onde precisar de hook/realtime/forms.
- Componentes pequenos (< 200 linhas). Quebrar quando escalar.
- Prop drilling até 2 níveis. Acima disso, contexto ou Zustand.

### Estilo
- Tailwind utility-first. `clsx` + `tailwind-merge` via helper `cn()`.
- Tokens em CSS vars, não hardcoded.
- Mobile-first: `<base>` → `sm:` → `md:` → `lg:`.

### Acessibilidade
- Componentes interativos via Radix (já vem com ARIA correto).
- Foco visível em todos os botões.
- Contraste mínimo AA.
- Texto alternativo em todas as imagens.

### Commits
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`.
- Branch por feature, PR para `main`.

### Testes (priorizar)
- **E2E** com Playwright para o fluxo crítico: criar sala → entrar → jogar → encerrar.
- **Unit** apenas para utils puros (`generateRoomCode`, `weightedPick`).
- **Sem testes de UI pixel-perfect** nesta fase.

---

## 20. Como usar este documento com outras IAs

### Fluxo recomendado

1. Cole **este documento inteiro** como primeiro turno do contexto.
2. Diga à IA o que você quer:
   - "Vamos começar pela Fase 1."
   - "Implemente o `useRoomChannel` da seção 13.3."
   - "Escreva os testes E2E do fluxo da seção 10.3."
3. Quando a IA propuser código, peça para ela **referenciar a seção** do doc na justificativa, para garantir que está alinhada.

### Prompts úteis (cole junto com a mensagem)

**Para implementar uma fase inteira:**
```
Estou implementando a Fase X do roadmap (§18). Considere:
- O backend Supabase já está pronto (§3, §6, §7).
- Use a stack da §4.
- Siga a estrutura de pastas da §12.
- Reaproveite os schemas de `packages/shared/src/schemas.ts`.
- Realtime conforme §9.
Quero que você proponha o diff completo dos arquivos novos/modificados.
```

**Para revisar uma proposta:**
```
Revise este código contra a especificação. Aponte qualquer divergência das seções
4 (stack), 9 (realtime), ou 13 (componentes/estado). Não invente novos requisitos.
```

**Para ampliar uma seção:**
```
Detalhe a §10.5 (fluxo roleta) com o pseudocódigo completo do componente <Roulette>,
considerando que o `spin_roulette` retorna o `outcome` e o `animationSeed` deterministicamente.
```

### Restrições para a IA respeitar

- **Não** invente edge functions novas além das listadas em §7.
- **Não** sugira mudar para outro backend (Firebase, Pocketbase, etc.).
- **Não** sugira reescrever as migrations.
- **Não** proponha trazer de volta o app mobile — a decisão de §2 é final.
- **Faça** apontar quando algo na spec parecer inconsistente — peça esclarecimento ao humano antes de partir para código.

---

## Apêndice — referências rápidas

### Comandos-chave

```bash
# Dev local
bun install
bun --cwd apps/web dev

# Supabase
supabase start                # Docker local
supabase db reset             # reaplica migrations + seed
supabase functions serve      # roda edge functions local
supabase functions deploy <fn>

# Web
bun --cwd apps/web build
bun --cwd apps/web typecheck
```

### Links

- Repositório: este monorepo.
- Supabase Dashboard: https://supabase.com/dashboard/project/fuhjywhulyojxpiphakv
- Documentação Supabase Realtime: https://supabase.com/docs/guides/realtime
- Documentação Next.js App Router: https://nextjs.org/docs/app

### Glossário

| Termo | Significado |
|---|---|
| **Sala / Room** | Sessão multiplayer ativa, identificada por código de 4 letras. |
| **Host** | Jogador que criou a sala, com permissões adicionais (start, end). |
| **Carta / Card** | Unidade de prompt jogável. Tem `type`, `intensity`, `prompt`. |
| **Deck** | Container curado de cartas (ex: "leve", "picante", "beba"). |
| **Tag** | Taxonomia transversal (ex: "alcool", "acao", "perguntas"). |
| **Modo** | Mecânica geral da sessão: `truth_dare`, `roulette`, etc. |
| **Spin** | Sorteio da roleta. |
| **Turno** | Um round individual: jogador → carta → ação → próximo. |
| **Realtime** | Subscription WebSocket do Supabase para mudanças no DB. |
| **RLS** | Row-Level Security do Postgres — autorização por linha. |
| **Anon auth** | Login sem credenciais — usuário tem JWT mas é `is_anonymous = true`. |
