

# Fix: Dados de fitness não aparecem nos dashboards

## Diagnóstico real (dados do banco)

Analisei os registros do Gabriel (`a066ea71...`) e encontrei **3 problemas estruturais**:

### Problema 1: Recovery Score sempre 0 (bug crítico)
O `stress_level` é salvo no range 0-100 pelo formulário (slider), mas o `compute-sis-score` calcula como se fosse 1-5. Com stress_level=30, o cálculo gera um valor de -625, que é limitado a 0. **Isso faz o Recovery Score ser sempre 0 para todos os alunos.**

### Problema 2: health_daily incompleta
Os registros em `health_daily` do Gabriel têm `exercise_minutes`, `standing_hours` e `distance_km` todos NULL, mesmo quando `manual_day_logs` tem esses dados (ex: 05/03 tem exercise_minutes=108, standing_hours=10, distance_km=4.12). O sync antigo não copiava esses campos.

### Problema 3: Dados do Corpo mostra "indisponível" quando hoje tem steps=0
O dashboard "Dados do Corpo" mostra "Hoje" e se o registro de hoje tem steps=0 e active_calories=0, exibe "indisponível" em vez de mostrar dados dos dias anteriores que foram importados.

## Plano de correção

### 1. Corrigir escala do stress_level no compute-sis-score
Na edge function `compute-sis-score`, normalizar `stress_level` de 0-100 para 1-5 antes do cálculo do Recovery:
```
const stressRaw = todayDayLog?.stress_level ?? 50;
const stressLvl = 1 + (stressRaw / 100) * 4; // 0-100 → 1-5
```
Isso corrige o Recovery para todos os alunos.

### 2. Reparar health_daily do Gabriel via migration
Executar SQL que copia `exercise_minutes`, `standing_hours`, `distance_km` de `manual_day_logs` para `health_daily` para todos os registros existentes do Gabriel onde esses campos estão NULL mas existem em `manual_day_logs`.

### 3. Melhorar HealthDashboardTab para mostrar dados recentes
Quando o registro de hoje não tem passos/calorias, mostrar os dados mais recentes disponíveis com label "Último registro: dd/MM" em vez de "indisponível". Isso faz os dados importados por batch aparecerem mesmo se hoje não tem print.

### 4. Re-executar SIS backfill para Gabriel
Após as correções, disparar o backfill do SIS para recalcular os últimos 30 dias com o Recovery corrigido.

### 5. Sincronizar health_daily globalmente
Criar uma query de reparo que copia exercise_minutes, standing_hours, distance_km de manual_day_logs para health_daily para TODOS os usuários onde o campo está NULL em health_daily mas preenchido em manual_day_logs.

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| `supabase/functions/compute-sis-score/index.ts` | Corrigir escala stress_level 0-100 → 1-5 |
| `src/components/health/HealthDashboardTab.tsx` | Mostrar dados recentes quando hoje está vazio |
| Migration SQL | Reparar health_daily existentes + backfill sync |

