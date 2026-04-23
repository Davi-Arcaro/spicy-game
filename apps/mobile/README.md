# Spicy — mobile app

React Native + Expo client for the Spicy party game.

## Setup

```bash
# from monorepo root
bun install

# create .env in apps/mobile/
cp apps/mobile/.env.example apps/mobile/.env
# fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
# (run `supabase status` in repo root to grab the local anon key)

# start supabase
bun db:start

# in another terminal, start metro
bun mobile
```

## First-run notes

1. **Fonts** are not committed. Drop the Inter and Fraunces TTFs into
   `assets/fonts/` and uncomment the entries in `src/lib/fonts.ts`. Without
   them the app falls back to system fonts.
2. **Sounds** are optional. See `assets/README.md`.
3. **App icon and splash** are not committed. `expo start` will fall back to
   Expo defaults until they are added.

## Project layout

```
src/
├── theme/          design tokens (palette, colors, typography, …)
├── lib/            supabase client, api wrapper, sounds, storage, fonts
├── components/     primitives + game UI building blocks
├── screens/        Welcome → ProfileSetup → Home → CreateRoom → Lobby → Playing → Summary
├── navigation/     React Navigation native-stack
└── state/          ProfileContext, RoomContext (realtime via supabase channels)
```

## Architecture decisions

- **No mocked DB:** the app talks to real Supabase edge functions wrapped in
  `src/lib/api.ts`. Schema lives in `packages/shared`.
- **Anonymous auth:** `ensureAnonymousSession()` runs on bootstrap; the JWT is
  refreshed automatically by `supabase-js` and persisted via AsyncStorage.
- **Realtime room state:** `RoomContext` subscribes to `postgres_changes` on
  `rooms` and `room_players`, plus a presence channel for online dots.
- **Theme via Context:** dark mode follows the OS (`useColorScheme`); no
  manual toggle in MVP.
- **Idempotency:** `create_room` and `join_room` send a UUID `idempotencyKey`
  so retries are safe.
```
