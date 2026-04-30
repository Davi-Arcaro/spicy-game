# 10 — CI/CD com GitHub Actions

## Objetivo

Adicionar automação leve no repositório:

- **CI em PRs:** typecheck do mobile, build do web, evitando mergear código quebrado.
- **Workflow manual de release:** disparar um `eas build --profile production` pelo GitHub e receber a URL do APK no commit.

> **O que não está aqui:** deploy do Vercel (automático via GitHub App, doc 08) e deploy de Edge Functions (manual no doc 03). Intencional — over-engineering para esta fase.

---

## Pré-requisitos

- Docs 06 e 08 concluídos.
- Secrets da seção 3 do doc 01 coletadas.

---

## Passos

### 1. Configurar GitHub Secrets

No repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Nome | Valor |
|---|---|
| `EXPO_TOKEN` | Token gerado em https://expo.dev/accounts/<user>/settings/access-tokens |
| `SENTRY_AUTH_TOKEN` | Token do doc 01 (scope `project:releases`) |

> `GITHUB_TOKEN` já é injetado automaticamente. Não precisa configurar.

### 2. CI workflow — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  mobile-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.1
      - name: Install
        run: bun install --frozen-lockfile
      - name: Typecheck
        run: bun --filter @spicy-game/mobile typecheck

  web-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.1
      - name: Install
        run: bun install --frozen-lockfile
      - name: Build web
        working-directory: apps/web
        env:
          NEXT_PUBLIC_APK_URL: https://example.com/spicy.apk
          NEXT_PUBLIC_APP_VERSION: 1.0.0
        run: bun run build

  shared-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - name: Typecheck shared
        run: bunx tsc -p packages/shared/tsconfig.json --noEmit
```

> Os jobs rodam em paralelo. Se um falha, o PR é bloqueado (configurar branch protection em `Settings → Branches`).

### 3. Release APK workflow — `.github/workflows/release-apk.yml`

```yaml
name: Release APK

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Versão (ex: 1.0.1)'
        required: true
        type: string
      notes:
        description: 'Changelog'
        required: false
        default: 'Nova release'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.1

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install EAS CLI
        run: npm i -g eas-cli

      - name: Install deps
        run: bun install --frozen-lockfile

      - name: Trigger EAS build
        working-directory: apps/mobile
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        run: |
          BUILD_URL=$(eas build --profile production --platform android --non-interactive --json --wait | jq -r '.[0].artifacts.buildUrl')
          echo "BUILD_URL=$BUILD_URL" >> "$GITHUB_ENV"
          echo "Built: $BUILD_URL"

      - name: Download APK
        run: |
          curl -L -o "spicy-${{ inputs.version }}.apk" "$BUILD_URL"

      - name: Create GitHub Release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh release create "v${{ inputs.version }}" \
            "spicy-${{ inputs.version }}.apk" \
            --title "Spicy Game ${{ inputs.version }}" \
            --notes "${{ inputs.notes }}"
```

Uso:
1. GitHub → **Actions** → **Release APK** → **Run workflow**.
2. Preencher versão (ex: `1.0.1`) e changelog.
3. Aguardar (~15–20 min — EAS build + upload).
4. Release aparece em `Releases` com o APK anexado.

> Esse workflow usa `--wait`, bloqueando o runner até o EAS terminar. Se você quiser economizar minutos do runner, use `--no-wait` e um segundo workflow que é disparado por webhook do EAS — mas isso é otimização prematura nesta fase.

### 4. Branch protection (opcional mas recomendado)

**Settings → Branches → Add rule** para `main`:
- Require status checks: `mobile-typecheck`, `web-build`, `shared-typecheck`.
- Require PRs before merging.
- Require branches up to date.

---

## Verificação

- [ ] Abrir um PR → os 3 jobs rodam e retornam verde.
- [ ] Commit direto em `main` → os jobs rodam (defensivo).
- [ ] Actions → Release APK → manual dispatch completa e cria release.
- [ ] `gh run list` mostra histórico.

---

## Troubleshooting

- **`EXPO_TOKEN` inválido:** regenere em https://expo.dev/settings/access-tokens e atualize o secret.
- **`bun install --frozen-lockfile` falha:** `bun.lock` está dessincronizado com `package.json`. Rode `bun install` local, commit o lockfile.
- **Job `web-build` reclama de variáveis faltando:** as `NEXT_PUBLIC_*` definidas no `env:` do workflow são suficientes para o build. Para **runtime**, o Vercel usa suas próprias envs (doc 08).
- **EAS build manual dispatch não cria release:** cheque `gh run view <id> --log-failed`. Mais comum: APK URL veio vazio porque build EAS falhou — verifique `expo.dev/builds`.
- **Rate limit da API do GitHub:** com `GITHUB_TOKEN` você tem 1000 req/h — mais que suficiente para CI comum.

---

## Custo operacional

- **Actions:** repos públicos têm runners grátis. Privados têm 2000 min/mês grátis no plano Free — um release gasta ~20 min, então ~100 releases/mês cabem.
- **EAS:** 30 builds/mês grátis. Se passar, é $29/mês (plano Expo Production).
