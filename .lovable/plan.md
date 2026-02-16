

# MVP "Dados do Corpo" - Health Metrics para Renascer

## Resumo

Criar um sistema completo de metricas de saude integrado ao app Renascer, com sincronizacao via conector mobile (Apple HealthKit / Health Connect), armazenamento seguro, painel visual e calculo de score de prontidao.

---

## 1. Banco de Dados (Migracoes SQL)

### Tabela `health_daily`
- Armazena 1 registro por usuario por dia (upsert)
- Campos: steps, active_calories, sleep_minutes, resting_hr, hrv_ms, source
- Constraint UNIQUE(user_id, date)
- Indice em (user_id, date DESC)
- Trigger para atualizar `updated_at` automaticamente

### Tabela `health_workouts`
- Multiplos treinos por dia
- Campos: start_time, end_time, type, calories, source
- Indice em (user_id, start_time DESC)

### RLS (Row Level Security)
- SELECT/INSERT/UPDATE/DELETE: somente `auth.uid() = user_id`
- Admins: acesso total via `has_role(auth.uid(), 'admin')`

**Nota importante**: As foreign keys referenciam `profiles(id)` seguindo a arquitetura do projeto (conforme memoria `database/user-referencing-architecture`).

---

## 2. Edge Function `health-sync`

Endpoint POST para o conector mobile enviar dados:

- Valida JWT do usuario (Authorization Bearer)
- Forca `user_id = auth.uid()` (ignora qualquer user_id enviado pelo cliente)
- Faz UPSERT em `health_daily` por (user_id, date)
- Insere workouts em lote em `health_workouts`
- Evita duplicacao de workouts por (user_id, start_time, type)
- Retorna `{ ok: true, daily_upserted: true, workouts_inserted: N }`

Payload esperado:
```text
POST /functions/v1/health-sync
{
  "date": "YYYY-MM-DD",
  "daily": { steps, active_calories, sleep_minutes, resting_hr, hrv_ms, source },
  "workouts": [{ start_time, end_time, type, calories, source }]
}
```

---

## 3. Novas Telas no App

### Rota: `/dados-corpo`

Protegida por SubscriptionGuard. Adicionada ao menu lateral (sidebar) com icone de coracao/pulso.

### 3 Abas internas:

**A) Conectar Relogio**
- Instrucoes para sincronizar Apple Watch / Android Watch
- Status da ultima sincronizacao (data + fonte)
- Botoes "Ver instrucoes iPhone" e "Ver instrucoes Android"

**B) Painel (Hoje + 7 dias)**
- Cards do dia atual: Passos, Calorias Ativas, Sono (formato h:min), FC Repouso, HRV
- Lista dos ultimos 7 dias em cards compactos
- Estado vazio com CTA "Conectar relogio" se sem dados

**C) Prontidao (Score 0-100)**
- Calculo baseado nos ultimos 7 dias:
  - Base 100 pontos
  - Sono < 6h: -20 | Sono < 5h: -35
  - FC repouso > baseline + 5: -15
  - HRV < baseline * 0.85: -15
  - Passos < 4000: -5
  - Treino nas ultimas 24h: -10
- Exibicao visual do score (circular)
- Recomendacao do dia:
  - >= 80: "Treino normal"
  - 60-79: "Reduzir volume em 20%"
  - 40-59: "Treino leve + tecnica"
  - < 40: "Mobilidade + caminhada leve"

---

## 4. Feature Flag

Constante `ENABLE_HEALTH_METRICS = true` em arquivo de configuracao.
- Se false: esconde menu e rota
- Se true: mostra tudo

---

## 5. Botao de Dados de Teste

Visivel apenas para admins: "Inserir dados de exemplo"
- Preenche 7 dias de `health_daily` com dados plausíveis
- Insere 1 workout no dia anterior
- Permite testar UI e score sem conector real

---

## Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `src/pages/DadosCorpo.tsx` | Pagina principal com 3 abas |
| `src/components/health/HealthConnectTab.tsx` | Aba "Conectar Relogio" |
| `src/components/health/HealthDashboardTab.tsx` | Aba "Painel" com cards e historico |
| `src/components/health/HealthReadinessTab.tsx` | Aba "Prontidao" com score e recomendacao |
| `src/hooks/useHealthData.ts` | Hook para queries de health_daily e health_workouts |
| `src/lib/healthConfig.ts` | Feature flag e constantes |
| `supabase/functions/health-sync/index.ts` | Edge function de sincronizacao |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/App.tsx` | Adicionar rota `/dados-corpo` com lazy loading e SubscriptionGuard |
| `src/components/layout/ClientSidebar.tsx` | Adicionar item "Dados do Corpo" no menu do cliente |
| `supabase/config.toml` | Adicionar configuracao da edge function `health-sync` |

---

## Secao Tecnica

- As tabelas `daily_activity` e `workout_sessions` ja existentes NAO serao alteradas. As novas tabelas `health_daily` e `health_workouts` sao independentes e dedicadas ao fluxo de metricas de saude do conector mobile.
- O hook `useHealthData` faz 2 queries otimizadas: (1) ultimos 7 dias de `health_daily` e (2) workouts das ultimas 24h de `health_workouts`.
- O score de prontidao e calculado inteiramente no frontend (sem edge function adicional) para simplicidade do MVP.
- A edge function `health-sync` usa `verify_jwt = false` no config.toml e valida JWT no codigo via `getClaims()` conforme padrao do projeto.
- O botao de dados de teste usa inserção direta via Supabase client (respeitando RLS, pois o admin tem policy ALL).
- Layout mobile-first: cards empilhados, texto minimo, score grande e visível.
