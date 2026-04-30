# 08 — Deploy da landing no Vercel

## Objetivo

Publicar `apps/web` no Vercel sob o subdomínio gratuito `spicy-game.vercel.app`, com deploys automáticos a cada push no `main` e previews em cada PR.

---

## Pré-requisitos

- Doc 07 concluído (landing roda localmente).
- Doc 01 concluído (conta Vercel criada, CLI instalada opcional).
- Repositório já no GitHub.

---

## Passos

### 1. Conectar o repo no dashboard do Vercel

Via navegador — jeito mais simples:

1. Acesse https://vercel.com/new.
2. "Import Git Repository" → selecione o repo `spicy-game`. Autorize o GitHub app do Vercel se for a primeira vez.
3. **Configure Project:**
   - **Project Name:** `spicy-game` → isso determina o subdomínio `spicy-game.vercel.app`.
   - **Framework Preset:** Next.js (auto-detectado).
   - **Root Directory:** `apps/web` ← **importante**, senão o Vercel tenta buildar na raiz do monorepo.
   - **Build Command:** deixar default (`next build`).
   - **Output Directory:** deixar default (`.next`).
   - **Install Command:** `bun install` (ou deixar auto — Vercel detecta `bun.lock`).
   - **Node Version:** 20.x.

### 2. Variáveis de ambiente no Vercel

Em **Project Settings → Environment Variables**, adicione para **Production** e **Preview**:

| Nome | Valor | Ambientes |
|---|---|---|
| `NEXT_PUBLIC_APK_URL` | URL estável do APK — ver passo 4 | Production, Preview |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` (ou o valor do `app.config.ts`) | Production, Preview |
| `NEXT_PUBLIC_POSTHOG_KEY` | `<POSTHOG_KEY>` | Production |
| `NEXT_PUBLIC_POSTHOG_HOST` | `<POSTHOG_HOST>` | Production |

> Não adicione `SUPABASE_*` — a landing **não** chama o Supabase. Só analytics e o link do APK.

### 3. Primeiro deploy

No dashboard → **Deploy**. O Vercel vai buildar e servir. Em ~2 min a URL fica ativa:

```
https://spicy-game.vercel.app
```

Abra no navegador → landing deve aparecer idêntica ao `localhost:3000`. Os screenshots/OG image funcionam direto do `apps/web/public/`.

### 4. Voltar para o Supabase e atualizar Site URL

Agora que você tem a URL de produção, volte ao **doc 03, seção 6** e atualize no dashboard do Supabase:

- **Authentication → URL Configuration → Site URL:** `https://spicy-game.vercel.app`
- **Additional Redirect URLs:** `https://spicy-game.vercel.app/*`, `spicy://`

Esse ajuste só é necessário uma vez — não precisa redeployar as edge functions.

### 5. Previews automáticos

Qualquer PR contra `main` gera uma URL `https://spicy-game-<hash>-<team>.vercel.app` automaticamente. O bot do Vercel comenta no PR. Útil para revisar mudanças de copy/visual antes de merge.

### 6. (Opcional) Domínio customizado

Se quiser migrar de `spicy-game.vercel.app` para `spicygame.com.br` no futuro:

1. Comprar domínio em registro.br / Cloudflare / Namecheap.
2. **Project Settings → Domains → Add** → insira o domínio.
3. Vercel mostra os registros DNS (A + CNAME) a configurar no seu registrar.
4. Depois de DNS propagar (até 24h), HTTPS é automático via Let's Encrypt.

Volte ao doc 03 e atualize o `Site URL` do Supabase novamente quando fizer essa troca.

---

## Verificação

- [ ] `https://spicy-game.vercel.app` abre e mostra a landing.
- [ ] Botão "Baixar APK" faz uma requisição para `/download/android` (ainda 404 até o doc 09).
- [ ] `/privacy`, `/terms`, `/support` abrem.
- [ ] Dashboard Vercel → **Deployments** mostra o build com status **Ready**.
- [ ] PostHog recebe visitas da landing (se você adicionou `PostHogProvider` no layout — passo opcional, adicione depois se quiser).

---

## Troubleshooting

- **Build falha no Vercel com "Cannot find module '@spicy-game/shared'":** você está tentando importar do shared no web. **Não faça isso** — o doc 02 deixa explícito que a landing não importa de `packages/shared`. Remova a import.
- **Build demora >5min:** Vercel grátis tem 45 min/build, então está ok. Se quiser otimizar, rode `bun run build` local antes para ver se há warnings que inflam tempo.
- **404 em `/download/android`:** esperado até o doc 09. Esse route handler é criado lá.
- **Imagens OG não aparecem no Facebook/Twitter:** use https://www.opengraph.xyz/ para testar. Pode levar até 24h para recaches propagarem. Force com `?v=2` no URL.
- **Vercel build usa npm em vez de bun:** force com um `vercel.json` em `apps/web/`:
  ```json
  { "installCommand": "bun install", "buildCommand": "bun run build" }
  ```

---

## Rollback

- **Redeployar versão anterior:** Dashboard → Deployments → escolher deploy antigo → `...` → **Promote to Production**.
- **Deletar o projeto:** Settings → Advanced → Delete Project. A URL `spicy-game.vercel.app` volta para o pool.
