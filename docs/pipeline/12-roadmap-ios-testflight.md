# 12 — Roadmap: iOS via TestFlight

> **Não executar agora.** Este documento descreve o que fazer **quando** você decidir abrir iOS. Por hora, o Spicy Game é Android-only.

---

## Objetivo futuro

Distribuir o Spicy Game em iOS usando **TestFlight**: você convida testadores por e-mail ou link público, eles instalam pelo app TestFlight oficial da Apple. Sem necessidade de publicar na App Store.

TestFlight exige conta Apple Developer ($99/ano) mas **não** exige aprovação da App Store — só uma revisão rápida ("Beta App Review") que leva 1–2 dias.

---

## Pré-requisitos (quando for a hora)

1. **Conta Apple Developer Program** — $99/ano em https://developer.apple.com/programs/.
2. **Mac** (ou máquina com Xcode) — necessário para o primeiro `eas submit` configurar credenciais de signing. Depois disso, não precisa mais.
3. Doc 06 concluído (EAS Build já funcional para Android).

---

## Passos

### 1. Apple Developer onboarding

1. Criar Apple ID (se não tiver).
2. Enrolar no Apple Developer Program em https://developer.apple.com/account.
3. Aguardar 24–48h para aprovação.

### 2. App Store Connect — criar o app

1. Login em https://appstoreconnect.apple.com.
2. **Apps → `+` → New App**.
3. Preencher:
   - **Platform:** iOS.
   - **Name:** Spicy Game.
   - **Primary language:** Portuguese (Brazil).
   - **Bundle ID:** criar `com.spicygame.app` (bate com `apps/mobile/app.config.ts`).
   - **SKU:** `spicy-game-001` (qualquer string única).

### 3. Ajustes no `app.config.ts`

Adicionar privacy strings (iOS exige mesmo que não use as permissões):

```ts
ios: {
  supportsTablet: false,
  bundleIdentifier: 'com.spicygame.app',
  buildNumber: '1',
  infoPlist: {
    NSMicrophoneUsageDescription: 'Este jogo não usa microfone.', // só se for preciso
  },
  config: {
    usesNonExemptEncryption: false, // evita prompt de export compliance
  },
},
```

### 4. Criar perfil iOS no `eas.json`

Adicionar em cada perfil a seção `ios`:

```json
"production": {
  "distribution": "store",
  "channel": "production",
  "autoIncrement": "buildNumber",
  "android": { "buildType": "apk" },
  "ios": { "resourceClass": "m-medium" },
  "env": { ... }
}
```

### 5. Build e submit

```bash
cd apps/mobile
eas build --profile production --platform ios
```

Primeira vez: o EAS pergunta sobre certificados e Apple ID. Forneça credenciais — ele gera e guarda. Tempo: 20–30 min (fila iOS é mais lenta).

Depois:

```bash
eas submit --profile production --platform ios --latest
```

Isso envia o `.ipa` para o App Store Connect. Em 30–60 min fica disponível no TestFlight.

### 6. Configurar TestFlight no App Store Connect

1. **My Apps → Spicy Game → TestFlight**.
2. Aceitar **Export Compliance** (dizer que não usa criptografia não-padrão).
3. **Internal Testing:** adicionar testers (e-mails da sua equipe) — liberação imediata.
4. **External Testing:** precisa passar por **Beta App Review** (1–2 dias). Depois, você pode gerar um **public link** que qualquer um acessa.

### 7. Atualizar a landing para mostrar iOS

Volte ao doc 07, componente `DownloadButtons.tsx`. Substituir o span "iOS em breve" por um `<a>` com o link do TestFlight:

```tsx
{showIos && (
  <a
    href="https://testflight.apple.com/join/SEU_CODIGO_PUBLICO"
    className="px-6 py-3 bg-bg-elev text-text rounded-xl font-semibold hover:bg-accent hover:text-bg transition"
  >
    Baixar via TestFlight
  </a>
)}
```

Deploy via Vercel (automático no push).

### 8. Atualizar Supabase Auth

Se adicionar deep linking iOS, reconfigure:
- **Additional Redirect URLs:** adicionar `com.spicygame.app://` além do `spicy://` (o scheme do app).

---

## OTA para iOS

Funciona igual a Android — o mesmo `eas update --branch production` atinge ambos. `runtimeVersion: { policy: 'appVersion' }` garante que só pega o update se a versão bate.

Por isso, manter iOS e Android na **mesma** `version` sempre que possível.

---

## Custos e limites

- **Apple Developer:** $99/ano, renovação anual obrigatória.
- **TestFlight Internal:** até 100 testadores instantâneos.
- **TestFlight External:** até 10.000 testadores, mas cada build precisa de Beta App Review.
- **Builds EAS iOS:** contam no mesmo limite mensal do Android.

---

## Alternativa: App Store pública

Se depois quiser ir para a App Store de verdade:

- Tudo feito em TestFlight serve: mesmos certificados, mesmo app record.
- No App Store Connect → **App Store** → **Prepare for Submission** → preencher screenshots, descrição, classificação etária.
- **App Review** leva 1–3 dias. Um jogo com conteúdo adulto (`isAdult: true`) vai precisar classificação 17+ e conteúdo bem descrito.

Isso é assunto para outro documento (`13-app-store-publica.md` quando chegar a hora).

---

## O que NÃO fazer

- **Não** tente publicar para App Store diretamente sem passar por TestFlight — TestFlight é a fase de validação.
- **Não** use Bundle ID genérico (`com.example.*`) — Apple rejeita e você perde tempo.
- **Não** misture certificados Apple entre projetos — mantenha `eas credentials` por projeto.
- **Não** delete o keystore / certificate manualmente depois que o app está publicado.

---

## Checklist antes de abrir iOS

- [ ] Android está estável há pelo menos 2 semanas.
- [ ] Dashboard PostHog mostra uso consistente.
- [ ] Sentry está com 0 critical issues no mobile.
- [ ] Você tem tempo para a Beta App Review (1–2 dias de espera).
- [ ] $99 disponíveis na conta Apple Developer.
