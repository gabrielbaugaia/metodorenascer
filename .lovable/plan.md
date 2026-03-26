

# Plano: Área de Treino Aeróbico Separado

## O que será criado

Uma seção dedicada para registrar treinos aeróbicos (cardio em jejum, corrida, bike, esteira, etc.) independente do protocolo de musculação. O cliente poderá:

- Registrar tipo de aeróbico (bike, esteira, rua, elíptico, etc.)
- Informar duração, distância e se foi em jejum
- Anexar print do Apple Fitness/app de treino para extrair dados via OCR
- Ver histórico dos treinos aeróbicos com métricas acumuladas

Os dados serão computados no sistema (calorias, minutos de exercício) integrando com `health_daily` e alimentando o Score SIS e as prescrições.

---

## Estrutura técnica

### 1. Tabela `cardio_sessions` (migration)
```
id, user_id, session_date, cardio_type (bike/esteira/rua/eliptico/natacao/outro),
duration_minutes, distance_km, calories_burned, avg_hr_bpm, max_hr_bpm,
fasting (boolean), notes, fitness_screenshot_url, created_at
```
Com RLS para user ver/inserir/editar/deletar os próprios registros e admin ver todos.

### 2. Nova página `src/pages/Cardio.tsx`
- Formulário para registrar sessão: tipo (select), duração, distância, jejum (toggle), notas
- Upload de print do Fitness (reutiliza OCR `extract-fitness-data` para extrair calorias, FC, distância)
- Histórico em cards com filtro por semana/mês
- Stats resumo: total km, total minutos, sessões no mês

### 3. Componentes novos
- `src/components/cardio/CardioLogForm.tsx` — formulário de registro
- `src/components/cardio/CardioHistoryList.tsx` — lista de sessões anteriores
- `src/components/cardio/CardioStatsHeader.tsx` — KPIs do topo (km total, min total, sessões)

### 4. Integração com o sistema existente
- Ao salvar sessão, sincronizar `exercise_minutes` e `active_calories` em `health_daily` (mesma lógica do OCR)
- Contabilizar no `workout_completions` como tipo "cardio" para manter streak e engajamento
- Dados disponíveis para `generate-protocol` e `analyze-evolution` (já leem `health_daily`)

### 5. Navegação
- Adicionar "Aeróbico" no `ClientSidebar` (ícone HeartPulse ou similar)
- Rota `/cardio` protegida por `SubscriptionGuard`
- Link rápido na página Renascer (Hoje)

### 6. OCR do print
- Reutilizar `extract-fitness-data` edge function — já extrai calorias, distância, FC
- No formulário, ao anexar print, chamar a function e pré-preencher os campos automaticamente

## Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `cardio_sessions` com RLS |
| `src/pages/Cardio.tsx` | Nova página principal |
| `src/components/cardio/CardioLogForm.tsx` | Formulário de registro |
| `src/components/cardio/CardioHistoryList.tsx` | Histórico |
| `src/components/cardio/CardioStatsHeader.tsx` | KPIs |
| `src/App.tsx` | Adicionar rota `/cardio` |
| `src/components/layout/ClientSidebar.tsx` | Adicionar item "Aeróbico" |
| `src/components/navigation/BottomNav.tsx` | Avaliar inclusão no nav mobile |

