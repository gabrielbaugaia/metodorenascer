
# Evolucao do Plugin HealthKit — Fase 2 (Resting HR, HRV, Workouts)

## Resumo

Expandir o plugin HealthKit e o fluxo de sync para incluir Resting Heart Rate, HRV (SDNN) e Workouts reais das ultimas 24h, com deduplicacao de workouts via coluna `external_id` no banco e atualizacao do calculo de prontidao.

---

## 1. Migracao de Banco (pequena e segura)

Adicionar coluna nullable `external_id` na tabela `health_workouts` e criar um indice unico parcial para deduplicacao:

```text
ALTER TABLE health_workouts ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_health_workouts_external_id 
  ON health_workouts (user_id, external_id) 
  WHERE external_id IS NOT NULL;
```

Isso nao quebra inserts antigos (external_id sera null para registros existentes). O indice unico parcial ignora nulls, entao workouts sem external_id continuam funcionando normalmente.

---

## 2. Edge Function `health-sync` (atualizar)

Modificar a secao de insercao de workouts para:
- Aceitar `external_id` opcional no payload de cada workout
- Se `external_id` estiver presente, verificar existencia antes de inserir (query por user_id + external_id)
- Inserir apenas workouts cujo external_id nao exista ainda
- Se `external_id` nao estiver presente, inserir normalmente (comportamento atual)

Fluxo:
```text
Para cada workout no array:
  Se w.external_id existe:
    SELECT count(*) FROM health_workouts WHERE user_id = X AND external_id = Y
    Se > 0: pular (ja existe)
  Inserir workout com external_id
```

Alternativa mais eficiente: usar `upsert` com `onConflict` no indice unico, mas como o indice e parcial, usar a abordagem de filtro pre-insert.

---

## 3. TypeScript Bridge — `src/services/healthkit.ts`

Atualizar tipos e funcoes:

**Novos tipos:**
```text
TodayMetrics += restingHr: number | null, hrvMs: number | null

Workout = {
  startTime: string (ISO UTC)
  endTime: string (ISO UTC)
  type: string
  calories: number | null
  source: "apple"
  externalId: string
}

HealthKitPluginInterface += getWorkoutsLast24h(): Promise<{ workouts: Workout[] }>
```

**Funcoes atualizadas:**
- `healthkitGetTodayMetrics()` — retorna restingHr e hrvMs do plugin (ou null no mock)
- `getTodayRestingHR()` — usa cache do plugin se disponivel, senao mock
- `getTodayHRV()` — usa cache do plugin se disponivel, senao mock

**Nova funcao:**
- `healthkitGetWorkoutsLast24h(): Promise<Workout[]>` — chama plugin nativo, fallback para mock com externalId gerado

**Registrar novo metodo no plugin bridge** (o `.m` nativo precisa ser atualizado manualmente pelo dev).

---

## 4. Sync Logic — `src/services/healthSync.ts`

Atualizar `syncHealthData()`:

```text
1. Tentar healthkitGetTodayMetrics()
2. Se sucesso:
   - steps, activeCalories, sleepMinutes do plugin
   - restingHr e hrvMs do plugin (podem ser null)
   - source = "apple"
3. Se falha: mock para tudo, source = "apple_health"

4. Tentar healthkitGetWorkoutsLast24h()
5. Se sucesso: usar workouts reais com external_id
6. Se falha: usar mock (sem external_id)

7. Montar payload incluindo external_id nos workouts
```

---

## 5. Calculo de Prontidao — `src/hooks/useHealthData.ts`

Refinar `calculateReadiness()`:

Adicoes:
- Se houve workout de alta intensidade (type in: hiit, running, cycling) E sono < 360 min (6h): -10 extra
- Manter penalizacoes existentes para resting_hr e hrv_ms (ja implementadas)
- Passar `recentWorkouts` (com tipo) para a funcao em vez de apenas `hasRecentWorkout: boolean`

---

## 6. Documentacao Admin — `src/pages/admin/AdminConectorMobileDocs.tsx`

Atualizar:
- Secao do plugin Swift: adicionar codigo para `getWorkoutsLast24h`, restingHeartRate e HRV
- Atualizar o `.m` bridge para incluir o novo metodo
- Atualizar checklist Fase 2: marcar restingHR, HRV e workouts como "implementado (TS + backend), pendente config nativa"
- Adicionar nota sobre external_id e deduplicacao

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/services/healthkit.ts` | Novos tipos, restingHr/hrvMs no TodayMetrics, getWorkoutsLast24h real, fallback mock |
| `src/services/healthSync.ts` | Incluir restingHr/hrvMs do plugin, workouts reais com external_id |
| `src/hooks/useHealthData.ts` | Refinar readiness com tipo de workout + sono |
| `supabase/functions/health-sync/index.ts` | Aceitar external_id, dedup antes de inserir |
| `src/pages/admin/AdminConectorMobileDocs.tsx` | Codigo Swift atualizado, checklist, nota dedup |
| Migracao SQL | Adicionar coluna external_id + indice unico parcial |

---

## Detalhes Tecnicos

### health-sync edge function — dedup logic

```text
// Filtrar workouts novos
const newWorkouts = [];
for (const w of workouts) {
  if (w.external_id) {
    const { count } = await supabase
      .from("health_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("external_id", w.external_id);
    if (count && count > 0) continue; // ja existe
  }
  newWorkouts.push({ ...row, external_id: w.external_id || null });
}
// Insert apenas newWorkouts
```

### healthkit.ts — Mock externalId

Para mocks, gerar externalId determinístico:
```text
externalId = btoa(`${startISO}|${endISO}|${type}|mock`).replace(/=/g, '')
```

### useHealthData.ts — Readiness refinado

```text
// Existente (manter):
if (hasRecentWorkout) score -= 10;

// Novo:
const highIntensityTypes = ['hiit', 'running', 'cycling'];
const hasHighIntensityRecent = recentWorkouts.some(w => 
  highIntensityTypes.includes(w.type)
);
if (hasHighIntensityRecent && today.sleep_minutes < 360) score -= 10;
```

---

## O que NAO sera feito

- Background sync
- Novos campos no health_daily (schema ja suporta resting_hr e hrv_ms)
- Alteracoes em /dados-corpo UI (ja consome os dados existentes)
- Plugin Swift real (criado manualmente pelo dev no Xcode — apenas documentado)
