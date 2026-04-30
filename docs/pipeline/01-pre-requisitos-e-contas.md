# 01 — Pré-requisitos e contas

## Objetivo

Deixar você com **todas as ferramentas instaladas**, **contas criadas** e **segredos coletados** antes de tocar em qualquer comando de deploy. Todas as contas listadas aqui têm **tier gratuito suficiente** para o projeto nesta fase.

---

## 1. Ferramentas de linha de comando

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Bun | 1.1 | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js | 20 | via [nvm](https://github.com/nvm-sh/nvm) — `nvm install 20 && nvm use 20` |
| Supabase CLI | 1.200 | `brew install supabase/tap/supabase` (macOS/Linux) ou `scoop install supabase` (Windows) |
| EAS CLI | 16 | `npm i -g eas-cli` |
| Vercel CLI | 37 | `npm i -g vercel` |
| GitHub CLI (`gh`) | 2.50 | `brew install gh` ou `sudo apt install gh` |
| Git | 2.40 | já vem no sistema na maioria dos casos |

Confira com:

```bash
bun --version
node --version
supabase --version
eas --version
vercel --version
gh --version
git --version
```

---

## 2. Contas a criar

Todas gratuitas nesta fase. Deixe logado antes de começar.

### 2.1 GitHub
- Precisa do repo do projeto no GitHub (pode ser privado). O Vercel pede para conectar.
- Gere um Personal Access Token com scope `repo` + `workflow` (será usado em `gh release create` no doc 09). Guarde com o nome `GH_TOKEN_RELEASES`.

### 2.2 Expo / EAS
- Criar em https://expo.dev (grátis).
- Login local: `eas login`.
- Tier gratuito tem **30 builds/mês** e **1000 atualizações OTA/mês** — mais que suficiente.

### 2.3 Vercel
- Criar em https://vercel.com/signup (grátis, plano Hobby).
- Login local: `vercel login` (escolher GitHub como provedor).
- Hobby permite deploys ilimitados no plano pessoal, sem billing.

### 2.4 Sentry
- Criar em https://sentry.io/signup/ (grátis, 5k events/mês).
- Criar **dois projetos**:
  - `spicy-mobile` (plataforma: React Native) → gera `SENTRY_DSN_MOBILE`.
  - `spicy-edge` (plataforma: Node.js — servirá para Deno também) → gera `SENTRY_DSN_EDGE`.
- Criar um **Auth Token** em `Settings → Account → API → Auth Tokens` com scope `project:releases` e `org:read`. Guarde como `SENTRY_AUTH_TOKEN` (usado pelo CI para enviar source maps).

### 2.5 PostHog
- Criar em https://app.posthog.com/signup (grátis, 1M events/mês).
- Criar **um projeto** chamado `spicy-game`. Copie o **Project API Key** (`POSTHOG_KEY`) e o **host** (`POSTHOG_HOST`, geralmente `https://us.i.posthog.com` ou `https://app.posthog.com`).

---

## 3. Matriz de secrets

Esta matriz é a **fonte de verdade** de onde cada variável vive. Todos os documentos seguintes referenciam esta tabela.

| Secret | Origem | `apps/mobile/.env` | EAS secret | Supabase secret | Vercel env | GitHub Actions |
|---|---|:-:|:-:|:-:|:-:|:-:|
| `EXPO_PUBLIC_SUPABASE_URL` | doc 03 | ✅ | ✅ | — | ✅ (`NEXT_PUBLIC_SUPABASE_URL`) | — |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | doc 03 | ✅ | ✅ | — | — | — |
| `SUPABASE_SERVICE_ROLE` | doc 03 | ❌ **nunca no mobile** | — | — | — | ✅ (se migrations no CI) |
| `SUPABASE_ACCESS_TOKEN` | `supabase login` | — | — | — | — | ✅ |
| `SENTRY_DSN_MOBILE` | doc 01.2.4 | ✅ (via `expo-constants.extra`) | ✅ | — | — | — |
| `SENTRY_DSN_EDGE` | doc 01.2.4 | — | — | ✅ | — | — |
| `SENTRY_AUTH_TOKEN` | doc 01.2.4 | — | ✅ (build time) | — | — | ✅ |
| `POSTHOG_KEY` | doc 01.2.5 | ✅ | ✅ | ✅ (edge functions) | ✅ (`NEXT_PUBLIC_POSTHOG_KEY`) | — |
| `POSTHOG_HOST` | doc 01.2.5 | ✅ | ✅ | ✅ | ✅ (`NEXT_PUBLIC_POSTHOG_HOST`) | — |
| `EAS_PROJECT_ID` | `eas init` (doc 06) | via `app.config.ts extra.eas.projectId` | — | — | — | — |
| `EXPO_TOKEN` | `expo.dev → Access tokens` | — | — | — | — | ✅ |
| `GH_TOKEN_RELEASES` | doc 01.2.1 | — | — | — | — | ✅ (já vem como `GITHUB_TOKEN`) |
| `VERCEL_TOKEN` | `vercel.com → tokens` | — | — | — | — | ✅ (opcional) |
| `NEXT_PUBLIC_APK_URL` | doc 09 | — | — | — | ✅ | — |
| `NEXT_PUBLIC_APP_VERSION` | doc 04 (`version`) | — | — | — | ✅ | — |

**Regras de ouro:**
- `SUPABASE_SERVICE_ROLE` **nunca** vai para o mobile nem para o Vercel. Só CI de migrations ou máquinas de admin.
- Qualquer variável que começa com `EXPO_PUBLIC_` ou `NEXT_PUBLIC_` **vai ficar visível no bundle** — só coloque o que pode ser público (anon key, DSN do Sentry, POSTHOG_KEY são OK por design).
- Guarde tudo num gerenciador de senhas (1Password, Bitwarden) antes de prosseguir.

---

## 4. Bootstrap do ambiente local

Assumindo que você já clonou o repo:

```bash
cd spicy-game
bun install
```

Sanity check:

```bash
bun --filter './apps/mobile' typecheck
```

Deve passar sem erros.

---

## Verificação

Você está pronto para o próximo documento quando:

- [ ] `bun`, `node`, `supabase`, `eas`, `vercel`, `gh`, `git` respondem com versão ao comando `--version`.
- [ ] `eas whoami` retorna seu usuário Expo.
- [ ] `vercel whoami` retorna seu usuário Vercel.
- [ ] `gh auth status` confirma login no GitHub.
- [ ] Você tem um arquivo (local, fora do git) com todos os secrets da seção 3 preenchidos.
- [ ] `bun install` concluiu na raiz do repo sem erro.

---

## Troubleshooting

- **`eas: command not found` mesmo após `npm i -g`:** verifique `npm root -g`; se o diretório não está no `PATH`, adicione `export PATH="$(npm root -g)/.bin:$PATH"` ao `.zshrc`/`.bashrc`.
- **`supabase login` abre navegador mas não volta:** force login por token: crie um access token em https://supabase.com/dashboard/account/tokens e rode `supabase login --token <TOKEN>`.
- **Conta Expo pede verificação SMS:** conta gratuita não exige — se está pedindo, você está na criação de conta Enterprise por engano; volte e escolha Free.
- **PostHog em EU vs US:** escolha o host no momento do signup. `POSTHOG_HOST` precisa bater com a região escolhida (`us.i.posthog.com` ou `eu.i.posthog.com`).
