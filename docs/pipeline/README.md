# 📦 Pipeline de publicação — Spicy Game

Esta pasta contém o passo a passo completo para colocar o Spicy Game em produção: backend no **Supabase**, APK Android via **EAS Build** distribuído por **GitHub Releases**, e landing page no **Vercel**.

> Os documentos foram escritos assumindo **zero estado** — você pode executar do zero num repo novo. Para quem já tem parte do setup pronto, cada doc lista seus pré-requisitos e critério de verificação.

---

## Como usar

1. Leia **`00-visao-geral.md`** primeiro. Ele tem o diagrama e a ordem das fases.
2. Leia **`01-pre-requisitos-e-contas.md`** e faça tudo antes de prosseguir. Tem matriz de secrets — mantenha num cofre.
3. Siga os docs `02` → `11` **em ordem** na primeira vez.
4. **`12-roadmap-ios-testflight.md`** é futuro — deixe para depois.

Cada documento é auto-contido e tem a estrutura:

- **Objetivo** — o que o doc entrega.
- **Pré-requisitos** — o que você precisa ter feito antes.
- **Passos** — comandos prontos para copiar/colar.
- **Verificação** — como confirmar que funcionou.
- **Troubleshooting** — erros comuns e como sair deles.

---

## Índice

| # | Documento | Entrega |
|---|---|---|
| 00 | [Visão geral](./00-visao-geral.md) | Diagrama do pipeline + ordem de execução |
| 01 | [Pré-requisitos e contas](./01-pre-requisitos-e-contas.md) | CLIs, contas, matriz de secrets |
| 02 | [Auditoria e reaproveitamento](./02-auditoria-e-reaproveitamento.md) | Contrato do que reusar e não reescrever |
| 03 | [Supabase em produção](./03-supabase-producao.md) | Migrations + Edge Functions + Auth + Secrets |
| 04 | [Config mobile para produção](./04-mobile-config-producao.md) | `app.config.ts`, `.env.production`, assets |
| 05 | [Sentry, PostHog e OTA](./05-features-producao.md) | Observabilidade + updates sem rebuild |
| 06 | [EAS Build Android](./06-eas-build-android.md) | Primeiro APK assinado |
| 07 | [Landing Next.js](./07-web-landing-next-js.md) | `apps/web` rodando local |
| 08 | [Deploy Vercel](./08-vercel-deploy.md) | Landing no ar em `spicy-game.vercel.app` |
| 09 | [Distribuição do APK](./09-distribuicao-apk.md) | GitHub Releases + redirect `/download/android` |
| 10 | [CI/CD GitHub Actions](./10-ci-cd-github-actions.md) | CI em PRs + workflow de release |
| 11 | [QA e monitoramento](./11-qa-e-monitoramento.md) | Smoke test + dashboards + runbook |
| 12 | [Roadmap iOS TestFlight](./12-roadmap-ios-testflight.md) | Plano futuro (não executar) |

---

## Princípios

1. **Reaproveitar o máximo.** Nada no backend ou nas telas do mobile é reescrito.
2. **Documento = runbook.** Cada `.md` tem comandos copiáveis e critério objetivo.
3. **Produção única.** Um Supabase para produção, Docker local para dev. Sem staging nesta fase.
4. **Segurança por padrão.** Secrets em cofres apropriados, RLS ativa, `service_role` nunca no cliente.
5. **Reversibilidade.** Toda release tem caminho de rollback documentado.

---

## Para quem contribui

Se for adicionar um novo doc no pipeline:

- Numere sequencial (`13-…`, `14-…`).
- Siga a estrutura **Objetivo / Pré-requisitos / Passos / Verificação / Troubleshooting**.
- Adicione no índice acima.
- Mantenha a matriz de secrets do doc 01 em dia — qualquer secret novo entra lá.

---

## Status atual da implementação

Os documentos descrevem o **plano**. A execução real ainda não aconteceu — eles são o roteiro que você vai seguir. Para o que já existe hoje no repo (Supabase hospedado, app mobile funcional), veja `../../SETUP.md`.
