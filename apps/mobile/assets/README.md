# Mobile assets

Binary assets are not committed. Drop them here before running `expo start`.

## Fonts (`fonts/`) — required

Download and extract:

- `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`
  from https://rsms.me/inter/
- `Fraunces-SemiBold.ttf`, `Fraunces-Bold.ttf`
  from https://fonts.google.com/specimen/Fraunces

License: SIL OFL 1.1 (see `src/screens/AboutScreen.tsx` for credits).

## Sounds (`sounds/`) — optional in MVP

The sounds module no-ops gracefully if these files are missing. Uncomment the
matching entries in `src/lib/sounds.ts` once the files are in place.

- `roulette-tick.mp3` — looping tick during spin (~3s)
- `roulette-end.mp3` — thud when wheel stops (~400ms)
- `card-flip.mp3`
- `tap-soft.mp3`
- `success-chime.mp3`

Source recommendations: Freesound (CC0) or Pixabay (Pixabay License).

## App icon and splash — required for production builds

- `icon.png` — 1024×1024, opaque
- `adaptive-icon.png` — 1024×1024 foreground (Android)
- `splash.png` — centered logo on `#0C0906` background

For dev with `expo start`, the missing icon/splash falls back to Expo defaults.
