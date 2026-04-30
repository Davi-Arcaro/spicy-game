# 07 — Landing page em Next.js (`apps/web`)

## Objetivo

Criar a landing page do Spicy Game em Next.js 15 (App Router) dentro do monorepo, rodando localmente em `localhost:3000`. Ela vai:

- Apresentar o jogo (hero + features + screenshots).
- Detectar iOS vs Android e mostrar o botão certo de download.
- Ter páginas de **privacidade**, **termos** e **suporte** — boas práticas mesmo fora de loja.

O deploy no Vercel vem no doc 08.

---

## Pré-requisitos

- Doc 01 concluído.
- Screenshots do app rodando (pelo menos 3, exportados do celular como PNG). Podem vir do APK do doc 06 ou do Expo Go.

---

## Passos

### 1. Criar o workspace `apps/web`

Na raiz do repo:

```bash
bun create next-app apps/web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-bun \
  --no-eslint
```

> Se o CLI pedir perguntas adicionais (Turbopack, etc.), aceite os defaults.

### 2. Confirmar workspaces

O `package.json` raiz já tem `"workspaces": ["apps/*", "packages/*"]`. Nenhuma mudança necessária. Rode:

```bash
cd /caminho/para/spicy-game
bun install
```

Para garantir que o `node_modules` do novo app foi linkado.

### 3. Ajustar `apps/web/package.json`

```json
{
  "name": "@spicy-game/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  }
}
```

Mantenha as dependências geradas pelo `create-next-app` (React, Next, Tailwind).

### 4. Tokens de design (copiados do mobile)

Abra `apps/mobile/src/theme/` e copie as cores principais. Crie `apps/web/app/globals.css` com variáveis CSS:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0C0906;
  --bg-elev: #1A140E;
  --accent: #E94F37;
  --accent-soft: #F79E89;
  --text: #F5EFE6;
  --muted: #B5A79A;
}

body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; }
```

E em `apps/web/tailwind.config.ts`, estenda o tema:

```ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elev': 'var(--bg-elev)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        muted: 'var(--muted)',
      },
    },
  },
  plugins: [],
};
export default config;
```

### 5. Hook `useDeviceOS`

Crie `apps/web/app/hooks/useDeviceOS.ts`:

```ts
'use client';
import { useEffect, useState } from 'react';

export type DeviceOS = 'ios' | 'android' | 'desktop' | 'unknown';

export function useDeviceOS(): DeviceOS {
  const [os, setOs] = useState<DeviceOS>('unknown');
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) setOs('android');
    else if (/iPhone|iPad|iPod/i.test(ua)) setOs('ios');
    else setOs('desktop');
  }, []);
  return os;
}
```

### 6. Componentes principais

Crie `apps/web/app/_components/Hero.tsx`:

```tsx
import Link from 'next/link';
import { DownloadButtons } from './DownloadButtons';

export function Hero() {
  return (
    <section className="px-6 py-24 text-center max-w-3xl mx-auto">
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
        Spicy <span className="text-accent">Game</span>
      </h1>
      <p className="text-xl text-muted mb-10">
        O jogo de verdade ou desafio, roleta e dinâmicas em grupo que sua galera ainda não jogou.
      </p>
      <DownloadButtons />
    </section>
  );
}
```

Crie `apps/web/app/_components/DownloadButtons.tsx`:

```tsx
'use client';
import { useDeviceOS } from '../hooks/useDeviceOS';

const APK_URL = '/download/android'; // redirect estável — doc 09

export function DownloadButtons() {
  const os = useDeviceOS();
  const showAndroid = os !== 'ios';
  const showIos = os !== 'android';

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {showAndroid && (
        <a
          href={APK_URL}
          className="px-6 py-3 bg-accent text-bg rounded-xl font-semibold hover:bg-accent-soft transition"
        >
          Baixar APK para Android
        </a>
      )}
      {showIos && (
        <span className="px-6 py-3 bg-bg-elev text-muted rounded-xl font-semibold cursor-not-allowed">
          iOS em breve
        </span>
      )}
    </div>
  );
}
```

Crie `apps/web/app/_components/Features.tsx`:

```tsx
const FEATURES = [
  { title: 'Salas privadas', body: 'Código de 4 letras. Sem conta, sem fricção.' },
  { title: 'Modos variados', body: 'Roleta, casal, grupo, perguntas, verdade ou desafio.' },
  { title: 'Decks e intensidade', body: 'Do soft ao extreme. Você escolhe o clima.' },
  { title: 'Jogue offline na sala', body: 'Um celular chama. O resto da galera entra pelo código.' },
];

export function Features() {
  return (
    <section className="px-6 py-16 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-10 text-center">Como funciona</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="p-6 bg-bg-elev rounded-2xl">
            <h3 className="text-xl font-semibold text-accent mb-2">{f.title}</h3>
            <p className="text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Crie `apps/web/app/_components/Screenshots.tsx`:

```tsx
import Image from 'next/image';

const SHOTS = [
  { src: '/screenshots/home.png', alt: 'Tela inicial' },
  { src: '/screenshots/playing.png', alt: 'Em jogo' },
  { src: '/screenshots/lobby.png', alt: 'Lobby' },
];

export function Screenshots() {
  return (
    <section className="px-6 py-16 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-10 text-center">Prévia</h2>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4">
        {SHOTS.map((s) => (
          <div key={s.src} className="snap-center shrink-0 w-72">
            <Image
              src={s.src}
              alt={s.alt}
              width={288}
              height={600}
              className="rounded-2xl border border-bg-elev"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
```

Crie `apps/web/app/_components/Footer.tsx`:

```tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="px-6 py-10 text-sm text-muted border-t border-bg-elev">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
        <span>© {new Date().getFullYear()} Spicy Game</span>
        <nav className="flex gap-4">
          <Link href="/privacy">Privacidade</Link>
          <Link href="/terms">Termos</Link>
          <Link href="/support">Suporte</Link>
        </nav>
      </div>
    </footer>
  );
}
```

### 7. Página principal

`apps/web/app/page.tsx`:

```tsx
import { Hero } from './_components/Hero';
import { Features } from './_components/Features';
import { Screenshots } from './_components/Screenshots';
import { Footer } from './_components/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Screenshots />
      <Footer />
    </main>
  );
}
```

### 8. Páginas legais / suporte

`apps/web/app/privacy/page.tsx`:

```tsx
export default function Privacy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Política de Privacidade</h1>
      <p>Atualizado em: [data].</p>
      <p>
        O Spicy Game coleta dados mínimos necessários para o funcionamento do jogo:
        identificador anônimo gerado automaticamente, nome de exibição escolhido por você
        e eventos de uso (salas criadas, cartas jogadas) para entender como o app é
        utilizado. Não coletamos e-mail, telefone, localização precisa ou contatos.
      </p>
      <p>
        Analytics é operado via PostHog. Monitoramento de erros via Sentry. Você pode
        solicitar a exclusão dos seus dados entrando em contato por <a href="/support">/support</a>.
      </p>
    </main>
  );
}
```

Faça o mesmo para `apps/web/app/terms/page.tsx` (termos de uso) e `apps/web/app/support/page.tsx` (FAQ + e-mail de contato).

> **Não use texto boilerplate genérico em produção.** Escreva pensando no seu jogo e no público. Consulte a LGPD se seu público for brasileiro.

### 9. Screenshots

Crie `apps/web/public/screenshots/` e coloque pelo menos 3 PNGs:
- `home.png`, `playing.png`, `lobby.png`

Capture direto do celular:
- Android: botões físicos (volume down + power) ou `adb shell screencap -p /sdcard/shot.png`.
- Expo Go/iOS simulator: `cmd+S` no simulator.

Recorte para manter aspecto de telefone (~9:19.5).

### 10. Metadata e SEO

`apps/web/app/layout.tsx` (substituir export):

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spicy Game — Jogo entre amigos',
  description: 'Verdade ou desafio, roleta e dinâmicas em grupo. Sem conta, sem fricção.',
  openGraph: {
    title: 'Spicy Game',
    description: 'O jogo que sua galera ainda não jogou.',
    url: 'https://spicy-game.vercel.app',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

Adicione um `apps/web/public/og.png` (1200×630 PNG com o logo + tagline) para preview em redes sociais.

---

## Verificação

```bash
cd apps/web
bun run dev
```

Abra `http://localhost:3000`:

- [ ] Hero aparece com o título e botão de download.
- [ ] Em desktop, ambos os botões (Android + iOS soon) aparecem.
- [ ] `navigator.userAgent` fake iOS (DevTools → Device Mode → iPhone) → só botão iOS.
- [ ] DevTools → Device Mode → Pixel → só botão Android.
- [ ] Botão "Baixar APK" aponta para `/download/android` (404 agora — será resolvido no doc 09).
- [ ] Páginas `/privacy`, `/terms`, `/support` abrem.
- [ ] `bun run build` em `apps/web` conclui sem erro.

---

## Troubleshooting

- **Tailwind não aplica estilos:** confirme que `globals.css` está importado em `app/layout.tsx` e que `content` no `tailwind.config.ts` cobre `./app/**/*.{ts,tsx}`.
- **`bun create next-app` falha:** use `bunx create-next-app@latest apps/web ...` como fallback.
- **Tipagem quebra no `apps/web`:** `apps/web/tsconfig.json` é isolado do resto — **não** tente estender `tsconfig.json` da raiz; landing é desacoplada.
- **Imagens PNG muito grandes:** passe por `tinypng.com` ou `squoosh.app` antes de commitar. Vercel cobra egress.
- **Build falha com "useDeviceOS is a server component":** o arquivo precisa ter `'use client'` no topo. O `DownloadButtons.tsx` também.
