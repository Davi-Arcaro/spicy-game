# 05 — Features de produção: Sentry + PostHog + expo-updates

## Objetivo

Adicionar três camadas que **não existem hoje** mas são obrigatórias para um app público:

1. **Sentry** — captura de erros no mobile e nas edge functions.
2. **PostHog** — analytics de produto (funil de uso).
3. **expo-updates** — envio de patches OTA sem rebuild de APK.

Cada seção é auto-contida. Você pode implementar só uma delas se quiser pular as outras — mas recomenda-se fazer as três na sequência.

---

## Pré-requisitos

- Doc 01 concluído (contas Sentry + PostHog criadas, DSNs e keys em mãos).
- Doc 04 concluído (`app.config.ts` já estendido com `extra.sentryDsn`, `extra.posthogKey`, `runtimeVersion`, `plugins: [..., 'expo-updates']`).

---

## 5.1 Sentry

### 5.1.1 Mobile

Instalar:

```bash
cd apps/mobile
bun add @sentry/react-native
```

Rodar o post-install do Sentry (instrumenta o metro + expo plugin):

```bash
bunx @sentry/wizard@latest -s -i reactNative -p android --url https://sentry.io
```

Quando ele pedir o projeto, selecione `spicy-mobile`. O wizard cria/atualiza:
- `apps/mobile/sentry.properties` (auth token — adicione ao `.gitignore`!).
- Hooks no `metro.config.js`.

Criar `apps/mobile/src/lib/sentry.ts`:

```ts
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export function initSentry() {
  const dsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
  if (!dsn) {
    if (__DEV__) console.info('[sentry] DSN ausente — pulando init');
    return;
  }
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
  });
}

export { Sentry };
```

Editar `apps/mobile/App.tsx` — duas mudanças:

```ts
// 1. no topo, importar e inicializar antes de qualquer hook:
import { initSentry, Sentry } from '@/lib/sentry';
initSentry();

// 2. no final, trocar a export default:
export default Sentry.wrap(App);
```

### 5.1.2 Edge Functions

Criar `supabase/functions/_shared/sentry.ts`:

```ts
import * as Sentry from 'https://deno.land/x/sentry@8.32.0/index.mjs';

const dsn = Deno.env.get('SENTRY_DSN');

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: 'production',
  });
}

export function captureAndRethrow<T>(fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
  return fn().catch((err) => {
    if (tags) Sentry.setTags(tags);
    Sentry.captureException(err);
    throw err;
  });
}

export { Sentry };
```

Em cada uma das 10 edge functions, envolver o handler principal:

```ts
// exemplo: supabase/functions/create_room/index.ts
import { captureAndRethrow } from '../_shared/sentry.ts';

Deno.serve((req) =>
  captureAndRethrow(
    () => handler(req),   // handler já existente
    { function: 'create_room' }
  )
);
```

> Se `SENTRY_DSN` não estiver setado (`supabase secrets list` do doc 03), o helper vira no-op.

Redeploy das functions:

```bash
for fn in advance_turn create_room draw_card join_room leave_room list_decks spin_roulette start_game submit_action update_profile; do
  supabase functions deploy "$fn"
done
```

### 5.1.3 Verificação Sentry

Dispare um erro de propósito no mobile:

```tsx
// temporariamente em WelcomeScreen.tsx
import { Sentry } from '@/lib/sentry';
<Button onPress={() => { throw new Error('sentry test') }}>Test Sentry</Button>
```

Abra o app, toque no botão → abra https://sentry.io/issues/ e confirme que o evento apareceu em `spicy-mobile`. Depois **remova o botão**.

Para edge function: chame `create_room` com payload inválido propositalmente (ex: `displayName: ''`). Deve aparecer em `spicy-edge`.

---

## 5.2 PostHog

### 5.2.1 Mobile

Instalar:

```bash
cd apps/mobile
bun add posthog-react-native
```

Criar `apps/mobile/src/lib/analytics.ts`:

```ts
import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

let client: PostHog | null = null;

export async function initAnalytics() {
  const key = Constants.expoConfig?.extra?.posthogKey as string | undefined;
  const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
  if (!key) return;

  client = await PostHog.initAsync(key, {
    host: host ?? 'https://us.i.posthog.com',
    captureAppLifecycleEvents: true,
    flushInterval: 20, // segundos
  });

  const { data } = await supabase.auth.getUser();
  if (data.user) client.identify(data.user.id);
}

export function capture(event: string, props?: Record<string, unknown>) {
  client?.capture(event, props);
}
```

Editar `apps/mobile/App.tsx` para chamar dentro do `useEffect` de boot:

```ts
import { initAnalytics } from '@/lib/analytics';

useEffect(() => {
  Promise.all([preloadSounds(), initAnalytics()]).finally(() => setSoundsReady(true));
}, []);
```

Instrumentar `apps/mobile/src/lib/api.ts` — adicionar no topo:

```ts
import { capture } from './analytics';
```

Decorar cada método do `api` com um `.then()` (exemplo para `createRoom`):

```ts
createRoom: async (input: CreateRoomInput) => {
  const res = await call<CreateRoomInput, RoomEnvelope>('create_room', createRoomSchema, input);
  capture('room_created', { roomId: res.room.id, mode: input.mode });
  return res;
},
```

**Eventos a capturar (mínimo):**

| Método | Evento | Props |
|---|---|---|
| `createRoom` | `room_created` | `roomId`, `mode`, `intensityMax` |
| `joinRoom` | `room_joined` | `roomId`, `code` |
| `startGame` | `game_started` | `roomId`, `playerCount` |
| `drawCard` | `card_drawn` | `roomId`, `cardType` |
| `spinRoulette` | `roulette_spun` | `roomId`, `outcomeKind` |
| `submitAction` | `action_submitted` | `roomId`, `actionType` |
| `leaveRoom` | `room_left` | `roomId` |

Adicione também um evento `app_opened` no `initAnalytics()` (o PostHog já captura `$app_opened` automaticamente com `captureAppLifecycleEvents: true` — confirme no dashboard).

### 5.2.2 Edge Functions

PostHog server-side é opcional — o mobile já dispara a maioria dos eventos relevantes. **Pule esta subseção na primeira iteração.** Se quiser adicionar depois, use `posthog-node` via import do JSR no Deno.

### 5.2.3 Verificação PostHog

Abra o app, crie uma sala. No dashboard PostHog → **Activity** você deve ver `room_created` aparecendo em <1 minuto.

---

## 5.3 expo-updates (OTA)

### 5.3.1 Instalação

```bash
cd apps/mobile
bunx expo install expo-updates
```

O `app.config.ts` já foi atualizado no doc 04 com `runtimeVersion` e `updates.url`. Não precisa mexer aqui.

### 5.3.2 Configurar canais

Depois do `eas init` (doc 06), configure:

```bash
cd apps/mobile
eas update:configure
```

Isso cria dois canais automáticos: `production` e `preview`. O `eas.json` (doc 06) já vai mapear cada perfil para seu canal.

### 5.3.3 Receber updates no app

Nenhum código adicional no app é necessário — o `expo-updates` baixa e aplica automaticamente no próximo cold start. Para checagens manuais (opcional), em `apps/mobile/App.tsx`:

```ts
import * as Updates from 'expo-updates';

useEffect(() => {
  if (__DEV__) return;
  Updates.checkForUpdateAsync()
    .then((res) => res.isAvailable && Updates.fetchUpdateAsync())
    .then((res) => res?.isNew && Updates.reloadAsync())
    .catch(() => {});
}, []);
```

### 5.3.4 Publicar um update

Depois que o primeiro APK de produção estiver rodando (doc 06):

```bash
cd apps/mobile
eas update --branch production --message "ajuste de texto na Welcome"
```

Isso publica o JS/assets. Na próxima abertura do app, o usuário recebe.

### 5.3.5 Rollback

```bash
eas update:rollback --branch production
```

Volta para o update anterior. Útil quando você publica um bug.

### 5.3.6 Quando NÃO é OTA — precisa novo APK

- Mudou alguma dependência nativa (`@sentry/react-native`, `posthog-react-native`, etc.).
- Mudou `runtimeVersion` (policy `appVersion`: qualquer bump de `version` força novo APK).
- Mudou permissões, `Info.plist`, `AndroidManifest`.

Quando em dúvida, rode `bunx expo-doctor` e ele aponta.

---

## Verificação consolidada

- [ ] `apps/mobile/src/lib/sentry.ts` existe.
- [ ] `apps/mobile/src/lib/analytics.ts` existe.
- [ ] `apps/mobile/App.tsx` chama `initSentry()`, `initAnalytics()` e exporta `Sentry.wrap(App)`.
- [ ] `apps/mobile/src/lib/api.ts` tem `capture(...)` em cada método público do `api.*`.
- [ ] `supabase/functions/_shared/sentry.ts` existe.
- [ ] As 10 edge functions foram redeployadas após envolver o handler.
- [ ] `bun --filter './apps/mobile' typecheck` passa.
- [ ] Evento de teste apareceu em Sentry e em PostHog.

---

## Troubleshooting

- **`posthog-react-native` quebra o Metro:** adicione ao `metro.config.js` a resolução de `uuid` se der erro de `crypto.getRandomValues`. PostHog documenta o fix na versão atual.
- **Sentry wizard substitui o `metro.config.js` existente:** revise o diff com `git diff apps/mobile/metro.config.js` antes de commitar — preserve customizações do projeto.
- **OTA não aplica:** `runtimeVersion` do bundle publicado não bate com o do APK instalado. Confirme `eas update:list` vs `version` do app instalado.
- **Sentry com source maps ruins (stack trace sem nomes):** o wizard instala o plugin `@sentry/react-native/metro` — confirme com `grep -r '@sentry' apps/mobile/metro.config.js`. O upload de source maps acontece no build EAS (doc 06).
- **PostHog eventos não chegam:** confirme `POSTHOG_HOST` bate com a região do seu projeto (us vs eu).
