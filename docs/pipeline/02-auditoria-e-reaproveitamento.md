# 02 — Auditoria e reaproveitamento

> **Leitura, não execução.** Este documento descreve o estado do repo **antes** de começar o pipeline e serve como **contrato**: nenhum passo seguinte pode reescrever o que está listado aqui como "reusar 100%" sem justificativa explícita.

---

## Objetivo

Mapear o que já existe no repositório para você entender **o que não precisa fazer**. O valor de um pipeline bem planejado vem tanto do que é construído quanto do que é preservado.

---

## 1. Estrutura do repo (estado atual)

```
spicy-game/
├── apps/
│   └── mobile/                 # Expo 54 + RN 0.81 — funcional
│       ├── App.tsx             # bootstrap: fontes + sons + providers + nav
│       ├── app.config.ts       # config Expo (sem EAS/updates/assets ainda)
│       ├── babel.config.js
│       ├── metro.config.js
│       ├── tsconfig.json
│       ├── assets/             # vazio ou quase vazio (sem ícones)
│       ├── index.ts
│       └── src/
│           ├── components/     # ToastProvider, UI reutilizável
│           ├── lib/
│           │   ├── api.ts      # wrapper tipado das 10 edge functions
│           │   ├── avatar.ts
│           │   ├── env.ts
│           │   ├── fonts.ts
│           │   ├── sounds.ts   # preloadSounds (assets stub no momento)
│           │   ├── storage.ts
│           │   └── supabase.ts # cliente + auth anônima
│           ├── navigation/     # RootNavigator + types (11 rotas)
│           ├── screens/        # 11 telas .tsx
│           ├── state/          # ProfileContext
│           └── theme/          # ThemeProvider, tokens
│
├── packages/
│   └── shared/
│       └── src/
│           └── schemas.ts      # 9 Zod schemas + tipos
│
├── supabase/
│   ├── config.toml             # config CLI local
│   ├── seed.sql                # decks + cartas iniciais
│   ├── migrations/             # 10 SQL numeradas (20260423…)
│   ├── functions/              # 10 edge functions Deno
│   │   ├── _shared/
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
│
├── README.md                   # 1 linha — será atualizado
├── SETUP.md                    # guia de dev completo (manter)
├── package.json                # workspaces bun
├── bun.lock
├── bunfig.toml
└── tsconfig.json
```

---

## 2. Contrato de reuso

### Reusar 100% — **não alterar**
- `packages/shared/src/schemas.ts` — todos os 9 schemas Zod. Os edge functions mantêm cópias inline (limitação do Deno runtime) e isso é intencional.
- `apps/mobile/src/lib/api.ts` — wrapper tipado, padrão `{ data, error }` + `ApiException`. Só será **decorado** com calls de PostHog (doc 05), sem mudar a assinatura pública.
- `apps/mobile/src/lib/supabase.ts` — cliente Supabase com auth anônima via AsyncStorage.
- `apps/mobile/src/navigation/` — RootNavigator e tipos. Não mexer.
- `apps/mobile/src/screens/*.tsx` — todas as 11 telas já implementam o fluxo completo.
- `apps/mobile/src/theme/` — tokens e ThemeProvider.
- `supabase/migrations/20260423000001..20260423000010` — todo o schema. Será aplicado via `supabase db push` no doc 03.
- `supabase/functions/*` — Deno handlers prontos. Serão deployados em batch.
- `supabase/seed.sql` — decks e cartas iniciais.
- `SETUP.md` — guia de dev. Será linkado, nunca duplicado.

### Estender — **só adicionar, sem quebrar**
- `apps/mobile/app.config.ts` (doc 04):
  - adicionar `runtimeVersion`, `updates`, `extra.eas.projectId`.
  - descomentar bloco de `icon`, `splash`, `adaptiveIcon`.
  - bumpar `version` → `1.0.0`.
- `apps/mobile/App.tsx` (doc 05):
  - envelopar `export default` com `Sentry.wrap(App)`.
  - chamar `initAnalytics()` dentro do `useEffect` de boot.
- `apps/mobile/src/lib/api.ts` (doc 05):
  - adicionar chamadas `analytics.capture()` no sucesso de cada método. **Sem mudar a assinatura pública do `api.*`.**
- `README.md` raiz — adicionar seção "📦 Publicação" linkando para `docs/pipeline/README.md`.

### Criar do zero — **novos arquivos**
- `apps/web/` — novo workspace Next.js (doc 07).
- `apps/mobile/eas.json` (doc 06).
- `apps/mobile/.env.production` (doc 04) — fica fora do git.
- `apps/mobile/src/lib/sentry.ts` (doc 05).
- `apps/mobile/src/lib/analytics.ts` (doc 05).
- `apps/mobile/assets/icon.png`, `splash.png`, `adaptive-icon.png` (doc 04).
- `supabase/functions/_shared/sentry.ts` (doc 05).
- `.github/workflows/ci.yml`, `release-apk.yml` (doc 10).
- `scripts/publish-release.sh` (doc 09).
- `docs/pipeline/README.md` — índice.

### Fora de escopo — **não mexer nesta fase**
- Novas edge functions.
- Novas migrations de schema.
- Novas telas ou features de gameplay.
- Refatoração de telas existentes.
- Sons: os assets de áudio estão stub em `sounds.ts` — deixar como está (já não emite som). Corrigir depois, fora do pipeline de publicação.
- iOS (doc 12 é roadmap).

---

## 3. Pendências conhecidas do estado atual

- **Sem assets de ícone/splash:** os blocos no `app.config.ts` estão comentados. Sem isso, o APK vai com o ícone padrão do Expo. Corrigido no doc 04.
- **Sons desabilitados:** `preloadSounds()` existe em `apps/mobile/src/lib/sounds.ts` mas os arquivos de áudio podem não estar no `assets/`. Isso não bloqueia publicação (o `finally` garante que o boot prossegue).
- **`version: '0.0.1'`:** valor dev. Será `1.0.0` no doc 04 — primeira versão pública.
- **Sem EAS project linkado:** `eas init` (doc 06) cria o ID e preenche `app.config.ts`.
- **Sem CI:** nenhum workflow no `.github/workflows/`. Criado no doc 10.
- **Sem ambiente `production` no Supabase config:** `auth.site_url` aponta para `127.0.0.1:3000`. Trocado no doc 03/08 para a URL do Vercel.

---

## 4. Reaproveitamento na landing (`apps/web`)

A landing é **puramente de marketing** — não compartilha código com o mobile além dos **tokens de cor** copiados manualmente de `apps/mobile/src/theme/`. **Intencional:** web e mobile usam stacks diferentes (Next/Tailwind vs React Native), e tentar reusar componentes seria atrito sem ganho.

O que a landing **não** deve fazer:
- Consumir Supabase.
- Importar de `packages/shared`.
- Qualquer lógica de jogo.

O que ela **precisa** fazer:
- Mostrar o jogo (hero + screenshots + features).
- Redirecionar para o APK mais recente.
- Ter páginas de privacidade/termos/suporte.

---

## Verificação

Você terminou este documento quando consegue responder, sem abrir o código:

- [ ] Quantas telas o app mobile tem? (11)
- [ ] Quantas edge functions existem? (10)
- [ ] Onde fica o wrapper tipado das APIs? (`apps/mobile/src/lib/api.ts`)
- [ ] Qual arquivo **não posso** modificar sem quebrar contrato? (respostas da seção 2.1)
- [ ] O que ainda falta criar? (respostas da seção 2.3)
