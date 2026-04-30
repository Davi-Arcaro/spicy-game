# 06 — EAS Build: APK Android de produção

## Objetivo

Gerar o **primeiro APK assinado** do Spicy Game usando o EAS Build na nuvem. O artefato final é um `.apk` hospedável (doc 09) que o usuário baixa da landing e instala no celular.

---

## Pré-requisitos

- Docs 01, 03, 04, 05 concluídos.
- `eas whoami` retorna seu usuário.
- Assets (`icon.png`, `splash.png`, `adaptive-icon.png`) existem em `apps/mobile/assets/`.

---

## Passos

### 1. Inicializar o projeto no EAS

```bash
cd apps/mobile
eas init
```

Quando perguntar `"Would you like to create a new project?"`, confirme. Isso:
- Cria o projeto em https://expo.dev/accounts/<user>/projects/spicy-game.
- Escreve o `projectId` em `app.config.ts` via `extra.eas.projectId` (você já deixou o placeholder no doc 04).

Confirme que o valor foi injetado:

```bash
grep projectId app.config.ts
```

> Se o `eas init` não injetou automaticamente, copie o UUID retornado e cole no fallback do `process.env.EAS_PROJECT_ID` — ou defina a env antes do build.

### 2. Configurar `expo-updates` no EAS

```bash
eas update:configure
```

Cria os canais `production` e `preview` e adiciona entradas de `channel` no `eas.json` (se ele já existir; senão cria).

### 3. Criar `apps/mobile/eas.json`

Substitua o arquivo gerado pelo wizard por esta versão final:

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "http://10.0.2.2:54321",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": ""
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://fuhjywhulyojxpiphakv.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_OQnaMXHfhyQ9phhbI_y1nw_8AeJ1ASv",
        "EXPO_PUBLIC_SENTRY_DSN": "",
        "EXPO_PUBLIC_POSTHOG_KEY": "",
        "EXPO_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com"
      }
    },
    "production": {
      "distribution": "internal",
      "channel": "production",
      "autoIncrement": "versionCode",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://fuhjywhulyojxpiphakv.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_OQnaMXHfhyQ9phhbI_y1nw_8AeJ1ASv",
        "EXPO_PUBLIC_SENTRY_DSN": "",
        "EXPO_PUBLIC_POSTHOG_KEY": "",
        "EXPO_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

> **Importante:** os campos `EXPO_PUBLIC_SENTRY_DSN` e `EXPO_PUBLIC_POSTHOG_KEY` estão vazios no `eas.json`. Preencha-os via **EAS Secrets** (próximo passo) — nunca commite chaves no repo. O `eas build` lê os secrets e injeta no build.

### 4. Configurar EAS Secrets (valores sensíveis)

```bash
cd apps/mobile
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "<SENTRY_DSN_MOBILE>"
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_KEY --value "<POSTHOG_KEY>"
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "<SENTRY_AUTH_TOKEN>"
```

Confirme:

```bash
eas secret:list
```

### 5. Gerenciar keystore (Android signing)

```bash
eas credentials
```

Fluxo interativo: escolha `Android` → `production` → `Set up a new keystore`. O EAS gera e guarda para você.

Backup do keystore (opcional mas **recomendado** — se você perder, não consegue publicar updates assinados pela mesma identidade):

```bash
eas credentials
# → Android → production → Keystore → Download credentials
```

Guarde o `.jks` + senha num cofre seguro.

### 6. Primeiro build de produção

```bash
cd apps/mobile
eas build --profile production --platform android
```

O EAS:
- Sobe o código para a nuvem.
- Instala deps (`bun install`).
- Roda prebuild (gera `android/`).
- Compila com Gradle.
- Envia source maps para o Sentry (se o plugin foi instalado pelo wizard no doc 05).
- Retorna URL do APK (ex: `https://expo.dev/artifacts/eas/abc123.apk`).

**Tempo:** 10–20 minutos na fila grátis.

### 7. Testar o APK

Baixe o APK no celular Android (via URL retornada) e instale (habilitar "Fontes desconhecidas" nas configurações). Abra o app:

- [ ] Logo e splash corretos.
- [ ] Welcome abre.
- [ ] Criar sala funciona.
- [ ] Entrar com 2º dispositivo (Expo Go ou outro APK) funciona.
- [ ] Jogar um round até `submit_action`.
- [ ] PostHog recebe `room_created`, `game_started`.
- [ ] Sentry não recebe erro (se receber, investigar antes de publicar).

---

## Build preview (para QA rápido)

```bash
eas build --profile preview --platform android
```

Mesmo que production, mas com canal `preview` — você pode publicar OTAs no preview sem afetar usuários de produção.

---

## Verificação

- [ ] `eas.json` existe em `apps/mobile/eas.json`.
- [ ] `eas secret:list` mostra as 3 secrets.
- [ ] `eas build --profile production --platform android` conclui com sucesso.
- [ ] APK instalado no celular abre sem crash.
- [ ] Build aparece em https://expo.dev/accounts/<user>/projects/spicy-game/builds.

---

## Troubleshooting

- **Build falha em `bun install`:** EAS usa Node/yarn por padrão. O `bun install` é detectado via `bun.lock` no repo. Confirme que `bun.lock` existe na raiz. Se o EAS ainda tentar yarn, adicione `"packageManager": "bun@1.1"` ao `package.json` raiz.
- **Build falha no Gradle com `:app:processReleaseGoogleServices`:** você não precisa de Google Services (Firebase) — remova qualquer plugin residual. O `app.config.ts` não lista Firebase.
- **APK instala mas crasha ao abrir:** rode `adb logcat | grep -i spicy` durante o boot para capturar o stack trace. Mais comum: env var vazia no `.env.production`/EAS secret.
- **`app.json` conflita com `app.config.ts`:** se existir um `app.json` legado, apague-o — o config.ts é a fonte de verdade.
- **Fila EAS demorada:** tier grátis compartilha workers. Para acelerar pontualmente, considere o `eas build --local` (requer Android Studio + JDK 17 na máquina — não recomendado para o primeiro build).

---

## Rollback

Para "despublicar" um APK:

- Dele o artefato em `expo.dev → Builds → <build>` (opcional, só esconde do painel).
- Remova/substitua o APK no GitHub Release (doc 09) — é isso que o usuário baixa de fato.
- Publique OTA de hotfix (`eas update --branch production`) se o bug é só em JS.
