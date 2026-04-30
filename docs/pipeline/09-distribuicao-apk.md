# 09 — Distribuição do APK

## Objetivo

Hospedar o APK gerado no doc 06 de forma versionada e expor um **link estável** na landing (`/download/android`) que sempre aponta para a versão mais recente. Assim você pode publicar `v1.0.0`, `v1.0.1`, etc. sem alterar o botão do site.

---

## Decisão: onde hospedar

| Opção | Prós | Contras |
|---|---|---|
| **GitHub Releases** (recomendado) | Gratuito, versionado, changelog automático, CDN bom | APK público (anyone com link baixa) |
| `apps/web/public/downloads/spicy-latest.apk` | Servido pelo Vercel (grátis até limite) | Sem histórico; sobrescrever mata versões antigas; egress do Vercel limitado |
| S3 / R2 próprio | Controle total | Custo + complexidade |

**Escolha: GitHub Releases.** Com um route handler no Next redirecionando para o asset da release mais recente, você tem link estável sem precisar hospedar binário no Vercel.

---

## Pré-requisitos

- Doc 06 concluído (APK gerado pelo EAS; URL ou arquivo local em mãos).
- Doc 08 concluído (landing no ar).
- `gh` CLI logada (`gh auth status`).

---

## Passos

### 1. Baixar o APK do EAS

```bash
cd apps/mobile
eas build:list --platform android --limit 1 --status finished --json | jq -r '.[0].artifacts.buildUrl' | xargs -I {} curl -L -o spicy-v1.0.0.apk "{}"
```

Agora você tem `apps/mobile/spicy-v1.0.0.apk` local. **Não commite.**

### 2. Criar GitHub Release

```bash
cd /caminho/para/spicy-game
gh release create v1.0.0 \
  apps/mobile/spicy-v1.0.0.apk \
  --title "Spicy Game 1.0.0" \
  --notes "Primeira versão pública. Baixe o APK e instale com 'Fontes desconhecidas' habilitado."
```

Isso:
- Cria a tag `v1.0.0` no repo.
- Sobe o APK como asset anexado.
- Gera uma URL de download direta estilo `https://github.com/<user>/spicy-game/releases/download/v1.0.0/spicy-v1.0.0.apk`.

### 3. Criar route handler de redirect

Em `apps/web/app/download/android/route.ts`:

```ts
import { NextResponse } from 'next/server';

const OWNER = 'SEU_USUARIO_GITHUB';
const REPO = 'spicy-game';

export const revalidate = 300; // cache de 5 min

export async function GET() {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Nenhuma release disponível' },
      { status: 503 }
    );
  }

  const release = await res.json();
  const apkAsset = release.assets?.find((a: { name: string }) => a.name.endsWith('.apk'));

  if (!apkAsset) {
    return NextResponse.json(
      { error: 'Release sem APK' },
      { status: 503 }
    );
  }

  return NextResponse.redirect(apkAsset.browser_download_url, 302);
}
```

Substitua `SEU_USUARIO_GITHUB` pelo seu handle. Esse handler:
- Consulta a API do GitHub pela release mais recente.
- Encontra o asset `.apk`.
- Faz 302 para a URL direta.
- Cacheia por 5 minutos — você não vai publicar release nova a cada minuto mesmo.

> Se o repo for **privado**, a API pública não retorna assets. Nesse caso, adicione um token de leitura (classic PAT scope `repo:read`) como `GITHUB_API_TOKEN` nos env vars do Vercel (não `NEXT_PUBLIC_` — secret de server).

### 4. Testar

Localmente:

```bash
cd apps/web
bun run dev
```

Abra `http://localhost:3000/download/android` → deve redirecionar para o GitHub e começar o download do APK.

Após `git push` e redeploy do Vercel:

```bash
curl -I https://spicy-game.vercel.app/download/android
# esperado: 302 → https://github.com/.../releases/download/v1.0.0/spicy-v1.0.0.apk
```

### 5. Script helper para releases futuras

Crie `scripts/publish-release.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:?uso: ./scripts/publish-release.sh <versao> [notes]}"
NOTES="${2:-Release automática}"

# Atualiza app.config.ts — opcional, só aviso:
echo "⚠️  Confirme que app.config.ts tem version: ${VERSION} antes de continuar."
read -rp "Prosseguir? [y/N] " ok
[[ "$ok" == "y" ]] || exit 1

# Baixa último APK do EAS
APK_URL=$(cd apps/mobile && eas build:list --platform android --limit 1 --status finished --json | jq -r '.[0].artifacts.buildUrl')
echo "Baixando APK: $APK_URL"
curl -L -o "spicy-${VERSION}.apk" "$APK_URL"

# Publica no GitHub
gh release create "v${VERSION}" \
  "spicy-${VERSION}.apk" \
  --title "Spicy Game ${VERSION}" \
  --notes "${NOTES}"

rm "spicy-${VERSION}.apk"
echo "✅ Release v${VERSION} publicada."
```

Torne executável: `chmod +x scripts/publish-release.sh`.

Uso:

```bash
./scripts/publish-release.sh 1.0.1 "Fix bug de entrar em sala"
```

### 6. Política de versionamento

- **SemVer** no `app.config.ts`. Patch `1.0.x` para hotfixes; minor `1.x.0` para features; major `2.0.0` para breaking.
- `android.versionCode` autoincrementa via `"autoIncrement": "versionCode"` no `eas.json` (doc 06). **Nunca decresça.**
- Releases do GitHub seguem `v<version>` — bate com `app.config.ts`.
- OTAs (doc 05) não criam release nova — atualizam o canal `production` do EAS Update silenciosamente.

---

## Verificação

- [ ] `gh release list` mostra `v1.0.0`.
- [ ] `curl -IL https://spicy-game.vercel.app/download/android` termina com 200 OK num host do GitHub.
- [ ] Clicar no botão "Baixar APK" na landing do celular inicia o download.
- [ ] APK baixado abre após instalação.

---

## Troubleshooting

- **Route handler retorna 503:** repo privado ou API rate-limited. Adicione `Authorization: Bearer <token>` no `fetch`.
- **APK baixado é 0 bytes:** o asset não subiu completo para a release. Rode `gh release view v1.0.0` e confira o tamanho do arquivo.
- **Android recusa instalar "app não verificado":** esperado em APK fora da Play Store. Usuário precisa habilitar "Fontes desconhecidas" nas configurações do app (Chrome, Drive, ou o que baixou).
- **Revalidate não atualiza após nova release:** o Vercel cacheia o `fetch`. Force: `curl "https://spicy-game.vercel.app/download/android?_=$(date +%s)"` para bypass, ou baixe o `revalidate` para 60s.

---

## Rollback

- Usuários que já baixaram o APK quebrado **não** são afetados por rollback — eles precisam receber OTA ou instalar versão nova.
- Para parar novos downloads do APK ruim:
  1. `gh release edit v1.0.1 --prerelease` (esconde de `releases/latest`).
  2. Ou `gh release delete v1.0.1 --yes`.
  3. O redirect do Vercel volta a apontar para a release anterior automaticamente (em até 5 min, por causa do `revalidate`).
