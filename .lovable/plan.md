

# Projeto Mobile "Renascer Connect" — Capacitor + iOS

## Resumo

Adicionar o Capacitor ao projeto existente e criar as paginas, servicos e componentes exclusivos do app mobile conector. O app tera rotas dedicadas (`/connect/*`) para nao interferir no webapp existente.

---

## Estrutura de Arquivos a Criar

### Paginas Mobile

| Arquivo | Descricao |
|---|---|
| `src/pages/connect/ConnectLogin.tsx` | Tela de login com email/senha via Supabase Auth |
| `src/pages/connect/ConnectDashboard.tsx` | Tela principal com status e botao sincronizar |

### Servicos

| Arquivo | Descricao |
|---|---|
| `src/services/healthkit.ts` | Mock do HealthKit — retorna dados simulados |
| `src/services/healthSync.ts` | Monta payload e envia POST para health-sync |

### Componentes

| Arquivo | Descricao |
|---|---|
| `src/components/connect/SyncButton.tsx` | Botao "Sincronizar agora" com loading state |
| `src/components/connect/StatusCard.tsx` | Card mostrando status da conexao e ultima sync |

### Store

| Arquivo | Descricao |
|---|---|
| `src/services/authStore.ts` | Gerencia token via Capacitor Preferences (get/set/clear) |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/App.tsx` | Adicionar rotas `/connect/login` e `/connect/dashboard` |

---

## Configuracao Capacitor

Apos criar os arquivos, o usuario devera executar localmente:

```text
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/preferences
npx cap init "Renascer Connect" "com.renascer.connect"
npx cap add ios
```

O `capacitor.config.ts` devera apontar para a URL de preview do sandbox durante desenvolvimento:

```text
appId: com.renascer.connect
appName: Renascer Connect
server.url: https://a75d46a2-4cbd-4416-81c4-9988ca4fb176.lovableproject.com/connect/login?forceHideBadge=true
server.cleartext: true
```

---

## Detalhes Tecnicos

### ConnectLogin.tsx
- Campos email e senha com validacao basica
- Chama `supabase.auth.signInWithPassword`
- Salva token via `authStore.saveToken()`
- Redireciona para `/connect/dashboard`
- Layout mobile-first, tela cheia, sem header/sidebar do webapp

### ConnectDashboard.tsx
- Mostra StatusCard com estado (conectado/desconectado) e timestamp da ultima sync
- Mostra SyncButton que chama `syncHealthData()`
- Botao de logout
- Layout autonomo sem ClientLayout

### healthkit.ts (Mock)
- `requestPermissions()` → retorna true
- `getTodaySteps()` → numero aleatorio 4000-12000
- `getTodayActiveCalories()` → 200-700
- `getTodaySleepMinutes()` → 300-480
- `getTodayRestingHR()` → 55-70
- `getTodayHRV()` → 40-80
- `getWorkoutsLast24h()` → array com 0-2 workouts mock
- Todos com comentario `// TODO: substituir por HealthKit nativo`

### healthSync.ts
- `syncHealthData(token: string)` → chama todos os getters do healthkit.ts
- Monta payload `{ date, daily, workouts }`
- POST para `${VITE_SUPABASE_URL}/functions/v1/health-sync`
- Retorna resultado ou lanca erro

### authStore.ts
- Usa `@capacitor/preferences` com fallback para localStorage (para funcionar no browser tambem)
- `saveToken(token)`, `getToken()`, `clearToken()`

### SyncButton.tsx
- Botao com icone RefreshCw, estado loading com spinner
- Chama callback `onSync` passado por prop
- Desabilitado durante sincronizacao

### StatusCard.tsx
- Recebe props: `connected`, `lastSync`, `syncResult`
- Exibe badge verde/vermelho, timestamp formatado

---

## Fluxo Completo

```text
1. Usuario abre app iOS
2. Rota /connect/login carrega
3. Digita email + senha
4. supabase.auth.signInWithPassword
5. Token salvo via Preferences/localStorage
6. Redireciona para /connect/dashboard
7. Toca "Sincronizar agora"
8. healthkit.ts retorna dados mock
9. healthSync.ts monta payload e POST
10. Resultado exibido no StatusCard
11. Dados aparecem em /dados-corpo no webapp
```

---

## O que NAO sera feito

- Nenhuma funcionalidade existente sera alterada
- HealthKit nativo NAO sera implementado (apenas mock)
- Nenhuma tabela de banco criada ou modificada
- A edge function health-sync permanece inalterada

