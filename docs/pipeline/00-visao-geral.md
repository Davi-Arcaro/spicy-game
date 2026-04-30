# 00 — Visão geral do pipeline

> Este documento é o mapa. Ele não contém comandos executáveis — só orienta onde você está no processo e o que cada documento seguinte entrega.

---

## Objetivo

Publicar o **Spicy Game** em produção com:

- **Backend** rodando no **Supabase** hospedado (projeto `fuhjywhulyojxpiphakv`, região `sa-east-1`).
- **App Android** distribuído como **APK** por link.
- **Landing page** no **Vercel** (`https://spicy-game.vercel.app`) que apresenta o jogo e serve o botão de download.
- **Observabilidade** básica: Sentry (crashes) + PostHog (analytics).
- **Atualizações rápidas** via **expo-updates** (OTA) sem republicar APK.

**iOS fica para depois** (doc 12). Foco total agora em Android + landing.

---

## Diagrama

```
                        ┌──────────────────────────┐
                        │  GitHub (this repo)      │
                        │  branch: main            │
                        └───────┬──────────────────┘
                                │
        ┌───────────────────────┼─────────────────────────┐
        │                       │                         │
        ▼                       ▼                         ▼
┌───────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ Supabase      │     │ Vercel           │     │ EAS Build (cloud)  │
│ fuhj...phakv  │     │ spicy-game       │     │ perfil production  │
│               │     │   .vercel.app    │     │                    │
│ • Postgres    │     │                  │     │ • APK assinado     │
│ • 10 Edge Fns │     │ apps/web         │     │ • upload para      │
│ • Auth anon   │     │ (Next.js 15)     │     │   GitHub Releases  │
└───────┬───────┘     └────────┬─────────┘     └──────────┬─────────┘
        │                      │                          │
        │                      │ /download/android        │
        │                      │  ⟶ 302 redirect          │
        │                      │                          ▼
        │                      │                ┌──────────────────┐
        │                      │                │ GitHub Releases  │
        │                      │                │ spicy-v1.0.0.apk │
        │                      │                └────────┬─────────┘
        │                      │                         │
        │                      ▼                         │
        │           ┌─────────────────────┐              │
        │           │ Usuário final       │◀─────────────┘
        └──────────▶│ acessa landing,     │
                    │ baixa APK, instala, │
                    │ abre app, joga      │
                    └─────────────────────┘
```

---

## Ordem de leitura e execução

Execute os documentos **em ordem** na primeira vez. Depois, cada um é independente para manutenção.

| # | Documento | O que entrega | Tempo estimado |
|---|---|---|---|
| 01 | `01-pre-requisitos-e-contas.md` | Contas criadas, CLIs instaladas, secrets coletados | 30–60 min |
| 02 | `02-auditoria-e-reaproveitamento.md` | Entendimento do que o repo já tem (nada a executar — leitura) | 15 min |
| 03 | `03-supabase-producao.md` | Migrations aplicadas no projeto hospedado + Edge Functions no ar + seed carregado | 20 min |
| 04 | `04-mobile-config-producao.md` | `app.config.ts` de produção, `.env.production`, assets (ícone/splash) | 30 min |
| 05 | `05-features-producao.md` | Sentry, PostHog e expo-updates integrados no mobile e nas edge functions | 60 min |
| 06 | `06-eas-build-android.md` | Primeiro APK de produção gerado pelo EAS | 30 min (+ fila EAS) |
| 07 | `07-web-landing-next-js.md` | `apps/web` criado e rodando em `localhost:3000` | 90 min |
| 08 | `08-vercel-deploy.md` | Landing no ar em `spicy-game.vercel.app` | 20 min |
| 09 | `09-distribuicao-apk.md` | APK publicado em GitHub Release + botão da landing funcionando | 20 min |
| 10 | `10-ci-cd-github-actions.md` | `ci.yml` em PRs + workflow manual de release | 30 min |
| 11 | `11-qa-e-monitoramento.md` | Smoke test documentado + dashboards Sentry/PostHog | 30 min |
| 12 | `12-roadmap-ios-testflight.md` | Plano de abertura iOS (não executar agora) | — |

**Soma:** ~6 horas de trabalho ativo, fora das filas do EAS (que rodam no background) e dos tempos de espera de DNS do Vercel.

---

## Princípios

1. **Reaproveitar o máximo.** Nada no backend é reescrito. Nada em `apps/mobile/src/` é refatorado sem motivo claro.
2. **Documento = runbook.** Cada `.md` é auto-contido: tem pré-requisitos, comandos copiáveis, critério de verificação e troubleshooting. Não precisa memória do anterior para executar.
3. **Produção única.** Um único projeto Supabase (o atual) serve como produção. Dev rola em Docker local. Sem staging separado nesta fase — o custo operacional não compensa para um jogo entre amigos.
4. **Segurança por padrão.** RLS está ativa em todas as tabelas. Secrets ficam em `supabase secrets`, EAS secrets, Vercel env — nunca no git.
5. **Reversibilidade.** Toda release tem caminho de rollback documentado (OTA rollback, deletar GitHub Release, etc.).

---

## Glossário rápido

- **EAS:** Expo Application Services — build/submit/update do Expo na nuvem.
- **OTA:** Over-The-Air — atualizar o app sem novo APK (só mudanças de JS/assets).
- **RLS:** Row-Level Security do Postgres — política de acesso a linhas por usuário.
- **Edge Function:** função Deno rodando na infra do Supabase (equivalente a serverless function).
- **runtimeVersion:** versão que casa o JS (OTA) com o binário nativo. Mudou o nativo → precisa novo APK.
