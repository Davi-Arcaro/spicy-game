# 04 — Configuração do mobile para produção

## Objetivo

Deixar o `apps/mobile` pronto para ser empacotado como **APK de produção**:

- Variáveis de ambiente apontando para o Supabase hospedado.
- `app.config.ts` com metadados de release (versão, ícone, splash, runtime version, updates).
- Assets mínimos (ícone, splash, adaptive icon) no lugar.

> Este doc **não** faz o build — só prepara. O build vem no doc 06.

---

## Pré-requisitos

- Doc 01 concluído.
- Doc 03 concluído (você precisa de `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` reais).
- EAS CLI logada (`eas whoami` funciona).

---

## Passos

### 1. Criar `.env.production`

Arquivo `apps/mobile/.env.production` (NÃO commitar — já está coberto pelo `.gitignore` raiz; confirme que `.env*` está ignorado):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://fuhjywhulyojxpiphakv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OQnaMXHfhyQ9phhbI_y1nw_8AeJ1ASv

EXPO_PUBLIC_SENTRY_DSN=<SENTRY_DSN_MOBILE>
EXPO_PUBLIC_POSTHOG_KEY=<POSTHOG_KEY>
EXPO_PUBLIC_POSTHOG_HOST=<POSTHOG_HOST>
```

Para dev local contra Supabase Docker, mantenha o `apps/mobile/.env` com valores locais (já documentado em `SETUP.md §5`).

### 2. Estender `apps/mobile/app.config.ts`

Substitua o arquivo inteiro por:

```ts
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Spicy',
  slug: 'spicy-game',
  scheme: 'spicy',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0C0906',
  },
  assetBundlePatterns: ['**/*'],
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID ?? ''}`,
    fallbackToCacheTimeout: 0,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.spicygame.app',
    buildNumber: '1',
  },
  android: {
    package: 'com.spicygame.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0C0906',
    },
  },
  plugins: ['expo-font', 'expo-audio', 'expo-asset', 'expo-updates'],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
  },
  experiments: {
    typedRoutes: false,
  },
};

export default config;
```

**O que mudou:**

| Campo | Antes | Agora | Por quê |
|---|---|---|---|
| `version` | `0.0.1` | `1.0.0` | Primeira versão pública. SemVer a partir daqui. |
| `icon`, `splash`, `android.adaptiveIcon` | comentados | ativos | Obrigatórios para APK publicável. |
| `runtimeVersion` | ausente | `{ policy: 'appVersion' }` | Exigido por `expo-updates`. OTA só aplica se `version` bate. |
| `updates.url` | ausente | `https://u.expo.dev/<projectId>` | Endpoint do EAS Update. |
| `android.versionCode` | ausente | `1` | Obrigatório para Android. O EAS autoincrementa a partir daqui. |
| `ios.buildNumber` | ausente | `'1'` | Equivalente iOS (mesmo não buildando iOS agora — fica pronto). |
| `plugins` | 3 | +`expo-updates` | Registra o plugin nativo do OTA. |
| `extra` | 2 vars | +`sentryDsn`, `posthogKey`, `posthogHost`, `eas.projectId` | Exposição controlada das envs no bundle. |

> O `EAS_PROJECT_ID` ainda está vazio. Será preenchido no doc 06 via `eas init`. Até lá, `updates.url` fica inválido — isso é esperado.

### 3. Gerar os assets

**Opção A — gerar a partir de um único PNG:** o pacote `@expo/image-utils` vem no projeto via Expo CLI.

```bash
# crie um PNG 1024×1024 em apps/mobile/assets/source-icon.png com o logo do Spicy
cd apps/mobile
bunx expo-cli prebuild --help   # só garante CLI disponível
```

Use qualquer ferramenta (Figma, Photopea, Canva) para gerar:

- `apps/mobile/assets/icon.png` — **1024×1024**, PNG, fundo opaco.
- `apps/mobile/assets/adaptive-icon.png` — **1024×1024**, PNG, **só o foreground** (o background é cor sólida `#0C0906`). Deixe margem de segurança: o conteúdo importante deve caber num círculo centralizado com ~66% do lado.
- `apps/mobile/assets/splash.png` — **1284×2778** (proporção de iPhone Pro Max; o Android redimensiona). PNG com logo centralizado sobre `#0C0906`.

**Opção B — placeholder temporário:** gere via [`expo-icon-generator`](https://buildicon.com/) ou exporte do Figma. Para o primeiro build, até um logo monocromático sobre o fundo escuro já serve.

### 4. Confirmar que `.gitignore` cobre as envs

Verifique que `apps/mobile/.env*` está em `.gitignore` (raiz ou por pasta). Se não estiver, adicione:

```bash
# .gitignore (raiz)
apps/mobile/.env
apps/mobile/.env.*
!apps/mobile/.env.example
```

Opcional: crie `apps/mobile/.env.example` com as chaves **sem valores** para servir de template.

---

## Verificação

### A. Typecheck

```bash
bun --filter './apps/mobile' typecheck
```

Deve passar. Se reclamar de tipos no `app.config.ts`, revise a seção 2.

### B. Prebuild dry-run (sem instalar pods)

```bash
cd apps/mobile
bunx expo prebuild --platform android --clean --no-install
```

Esperado: gera `apps/mobile/android/` usando os assets e o bundle identifier. Se falhar com "icon.png not found", o passo 3 está incompleto.

Depois apague a pasta gerada (`rm -rf apps/mobile/android`) — o EAS gera isso dentro do build dele, não precisamos commitar.

### C. Run no Expo Go apontando para produção

```bash
cd apps/mobile
# use o .env.production
cp .env.production .env
bun run dev
```

Escaneie o QR code, crie uma sala, jogue um round. Se funciona, a config de produção está batendo.

> Lembre de voltar o `.env` para dev depois: `cp .env.production.example .env` ou similar — ou simplesmente apague.

---

## Troubleshooting

- **`Unable to resolve "./assets/icon.png"`:** o passo 3 não foi feito. Expo exige que os PNGs existam antes de qualquer build.
- **App abre mas telas ficam em branco:** `.env.production` tem URL errada. Confirme que `EXPO_PUBLIC_SUPABASE_URL` aponta para `https://fuhjywhulyojxpiphakv.supabase.co` (e não `http://`).
- **`EAS_PROJECT_ID` vazio no log:** normal até o doc 06. Não bloqueia typecheck nem Expo Go.
- **Splash screen some instantâneo:** em dev o Expo esconde rápido. Em prod, o `App.tsx` controla com `SplashScreen.hideAsync()` após fontes+sons carregarem.
- **Ícone adaptativo "cortado" no launcher:** foreground PNG tem conteúdo colado na borda. Refaça com mais margem (seção 3).

---

## O que NÃO fazer aqui

- Não criar `apps/mobile/src/lib/sentry.ts` ainda — isso é doc 05.
- Não rodar `eas build` — isso é doc 06.
- Não commitar `.env.production` — esse arquivo vive só na sua máquina e nos EAS secrets.
