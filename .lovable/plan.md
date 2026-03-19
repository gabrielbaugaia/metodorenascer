

# Fix: Dados de fitness não atualizam métricas do cliente

## Problemas identificados

1. **Tabela `health_daily` não tem colunas para `exercise_minutes`, `standing_hours`, `distance_km`** — o batch upload salva esses dados em `manual_day_logs` mas só sincroniza `steps` e `active_calories` para `health_daily`. O dashboard "Dados do Corpo" lê de `health_daily` e mostra tudo zerado.

2. **Cache não invalidado** — O BatchFitnessUpload invalida `recent-logs-history`, `renascer-score` e `sis-scores-30d`, mas **não invalida `health-daily`** (query key usada pelo `useHealthData` e pela página DadosCorpo). Os dados são salvos mas a UI nunca atualiza.

3. **ManualInput (upload de 3 imagens) mesmo problema** — extrai dados de fitness via OCR mas só sincroniza steps + active_calories para `health_daily`.

4. **DadosCorpo "Últimos 7 dias" mostra "0 passos, 0 kcal"** porque as linhas em `health_daily` existem (do registro de sono) mas sem steps/calories preenchidos quando vindos do OCR.

## Solução

### 1. Migration: adicionar colunas em `health_daily`
Adicionar `exercise_minutes`, `standing_hours` e `distance_km` na tabela `health_daily` para que todos os dados de fitness fiquem disponíveis para o dashboard.

### 2. Fix `BatchFitnessUpload.tsx` — sync completo + invalidação
- Sincronizar **todos** os campos extraídos (exercise_minutes, standing_hours, distance_km) para `health_daily`, não só steps e active_calories.
- Adicionar invalidação de `health-daily` e `health-workouts-recent` no onSuccess.

### 3. Fix `ManualInput.tsx` — sync completo
- Mesmo fix: sincronizar exercise_minutes, standing_hours, distance_km para `health_daily` ao salvar.
- Adicionar invalidação de `health-daily`.

### 4. Atualizar `HealthDashboardTab.tsx` — exibir exercise_minutes e distance
- Mostrar exercise_minutes e distance_km nos cards do dashboard quando disponíveis.

### 5. Atualizar `useHealthData.ts` — expandir interface
- Adicionar os novos campos na interface `HealthDaily`.

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| Nova migration SQL | Adicionar 3 colunas em `health_daily` |
| `src/components/renascer/BatchFitnessUpload.tsx` | Sync completo + invalidar `health-daily` |
| `src/components/renascer/ManualInput.tsx` | Sync completo + invalidar `health-daily` |
| `src/hooks/useHealthData.ts` | Expandir interface HealthDaily |
| `src/components/health/HealthDashboardTab.tsx` | Exibir exercise_minutes e distance |

