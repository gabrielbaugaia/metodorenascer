
# Plugin HealthKit para Renascer Connect

## Resumo

Criar o plugin nativo iOS (Swift) para Capacitor que le metricas do Apple HealthKit (passos, calorias ativas, sono) e integrar no fluxo TypeScript existente com fallback automatico para dados mock quando HealthKit nao estiver disponivel.

---

## Arquivos Nativos iOS (criados manualmente pelo dev no Xcode)

Estes arquivos NAO podem ser criados pelo Lovable — devem ser criados localmente apos `git pull`. Serao documentados no guia.

### `ios/App/App/Plugins/HealthKitPlugin/HealthKitPlugin.swift`

Plugin Swift com 3 metodos:
- `isAvailable()` — retorna `{ available: Bool }` via `HKHealthStore.isHealthDataAvailable()`
- `requestPermissions()` — solicita leitura de stepCount, activeEnergyBurned, sleepAnalysis; retorna `{ granted: Bool }`
- `getTodayMetrics()` — retorna `{ date, steps, activeCalories, sleepMinutes }` usando queries HKStatisticsQuery (steps/calories) e HKSampleQuery (sleep)

### `ios/App/App/Plugins/HealthKitPlugin/HealthKitPlugin.m`

Arquivo Objective-C bridge para registrar o plugin no Capacitor:
```text
#import <Capacitor/Capacitor.h>
CAP_PLUGIN(HealthKitPlugin, "HealthKitPlugin",
  CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(getTodayMetrics, CAPPluginReturnPromise);
)
```

### `ios/App/App/Info.plist`

Adicionar manualmente:
- `NSHealthShareUsageDescription`: "O MQO/Renascer precisa ler seus dados de saude (passos, calorias e sono) para calcular sua prontidao e personalizar seu treino."
- `NSHealthUpdateUsageDescription`: "O app nao escreve dados; apenas leitura."

### Xcode Capabilities

Habilitar "HealthKit" em Signing & Capabilities no target App.

---

## Arquivos a Modificar (Lovable)

### 1. `src/services/healthkit.ts`

Reescrever completamente para:
- Importar `registerPlugin` de `@capacitor/core`
- Registrar `HealthKitPlugin` como plugin Capacitor
- Detectar se esta em ambiente nativo (`isNative()`)
- Se nativo: chamar plugin real (`HealthKit.isAvailable()`, `requestPermissions()`, `getTodayMetrics()`)
- Se web ou plugin falhar: usar fallback mock (funcoes randomBetween existentes)
- Exportar funcoes compatíveis com a API atual para nao quebrar `healthSync.ts`:
  - `requestPermissions()` -> tenta plugin, fallback mock
  - `getTodaySteps()` -> tenta plugin, fallback mock
  - `getTodayActiveCalories()` -> tenta plugin, fallback mock
  - `getTodaySleepMinutes()` -> tenta plugin, fallback mock
  - `getTodayRestingHR()` -> mock (nao implementado nesta fase)
  - `getTodayHRV()` -> mock (nao implementado nesta fase)
  - `getWorkoutsLast24h()` -> mock (nao implementado nesta fase)
- Nova funcao exportada: `healthkitIsAvailable(): Promise<boolean>`
- Nova funcao exportada: `healthkitGetTodayMetrics(): Promise<TodayMetrics | null>` (retorna null se falhar)

Estrategia de cache: ao chamar `getTodayMetrics()` com sucesso, armazenar resultado em variavel do modulo para que `getTodaySteps()`, `getTodayActiveCalories()` e `getTodaySleepMinutes()` usem o mesmo resultado sem chamadas duplicadas ao plugin.

### 2. `src/services/healthSync.ts`

Ajuste minimo:
- Importar `healthkitGetTodayMetrics` do healthkit.ts
- Antes do `Promise.all` dos mocks, tentar `healthkitGetTodayMetrics()`
- Se retornar dados reais: usar `steps`, `activeCalories`, `sleepMinutes` e `source: "apple"`
- Se retornar null: cair no fluxo mock existente com `source: "apple_health"` (mock)
- Manter `resting_hr`, `hrv_ms` e `workouts` vindos dos mocks como antes

### 3. `src/pages/connect/ConnectDashboard.tsx`

Adicionar:
- Estado `healthPermission`: `"unknown" | "granted" | "denied" | "unavailable"`
- No `useEffect` de init: chamar `healthkitIsAvailable()` para verificar disponibilidade
- Novo card/botao "Conectar Apple Health" (entre StatusCard e SyncButton):
  - Se `unavailable`: texto "Apple Health nao disponivel neste dispositivo" (cinza, desabilitado)
  - Se `unknown`: botao verde "Conectar Apple Health" que chama `requestPermissions()` e atualiza estado
  - Se `granted`: badge verde "Apple Health conectado"
  - Se `denied`: texto amarelo "Permissao negada. Ative em Ajustes > Saude > Acesso de dados."
- Remover texto "Dados mock" quando `healthPermission === "granted"`
- Salvar estado de permissao em Preferences/localStorage (chave `renascer_health_permission`)

### 4. `src/pages/admin/AdminConectorMobileDocs.tsx`

Atualizar documentacao:
- Adicionar nova secao "Plugin HealthKit (iOS)" com:
  - Estrutura dos arquivos Swift
  - Instrucoes para habilitar capability no Xcode
  - Chaves do Info.plist
  - Codigo completo do HealthKitPlugin.swift e .m para copiar
- Atualizar checklist: marcar Fase 2 items "Implementar requestPermissions" e "Implementar leitura HealthKit" como disponiveis (nao checked — dev precisa criar no Xcode)
- Adicionar nota: "Os arquivos Swift devem ser criados manualmente no Xcode apos git pull"

---

## Detalhes Tecnicos

### healthkit.ts — Logica de deteccao e fallback

```text
1. isNative() verifica window.Capacitor
2. Se nativo, registerPlugin('HealthKitPlugin')
3. Cada funcao publica tenta plugin primeiro
4. Se plugin lanca erro ou nao esta disponivel, retorna mock
5. getTodayMetrics() cacheia resultado para evitar 3 chamadas separadas ao plugin
```

### healthSync.ts — Fluxo atualizado

```text
1. Tentar healthkitGetTodayMetrics()
2. Se sucesso:
   - daily.steps = metrics.steps
   - daily.active_calories = metrics.activeCalories
   - daily.sleep_minutes = metrics.sleepMinutes
   - daily.source = "apple"
   - daily.resting_hr = mock (getTodayRestingHR)
   - daily.hrv_ms = mock (getTodayHRV)
3. Se falha:
   - Usar todos os mocks como antes
   - daily.source = "apple_health"
4. workouts = mock (getWorkoutsLast24h) — inalterado
```

### ConnectDashboard.tsx — Novo card HealthKit

Posicionado entre StatusCard e SyncButton. Usa icone Apple (ou Heart com badge). Estados visuais claros para cada permissao. Persiste estado localmente para nao perguntar toda vez.

---

## O que NAO sera feito

- Backend e Edge Functions permanecem inalterados
- /dados-corpo nao sera modificado
- HRV, FC repouso, workouts reais nao serao implementados
- Background sync nao sera implementado
- Nenhuma tabela de banco criada ou modificada
