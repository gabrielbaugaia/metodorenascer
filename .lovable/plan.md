
# Renascer Mode — Dashboard Simplificado + Manual Inteligente (30s)

## Resumo

Criar uma experiencia simplificada "Renascer Mode" para alunos, com dashboard minimalista (Score + Status + Tendencia + Recomendacao), formulario rapido de 4 inputs (sono, estresse, energia, treino) e preparacao para futura integracao com wearables. Sem alterar nada do fluxo existente.

---

## Decisoes de Arquitetura

### Onde armazenar os dados manuais

Nao existem tabelas `recovery_logs`, `cognitive_checkins` ou `daily_scores`. O sistema atual usa `health_daily` (steps, active_calories, sleep_minutes, resting_hr, hrv_ms, source) para calcular prontidao.

**Estrategia escolhida:** Criar uma tabela leve `manual_day_logs` para os 4 inputs do Manual Inteligente (sono, estresse, energia, treino/RPE). Apos salvar, fazer upsert tambem em `health_daily` com `sleep_minutes` derivado do input de sono, para que o Score de Prontidao existente funcione automaticamente.

### Rota

Usar `/renascer` em vez de `/student/renascer` para manter consistencia com o padrao existente de rotas (`/treino`, `/nutricao`, `/dashboard`). O Renascer Mode sera acessivel pelo menu lateral como item principal.

### Preferencia data_mode

Adicionar coluna `data_mode text default 'manual'` na tabela `profiles` (menor risco, sem nova tabela).

---

## 1. Migracao de Banco

### Tabela `manual_day_logs`

```text
CREATE TABLE public.manual_day_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours numeric,         -- 0-12, step 0.5
  stress_level integer,        -- 0-100
  energy_focus integer,        -- 1-5
  trained_today boolean DEFAULT false,
  rpe integer,                 -- 1-10, null se nao treinou
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.manual_day_logs ENABLE ROW LEVEL SECURITY;

-- RLS: usuario ve/edita apenas seus dados
CREATE POLICY "Users can view own logs" ON public.manual_day_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.manual_day_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.manual_day_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all logs" ON public.manual_day_logs
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
```

### Coluna `data_mode` em `profiles`

```text
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_mode text DEFAULT 'manual';
```

---

## 2. Novos Arquivos a Criar

| Arquivo | Funcao |
|---------|--------|
| `src/pages/Renascer.tsx` | Pagina principal do Renascer Mode |
| `src/components/renascer/ScoreRing.tsx` | Anel de score visual (Whoop-style) |
| `src/components/renascer/StatusBadge.tsx` | Badge ELITE/ALTO/MODERADO/RISCO |
| `src/components/renascer/TrendIndicator.tsx` | Indicador de tendencia (seta + frase) |
| `src/components/renascer/DayRecommendation.tsx` | 3 bullets de recomendacao |
| `src/components/renascer/ManualInput.tsx` | Formulario 4 inputs rapidos |
| `src/components/renascer/ScoreSparkline.tsx` | Mini grafico 7 dias (Recharts) |
| `src/components/renascer/WearableModal.tsx` | Modal "Em breve" para wearables |
| `src/hooks/useRenascerScore.ts` | Hook que calcula score, tendencia e recomendacao a partir de manual_day_logs + health_daily |
| `src/lib/wearables/types.ts` | Tipos WearableProvider, WearableData |
| `src/lib/wearables/wearablesService.ts` | Service stub (tudo retorna "nao implementado") |
| `src/lib/wearables/useWearables.ts` | Hook stub para UI |

---

## 3. Arquivos a Modificar

| Arquivo | Mudanca |
|---------|--------|
| `src/App.tsx` | Adicionar rota `/renascer` com lazy load |
| `src/components/layout/ClientSidebar.tsx` | Adicionar "Renascer" como primeiro item do menu |
| `src/components/navigation/BottomNav.tsx` | Substituir "Inicio" por "Renascer" apontando para `/renascer` |

---

## 4. Logica do Score (useRenascerScore)

O hook combina dados de `manual_day_logs` (ultimos 7 dias) com `health_daily` (se existir):

### Calculo do Score (0-100)

Comeca em 100 e aplica penalidades:

```text
Base: 100

Sono:
  < 5h: -35
  < 6h: -20
  < 7h: -10

Estresse:
  > 80: -20
  > 60: -10

Energia/Foco:
  1: -25
  2: -15
  3: -5
  4: 0
  5: +5 (bonus)

Treino recente (ontem):
  Sim com RPE >= 8: -15
  Sim com RPE 5-7: -10
  Sim com RPE < 5: -5

Clamp 0-100
```

### Classificacao

```text
>= 85: ELITE     | "PRONTO PARA EVOLUIR"
>= 65: ALTO      | "TREINAR COM CONTROLE"
>= 40: MODERADO  | "RECUPERAR"
<  40: RISCO     | "REDUZIR CARGA"
```

### Tendencia

Compara media dos ultimos 3 dias vs media dos 3 dias anteriores:
- Media subiu >= 5 pontos: "Seu corpo esta melhorando" (seta para cima)
- Media caiu >= 5 pontos: "Seu corpo esta pedindo recuperacao" (seta para baixo)
- Caso contrario: "Seu corpo esta estavel" (seta lateral)

### Recomendacao (3 bullets)

Baseada no score:
```text
ELITE (>= 85):
  - "Treino intenso"
  - "Volume: 100% do programado"
  - "RPE ate 9 — pode buscar falha"

ALTO (>= 65):
  - "Treino moderado"
  - "Volume: 80% do programado"
  - "RPE ate 7 — evitar falha"

MODERADO (>= 40):
  - "Treino leve + tecnica"
  - "Volume: 50-60%"
  - "RPE ate 5 — foco em execucao"

RISCO (< 40):
  - "Recuperacao ativa"
  - "Mobilidade + caminhada leve"
  - "Sem carga — priorize descanso"
```

---

## 5. Manual Inteligente (30s) — Fluxo de Salvamento

Ao clicar "Salvar meu dia":

1. Upsert em `manual_day_logs` (user_id + date como chave unica)
2. Upsert em `health_daily` com `sleep_minutes = sleep_hours * 60` e `source = 'manual'` (para manter compatibilidade com Score de Prontidao existente em `/dados-corpo`)
3. Invalidar query cache (`queryClient.invalidateQueries`)
4. Toast: "Dia registrado. Seu Score foi atualizado."
5. Score re-renderiza automaticamente

---

## 6. Toggle "Dados automaticos"

- Salvo em `profiles.data_mode` ('manual' | 'auto')
- Quando `auto` e sem wearable conectado: formulario oculto, mostra card "Conectar relogio (em breve)" com botao "Saiba mais" abrindo WearableModal
- Quando `manual`: mostra formulario normalmente

---

## 7. Wearable Stubs (Fase 2 preparacao)

### `src/lib/wearables/types.ts`
```text
WearableProvider = 'none' | 'android_health_connect' | 'apple_healthkit'
WearableData = { steps, sleepHours, restingHr, hrv, source, lastSyncAt }
```

### `src/lib/wearables/wearablesService.ts`
Funcoes stub que retornam `{ provider: 'none', connected: false }` e `throw Error('not_implemented')` para acoes.

### `src/lib/wearables/useWearables.ts`
Hook que expoe `status`, `requestPermissions`, `syncNow` — tudo "nao conectado" por enquanto.

### `WearableModal.tsx`
Modal simples explicando Android Health Connect e Apple Health, sem links externos, com texto "Em breve voce conectara e o app preenchera automaticamente".

---

## 8. Layout do RenascerDashboard

```text
+------------------------------------------+
| Ola, [NOME]                              |
| "Voce esta no controle hoje."            |
+------------------------------------------+
|                                          |
|     [===== SCORE RING =====]             |
|          78 / 100                        |
|       Badge: ALTO                        |
|  "TREINAR COM CONTROLE"                  |
|                                          |
+------------------------------------------+
| Tendencia                                |
| -> "Seu corpo esta melhorando"           |
| [______ sparkline 7 dias ______]         |
+------------------------------------------+
| Recomendacao do Dia                      |
| * Treino moderado                        |
| * Volume: 80%                            |
| * RPE ate 7 - evitar falha              |
+------------------------------------------+
| Registrar hoje (30s)                     |
| [toggle] Dados automaticos              |
|                                          |
| Sono: [___7.5___] h                      |
| Estresse: [====slider====]              |
| Energia: [1] [2] [3] [4] [5]           |
| Treinei? [toggle]  RPE: [___7___]       |
|                                          |
| [===== SALVAR MEU DIA =====]            |
+------------------------------------------+
| Link: "Painel Avancado" -> /dados-corpo  |
+------------------------------------------+
```

---

## 9. Navegacao

- **Sidebar**: "Renascer" como primeiro item (icone Flame), antes de Dashboard
- **BottomNav mobile**: Substituir "Inicio" (/dashboard) por "Renascer" (/renascer)
- **Link secundario**: No final do RenascerDashboard, link "Painel Avancado" apontando para `/dados-corpo`
- Dashboard existente continua acessivel via sidebar

---

## O que NAO sera feito

- Nao alterar `useHealthData.ts` nem `/dados-corpo`
- Nao implementar integracao real com wearables
- Nao criar graficos complexos (apenas 1 sparkline)
- Nao alterar rotas de auth, RLS existente, ou schema do SIS
- Nao remover nenhuma tela existente
