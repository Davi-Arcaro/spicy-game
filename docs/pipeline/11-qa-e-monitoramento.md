# 11 — QA e monitoramento

## Objetivo

Fechar o ciclo: antes de cada release, um checklist manual; depois do deploy, dashboards e alertas que te avisam quando algo quebra.

---

## Pré-requisitos

- Docs 03, 05, 06, 08, 09 concluídos.
- Pelo menos **dois dispositivos** (ou 1 celular + Expo Go num simulador) para testar multiplayer.

---

## 1. Smoke test de release — antes de clicar "publicar"

Rode esta sequência com o **APK candidato** instalado num celular limpo (sem versão anterior). Cada item precisa passar.

### 1.1 Instalação
- [ ] Download do APK pelo botão da landing (`https://spicy-game.vercel.app`).
- [ ] Android permite a instalação com "Fontes desconhecidas".
- [ ] App abre no ícone correto, splash correto.

### 1.2 Onboarding
- [ ] Welcome abre.
- [ ] Profile setup salva nome e avatar.
- [ ] Voltar depois não perde o perfil (persistência via AsyncStorage — `apps/mobile/src/lib/storage.ts`).

### 1.3 Sala — host
- [ ] Criar sala → código de 4 letras é gerado.
- [ ] Lobby mostra o host.
- [ ] Copiar código funciona (expo-clipboard).

### 1.4 Sala — convidado (outro dispositivo)
- [ ] Join room com código → entra no lobby.
- [ ] Lobby do host atualiza com o 2º jogador.

### 1.5 Gameplay
- [ ] Host clica "Começar" → tela Playing abre em ambos.
- [ ] `drawCard` retorna uma carta válida.
- [ ] `submitAction` com `complete` avança o turno.
- [ ] `spinRoulette` (se modo `roulette`) retorna outcome.
- [ ] `leaveRoom` no convidado atualiza o host.

### 1.6 Telas secundárias
- [ ] Settings abre, alterna tema se aplicável.
- [ ] About mostra versão (`1.0.0` no primeiro release).

### 1.7 Observabilidade
- [ ] PostHog **Activity** mostra `room_created`, `game_started`, `card_drawn`, `action_submitted` dentro de 1 min.
- [ ] Sentry **Issues** está **sem issues novas**.

Se tudo passou: publicar GitHub Release (doc 09) e liberar.

---

## 2. Dashboards a montar

### 2.1 Sentry

**Alertas:**
- **Mobile:** `> 5 eventos/hora` com nível `error` → notifica e-mail/Slack.
- **Edge Functions:** qualquer `error` no ambiente `production` → notifica imediato.

**Issues triagem semanal:**
- Visitar https://sentry.io/organizations/<org>/issues/ uma vez por semana.
- Cada issue nova: marcar `Resolve` se já corrigida ou `Ignore` se esperada (ex: erro de rede offline). Nunca deixe backlog acumular.

### 2.2 PostHog

**Dashboard "Funil de uso":**
- Passos: `app_opened` → `room_created` → `game_started` → `action_submitted`.
- Janela: 24h.
- Métrica: conversão entre steps. Uma queda grande indica bug ou fricção.

**Insight "Retenção":**
- Cohort por dia de `app_opened`.
- Retenção D1 (abriu de novo no dia seguinte?) e D7.

**Insight "Cartas jogadas por sala":**
- Evento: `action_submitted`.
- Breakdown por `roomId`, agregado por count.
- Ajuda a entender quanto tempo os grupos jogam.

### 2.3 Supabase

No dashboard do projeto:
- **Database → Reports:** acompanhar uso de storage, queries lentas.
- **Edge Functions → Logs:** `supabase functions logs <fn> --tail` para debug ao vivo.
- **Auth → Users:** contagem de usuários anônimos. Cresce linearmente com downloads.

---

## 3. Runbook de incidentes

Quando algo quebra em produção, siga nesta ordem:

### 3.1 Sintoma: app crasha ao abrir
1. Checar **Sentry mobile** → issue provável já estará lá.
2. Se é bug só de JS: `eas update --branch production --message "hotfix: <descrição>"`. Usuário pega no próximo cold start.
3. Se é bug nativo (ex: dependência nova): precisa **novo APK**. Build + release + atualizar botão (automático via `/download/android`).

### 3.2 Sintoma: edge function retornando 500
1. `supabase functions logs <fn> --tail` em outro terminal.
2. Reproduzir o erro no app.
3. Checar **Sentry edge** para stack trace completo.
4. Corrigir em `supabase/functions/<fn>/index.ts`.
5. Redeploy: `supabase functions deploy <fn>`.
6. **Não há rollback automático** — se o deploy novo piorar, edite o código para reverter e deploy de novo.

### 3.3 Sintoma: landing fora do ar
1. Dashboard Vercel → **Deployments** → checar status.
2. Se o último deploy está `Error`: **Promote** o anterior (Settings → ... no deploy velho).
3. Se está `Ready` mas 502: problema do Vercel — ver https://www.vercel-status.com/.

### 3.4 Sintoma: OTA deixou o app quebrado
```bash
cd apps/mobile
eas update:rollback --branch production
```
Usuários voltam ao JS anterior no próximo reload.

### 3.5 Sintoma: APK quebrado em circulação
- Publicar hotfix via OTA se possível (preferível).
- Se não, publicar **nova release** (`v1.0.1`) e **marcar `v1.0.0` como prerelease**:
  ```bash
  gh release edit v1.0.0 --prerelease
  ```
  O redirect `/download/android` passa a apontar para `v1.0.1` automaticamente.
- Usuários que já têm `v1.0.0` instalado precisam reabrir → recebem OTA ou baixar manualmente.

---

## 4. Checklist de cadência

### Diário (~2 min)
- Glance em Sentry: issues novas?
- Glance em PostHog: `room_created` > 0 no dia?

### Semanal (~15 min)
- Triagem de issues do Sentry.
- Revisar funil do PostHog — alguma queda anormal?
- Checar GitHub Releases → baixar APK num celular e confirmar que abre.

### Mensal (~30 min)
- Cotas: Sentry events, PostHog events, Vercel egress, EAS builds. Alguma perto do limite?
- Revisar `SUPABASE_*` logs por queries lentas.
- Backup do keystore do EAS (`eas credentials` → Download).

---

## Verificação

- [ ] Alerta Sentry configurado e testado (disparar um `throw` de teste e confirmar e-mail chegou).
- [ ] Dashboard PostHog "Funil de uso" existe e tem dados.
- [ ] Runbook deste doc está acessível para quem vai operar o app.

---

## Troubleshooting

- **Sentry não recebe nada do mobile em produção:** confira que `EXPO_PUBLIC_SENTRY_DSN` estava setado no build EAS (veja `eas secret:list`). DSN vazio ⇒ init é skip.
- **PostHog recebe dados mas o funil fica zerado:** nomes de eventos precisam bater **exatamente** com os capturados no `api.ts` (case-sensitive).
- **`supabase functions logs` não mostra nada:** cheque `supabase projects list` — você está apontando para o projeto certo?
