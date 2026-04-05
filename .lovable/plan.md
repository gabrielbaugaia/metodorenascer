

# Plano: Expandir métricas cardiovasculares do HeartWatch

## Contexto

O HeartWatch fornece métricas detalhadas que o sistema atual não captura:
- **BPM ao dormir** (sleeping HR) — não capturado
- **VFC ao dormir** (sleeping HRV) — não capturado
- **MinMax BPM** (min/max HR diário) — não capturado
- **BPM sedentária** (sedentary HR) — não capturado

Atualmente só capturamos: resting_hr (BPM ao despertar), hrv_ms (VFC ao despertar), avg_hr_bpm (BPM diário).

## Alterações

### 1. Migração de banco de dados
Adicionar 5 novas colunas em `health_daily` e `manual_day_logs`:
- `sleeping_hr` (integer) — FC ao dormir
- `sleeping_hrv` (numeric) — VFC ao dormir
- `min_hr` (integer) — BPM mínima do dia
- `max_hr` (integer) — BPM máxima do dia
- `sedentary_hr` (integer) — BPM sedentária

### 2. Expandir OCR (`supabase/functions/extract-fitness-data/index.ts`)
- Adicionar os 5 novos campos no schema do tool calling
- Expandir o prompt para mapear terminologias HeartWatch:
  - "BPM ao dormir" / "Sleeping HR" → sleeping_hr
  - "VFC ao dormir" / "Sleeping HRV" → sleeping_hrv
  - "MinMax bpm" / "Min HR" / "Max HR" → min_hr, max_hr
  - "BPM sedentária" / "Sedentary HR" → sedentary_hr

### 3. Atualizar ManualInput (`src/components/renascer/ManualInput.tsx`)
- Adicionar estados para os 5 novos campos
- Capturar na resposta OCR
- Incluir no upsert de `health_daily` e `manual_day_logs`

### 4. Atualizar BatchFitnessUpload (`src/components/renascer/BatchFitnessUpload.tsx`)
- Expandir interface `ExtractedDay` com os novos campos
- Salvar no upsert

### 5. Atualizar Dashboard (`src/components/health/HealthDashboardTab.tsx`)
- Adicionar cards para: FC ao Dormir, VFC ao Dormir, BPM Min/Max, BPM Sedentária
- Incluir sparklines de 7 dias na seção cardiovascular

### 6. Atualizar tipos e hooks
- `src/hooks/useHealthData.ts` — expandir interface `HealthDaily`
- `src/services/healthSync.ts` — incluir novos campos no payload mobile
- `supabase/functions/health-sync/index.ts` — aceitar e salvar novos campos

### 7. Atualizar drawer de detalhes (`HealthMetricDetailDrawer`)
- Adicionar novos MetricKeys para os campos expandidos

## Arquivos modificados
- Nova migração SQL
- `supabase/functions/extract-fitness-data/index.ts`
- `src/components/renascer/ManualInput.tsx`
- `src/components/renascer/BatchFitnessUpload.tsx`
- `src/components/health/HealthDashboardTab.tsx`
- `src/components/health/HealthMetricDetailDrawer.tsx`
- `src/hooks/useHealthData.ts`
- `src/services/healthSync.ts`
- `supabase/functions/health-sync/index.ts`

