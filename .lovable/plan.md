## Situação

O Manus adicionou um sistema novo de saúde via `@capgo/capacitor-health` (`src/services/healthService.ts`), já plugado em **Configurações** e **Renascer**. Ele tenta gravar numa tabela nova `user_health_data` — **que não existe e não deve ser criada**, porque o projeto já tem toda uma infraestrutura madura:

- Tabela `health_daily` (passos, calorias, sono, FC repouso, HRV, etc.)
- Tabela `health_workouts` (treinos com deduplicação por `external_id`)
- Edge function `health-sync` (validação JWT, upsert por `user_id+date`)
- Serviço `healthSync.ts` que já distingue iOS (HealthKit nativo) × Android (Health Connect) × Web (mock)
- Hook `useHealthData` que alimenta SIS, Renascer Score, dashboards cardio
- Bridges nativas Swift/Kotlin já documentadas (memória `mobile-health-v2`)

Criar `user_health_data` quebraria essa cadeia: SIS, score, cardio e dashboard continuariam lendo `health_daily` vazio.

## Plano: unificar no sistema existente

### 1. Reescrever `src/services/healthService.ts`
Manter a **API pública** que Configurações e Renascer já chamam (`isAvailable`, `checkPermissions`, `requestPermissions`, `readAndSyncDailyData`), mas internamente:

- `isAvailable` / `checkPermissions` / `requestPermissions`: continuar usando `@capgo/capacitor-health` (já instalado) como wrapper unificado iOS+Android. Pedir leitura de `steps`, `calories`, `heartRate`, `sleep`.
- `readAndSyncDailyData`: **não** gravar direto no Supabase. Em vez disso, chamar `syncHealthData(token)` do `src/services/healthSync.ts` já existente, que:
  - detecta plataforma (iOS/Android/Web)
  - usa as bridges nativas certas (HealthKit / Health Connect)
  - posta no edge `health-sync` → grava em `health_daily` + `health_workouts`
- Obter o `token` via `supabase.auth.getSession()` antes de chamar.
- Manter os toasts de sucesso/erro que o Manus colocou (boa UX).

### 2. Não criar a tabela `user_health_data`
Ignorar a sugestão SQL do Manus. A tabela alvo continua sendo `health_daily` (já com RLS, índices e GRANTs corretos).

### 3. Capability HealthKit no iOS
O passo manual no Xcode (`Signing & Capabilities → + Capability → HealthKit`) **continua necessário** — isso não dá pra automatizar via código. O `Info.plist` já tem `NSHealthShareUsageDescription` e `NSHealthUpdateUsageDescription` (confirmado), então só falta a capability.

### 4. Android — Health Connect
O `AndroidManifest.xml` já foi atualizado pelo Manus. Manter como está. O Capgo Health usa Health Connect por baixo no Android, então funciona para Samsung Health / Garmin Connect / Mi Fitness desde que esses apps escrevam no Health Connect.

### 5. Sincronização automática no Renascer
O hook que o Manus adicionou em `Renascer.tsx` (sync ao abrir a tela) fica, mas passa a chamar o `healthService` reescrito → que delega para `healthSync` → edge function. Adicionar um throttle simples (não sincronizar mais que 1×/15min via `localStorage`) para não martelar a API a cada navegação.

### 6. UI de Configurações
A seção "Conectar Dispositivos" que o Manus criou já está plugada. Após a refatoração, ela vai gravar nos lugares certos automaticamente, e o `useHealthData` (que alimenta Renascer/SIS/Cardio) vai refletir os dados na hora.

## Como testar depois

1. `git pull` → `npm install` → `npm run build` → `npx cap sync`
2. `npx cap open ios` → adicionar capability **HealthKit** (1× só)
3. Rodar no iPhone físico
4. Configurações → Conectar Dispositivos → Apple → Autorizar
5. iOS abre painel do Saúde → marcar os tipos
6. Voltar pra tela Renascer → sync automático dispara
7. Verificar que passos/sono/FC aparecem nos cards de saúde e no SIS

## Fora deste plano

- Push notifications, ECG, importação manual Excel (já existem, sem mudança)
- Tabela `user_health_data` (será descartada)
- Mudanças em `health-sync` edge function (já cobre todos os campos necessários)

Posso seguir com a refatoração?