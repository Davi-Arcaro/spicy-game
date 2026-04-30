# spicy-game

Jogo que desenvolvi para jogar com amigos.

## 📚 Documentação

- [`SETUP.md`](./SETUP.md) — como rodar o projeto em dev (Bun + Expo + Supabase local).
- [`docs/pipeline/`](./docs/pipeline/README.md) — **passo a passo para publicar em produção** (Supabase hospedado + APK Android via EAS + landing no Vercel).

## 📦 Publicação

Para colocar o jogo no ar, siga os documentos numerados em [`docs/pipeline/`](./docs/pipeline/README.md) na ordem. O pipeline cobre:

1. Pré-requisitos e contas (Expo, Vercel, Sentry, PostHog).
2. Deploy do backend no Supabase.
3. Config de produção do app mobile.
4. Sentry + PostHog + OTA via expo-updates.
5. Build do APK Android via EAS.
6. Landing em Next.js publicada no Vercel.
7. Distribuição do APK via GitHub Releases + redirect estável.
8. CI/CD e monitoramento.

iOS/TestFlight é roadmap (documento 12).

