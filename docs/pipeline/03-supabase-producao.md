# 03 — Supabase em produção

## Objetivo

Deixar o projeto Supabase hospedado (`fuhjywhulyojxpiphakv`, região `sa-east-1`) com:

- Todas as **10 migrations** aplicadas.
- **Seed** de decks e cartas carregado.
- As **10 Edge Functions** publicadas.
- **Auth** configurada (anônima + URLs corretas do Vercel).
- **Secrets** configurados para as edge functions (Sentry, PostHog).
- **RLS** confirmada em todas as tabelas públicas.

---

## Pré-requisitos

- Doc 01 concluído (Supabase CLI instalada, login feito, secrets em mãos).
- Docker **não** é necessário aqui — vamos operar o projeto remoto direto.

---

## Passos

### 1. Login e link com o projeto remoto

```bash
cd /caminho/para/spicy-game
supabase login
supabase link --project-ref fuhjywhulyojxpiphakv
```

> Se `supabase login` travar no browser, use `supabase login --token <TOKEN>` com um token gerado em https://supabase.com/dashboard/account/tokens.

Confirme o link:

```bash
supabase projects list
# O projeto com ref fuhjywhulyojxpiphakv deve aparecer marcado como linked.
```

### 2. Aplicar as 10 migrations

```bash
supabase db push
```

Saída esperada: cada arquivo em `supabase/migrations/` é enviado e confirmado. Se houver conflito com o estado remoto, rode:

```bash
supabase migration list
```

Compare local × remoto. Se remoto tem migrations que local não tem (resquício de testes anteriores), **não** force `db push` — pergunte antes. Geralmente `supabase migration repair --status reverted <timestamp>` limpa linhas pendentes.

### 3. Aplicar o seed (decks + cartas iniciais)

`supabase db push` **não** aplica `seed.sql` em projetos hospedados (só em `db reset` local). Aplique manualmente:

```bash
# pegue a string de conexão do dashboard:
# Dashboard → Project Settings → Database → Connection string (URI, modo "Session")
export DATABASE_URL="postgresql://postgres:<SENHA>@db.fuhjywhulyojxpiphakv.supabase.co:5432/postgres"

psql "$DATABASE_URL" -f supabase/seed.sql
```

> Alternativa sem `psql` local: copie o conteúdo de `supabase/seed.sql` e cole no **SQL Editor** do dashboard.

### 4. Deploy das 10 Edge Functions

```bash
for fn in advance_turn create_room draw_card join_room leave_room list_decks spin_roulette start_game submit_action update_profile; do
  supabase functions deploy "$fn"
done
```

Cada deploy retorna a URL pública (`https://fuhjywhulyojxpiphakv.functions.supabase.co/<fn>`) e deve terminar em `Deployed Function`.

### 5. Secrets das Edge Functions

Sentry + PostHog para instrumentar o backend (doc 05):

```bash
supabase secrets set \
  SENTRY_DSN="<SENTRY_DSN_EDGE>" \
  POSTHOG_KEY="<POSTHOG_KEY>" \
  POSTHOG_HOST="<POSTHOG_HOST>"
```

Confira:

```bash
supabase secrets list
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são **injetados automaticamente** pelo runtime — não precisa configurar.

### 6. Auth: URLs de produção

No dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://spicy-game.vercel.app`
  - Se ainda não publicou no Vercel (docs 07/08), use `http://localhost:3000` temporariamente e volte aqui depois.
- **Redirect URLs (Additional):**
  - `https://spicy-game.vercel.app/*`
  - `spicy://` (scheme do app mobile — veja `apps/mobile/app.config.ts`)
- **Anonymous sign-ins:** **habilitado** (já vem do `config.toml` local, confirme no dashboard em **Authentication → Providers → Anonymous**).

### 7. Verificação de RLS

No SQL Editor, rode:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Todas as linhas devem ter `rowsecurity = true`.** Se alguma estiver `false`, rastreie na migration `20260423000007_rls_policies.sql` e reaplique.

---

## Verificação end-to-end

### A. Listar decks via anon key

```bash
curl -X POST \
  "https://fuhjywhulyojxpiphakv.functions.supabase.co/list_decks" \
  -H "Authorization: Bearer <EXPO_PUBLIC_SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Esperado: `{"data":{"decks":[{...},{...}]},"error":null}` com os decks do seed.

### B. Contagem de cartas

No SQL Editor:

```sql
SELECT deck_slug, count(*) as cartas
FROM public.cards
GROUP BY deck_slug
ORDER BY deck_slug;
```

Esperado: uma linha por deck definido no seed, cada uma com >0 cartas.

---

## Troubleshooting

- **`supabase db push` falha com `relation already exists`:** estado remoto diverge do local. Rode `supabase migration list` para comparar e use `supabase migration repair` em vez de forçar.
- **Edge Function retorna `500 Internal Server Error`:** rode `supabase functions logs <fn> --tail` e procure o stack trace. Cheque se todos os secrets da seção 5 estão setados.
- **`list_decks` retorna `[]` vazio:** o seed não foi aplicado. Volte ao passo 3.
- **Auth retorna `400` no app:** `Site URL` no dashboard não bate com o scheme do app. Revisite a seção 6.
- **`permission denied for table X`:** RLS está ativa mas a policy não cobre o caso de uso. Reconfira migration 07. Nenhuma edge function usa `service_role` — todas operam com a JWT do usuário.

---

## Rollback

Se uma migration aplicou algo quebrado:

1. Escreva uma migration nova que desfaz a anterior (nunca edite migration já aplicada).
2. `supabase db push` aplica a correção.

Para Edge Functions: `supabase functions deploy <fn>` reimplanta a versão local. Não há "rollback" automático — o deploy anterior fica disponível em `Dashboard → Edge Functions → <fn> → Deployments` e pode ser promovido manualmente.
