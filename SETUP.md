# Spicy Game — Setup, Build e Run

Guia passo a passo para rodar o projeto do zero. Monorepo com Bun workspaces: app mobile em Expo/React Native (`apps/mobile`), pacote compartilhado (`packages/shared`) e backend Supabase (`supabase/`) com migrations e Edge Functions.

---

## 1. Pré-requisitos

Instale antes de começar:

- **Bun** ≥ 1.1 — `curl -fsSL https://bun.sh/install | bash`
- **Node.js** ≥ 20 (necessário para Expo CLI)
- **Supabase CLI** — `brew install supabase/tap/supabase` ou veja https://supabase.com/docs/guides/cli
- **Docker Desktop** (para rodar Supabase localmente)
- **Expo Go** no celular (iOS/Android) **ou** emulador Android / simulador iOS
  - iOS: Xcode + CocoaPods (`sudo gem install cocoapods`)
  - Android: Android Studio com SDK + emulador

---

## 2. Clonar e instalar dependências

```bash
git clone <repo-url> spicy-game
cd spicy-game
bun install
```

---

## 3. Configurar o Supabase

Seu projeto hospedado:

- **Project URL:** `https://fuhjywhulyojxpiphakv.supabase.co`
- **Project Ref:** `fuhjywhulyojxpiphakv`
- **Publishable Key:** `sb_publishable_OQnaMXHfhyQ9phhbI_y1nw_8AeJ1ASv`
- **Região:** `sa-east-1`

### 3.1. Login e link

```bash
supabase login
supabase link --project-ref fuhjywhulyojxpiphakv
```

### 3.2. Aplicar migrations no projeto remoto

```bash
supabase db push
```

Isso aplica tudo em `supabase/migrations/` (extensões, enums, tabelas de conteúdo/room/profile, funções/triggers, RLS, seeds de decks/tags, idempotência, RPCs).

### 3.3. Fazer deploy das Edge Functions

```bash
supabase functions deploy advance_turn
supabase functions deploy create_room
supabase functions deploy draw_card
supabase functions deploy join_room
supabase functions deploy leave_room
supabase functions deploy list_decks
supabase functions deploy spin_roulette
supabase functions deploy start_game
supabase functions deploy submit_action
supabase functions deploy update_profile
```

Ou, em uma linha:

```bash
for fn in advance_turn create_room draw_card join_room leave_room list_decks spin_roulette start_game submit_action update_profile; do
  supabase functions deploy "$fn"
done
```

---

## 4. (Opcional) Rodar Supabase localmente

Para desenvolver contra um banco local em vez do projeto remoto:

```bash
bun run db:start     # sobe stack Supabase via Docker
bun run db:reset     # aplica migrations + seed.sql em um banco limpo
bun run db:gen-types # regenera apps/mobile/src/lib/database.types.ts
bun run db:stop      # derruba a stack
```

O `supabase start` imprime a URL local (`http://127.0.0.1:54321`) e a anon key — use no `.env` abaixo.

---

## 5. Variáveis de ambiente do app mobile

Crie `apps/mobile/.env` com:

```bash
# Projeto remoto (produção / staging)
EXPO_PUBLIC_SUPABASE_URL=https://fuhjywhulyojxpiphakv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OQnaMXHfhyQ9phhbI_y1nw_8AeJ1ASv
```

Para desenvolvimento com Supabase local, troque por:

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key-impressa-pelo-supabase-start>
```

> Ao rodar em device físico apontando para Supabase local, troque `127.0.0.1` pelo IP da sua máquina na LAN.

---

## 6. Rodar o app mobile

Na raiz do repositório:

```bash
bun run mobile
```

Isso inicia o Metro (Expo). Em seguida:

- **Expo Go:** escaneie o QR code com o app (Android) ou Câmera (iOS).
- **Simulador iOS:** pressione `i` no terminal do Metro.
- **Emulador Android:** pressione `a`.

### Build nativo (quando precisar de módulos nativos além do Expo Go)

```bash
bun run mobile:ios       # expo run:ios
bun run mobile:android   # expo run:android
```

---

## 7. Type-check

```bash
bun --filter './apps/mobile' typecheck
```

---

## 8. Estrutura do projeto

```
spicy-game/
├── apps/
│   └── mobile/              # app Expo/React Native
├── packages/
│   └── shared/              # tipos e lógica compartilhada
└── supabase/
    ├── migrations/          # schema versionado
    ├── functions/           # Edge Functions (Deno)
    ├── tests/
    ├── seed.sql
    └── config.toml
```

---

## 9. Troubleshooting

- **Metro sem conectar ao device:** confira se celular e máquina estão na mesma rede; tente `bun run mobile -- --tunnel`.
- **"Invalid API key" no app:** variáveis `EXPO_PUBLIC_*` só são lidas na inicialização do Metro — reinicie com `r` ou mate e suba de novo.
- **`supabase db push` falha:** rode `supabase migration list` para comparar migrations locais × remotas.
- **Edge Function retorna 401:** confirme que o header `Authorization: Bearer <anon-key>` está sendo enviado (o cliente do `@supabase/supabase-js` faz isso automaticamente quando configurado).
- **Android build falha com Java:** use JDK 17 (`export JAVA_HOME=$(/usr/libexec/java_home -v 17)` no macOS).

---

## 10. Scripts úteis (resumo)

| Script                        | O que faz                                  |
| ----------------------------- | ------------------------------------------ |
| `bun run mobile`              | Inicia Expo dev server                     |
| `bun run mobile:ios`          | Build + run no iOS                         |
| `bun run mobile:android`      | Build + run no Android                     |
| `bun run db:start`            | Sobe Supabase local (Docker)               |
| `bun run db:stop`             | Para Supabase local                        |
| `bun run db:reset`            | Reaplica migrations + seed localmente      |
| `bun run db:gen-types`        | Gera tipos TS a partir do schema local     |
