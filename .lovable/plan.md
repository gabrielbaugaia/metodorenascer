

# Plano: Corrigir VFC e FC Repouso que nunca aparecem no Dashboard

## Problema

O componente `ManualInput.tsx` (check-in diário principal) **não captura nem salva** os dados cardiovasculares extraídos pela IA (resting_hr, hrv_ms, avg_hr_bpm). A função OCR (`extract-fitness-data`) retorna esses campos corretamente, mas o ManualInput ignora todos eles em dois pontos:

1. **Extração OCR** (linha 86-90): captura steps, active_calories, exercise_minutes, standing_hours, distance_km — mas **não tem state** para resting_hr, hrv_ms, avg_hr_bpm
2. **Upsert no health_daily** (linha 199-214): não inclui os campos cardiovasculares

O `BatchFitnessUpload` já funciona corretamente (salva resting_hr, hrv_ms, avg_hr_bpm). O problema é exclusivo do ManualInput.

## Correções em `src/components/renascer/ManualInput.tsx`

### 1. Adicionar estados para dados cardiovasculares
```ts
const [restingHr, setRestingHr] = useState<string>("");
const [hrvMs, setHrvMs] = useState<string>("");
const [avgHrBpm, setAvgHrBpm] = useState<string>("");
```

### 2. Capturar os campos na resposta OCR (após linha 90)
```ts
if (data.resting_hr != null) setRestingHr(String(data.resting_hr));
if (data.hrv_ms != null) setHrvMs(String(data.hrv_ms));
if (data.avg_hr_bpm != null) setAvgHrBpm(String(data.avg_hr_bpm));
```

### 3. Parsear e incluir na mutation (junto com stepsVal, etc.)
```ts
const restingHrVal = restingHr ? parseInt(restingHr) : null;
const hrvMsVal = hrvMs ? parseInt(hrvMs) : null;
const avgHrBpmVal = avgHrBpm ? parseInt(avgHrBpm) : null;
```

### 4. Incluir no upsert do health_daily (após distanceKmVal)
```ts
if (restingHrVal !== null) healthData.resting_hr = restingHrVal;
if (hrvMsVal !== null) healthData.hrv_ms = hrvMsVal;
if (avgHrBpmVal !== null) healthData.avg_hr_bpm = avgHrBpmVal;
```

### 5. Limpar estados no reset (se existir)

Apenas 1 arquivo modificado. Nenhuma alteração de banco de dados necessária.

