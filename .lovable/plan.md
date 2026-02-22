

# MASTER SPRINT — Hardening Completo + Performance + UX Premium

## Analise do Estado Atual

Apos auditoria completa do codigo, identifiquei os problemas reais e o que ja foi feito. Abaixo, o plano organizado por prioridade.

---

## PARTE 1 — SEGURANCA CRITICA (P0)

### 1.1 Proteger rotas /admin/* e /mqo no router

**Problema:** Linhas 127-146 do `src/App.tsx` — todas as rotas admin e /mqo estao SEM guard. Qualquer usuario autenticado (ou mesmo nao autenticado) pode navegar diretamente para `/admin`, `/admin/clientes`, `/mqo`, etc. A verificacao de admin e feita internamente em cada pagina, mas o componente carrega e faz queries antes de redirecionar.

**Solucao:**
- Criar componente `AdminGuard` em `src/components/auth/AdminGuard.tsx`
- Verificar autenticacao + role admin via `useAdminCheck`
- Se nao for admin: redirecionar para `/acesso-bloqueado`
- Envolver TODAS as rotas admin e /mqo com `<AdminGuard>` no App.tsx

**Arquivos:**
- Criar: `src/components/auth/AdminGuard.tsx`
- Modificar: `src/App.tsx` (linhas 127-146)

### 1.2 Proteger Edge Functions expostas (verify_jwt = false)

**Problema identificado no config.toml:** 9 funcoes com `verify_jwt = false`:
- `stripe-webhook` — OK (webhook externo, valida signature)
- `send-password-reset` — OK (precisa ser publico)
- `send-urgent-support-alert` — RISCO (pode ser chamada por qualquer um)
- `weekly-support-report` — RISCO
- `check-free-expiration` — RISCO (cron, mas exposta)
- `complete-guest-checkout` — aceitavel (checkout flow)
- `finalize-checkout` — aceitavel
- `sync-exercise-gifs` — RISCO (admin only)
- `suggest-exercise-name` — tem comentario dizendo "auth validated in code"
- `cleanup-old-conversations` — RISCO (cron)
- `audit-treino` — RISCO
- `health-sync` — RISCO (aceita payload sem auth)

**Solucao para funcoes de risco:**
Adicionar validacao de JWT no CODIGO de cada funcao (nao mudar config.toml, pois algumas sao chamadas por cron). Adicionar verificacao de `Authorization` header com `getClaims()` nas funcoes:
- `send-urgent-support-alert`
- `weekly-support-report`
- `audit-treino`
- `health-sync`
- `sync-exercise-gifs`
- `cleanup-old-conversations`
- `check-free-expiration`

**Arquivos:** 7 edge functions index.ts

### 1.3 Sessao de treino — melhorar resiliencia

**Estado atual:** Ja implementado:
- Persistencia em `active_workout_sessions` (banco)
- `rehydrateSession` no mount
- Auto-abandon de sessoes > 4h
- Timer de descanso persistido via localStorage

**Melhoria:** Adicionar coluna `last_seen_at` e atualizar periodicamente (heartbeat a cada 60s). Mudar logica de abandon para usar `last_seen_at` em vez de `started_at` quando disponivel, permitindo sessoes longas reais.

**Arquivos:**
- Migration: adicionar coluna `last_seen_at` em `active_workout_sessions`
- Modificar: `src/hooks/useWorkoutSession.ts` (adicionar heartbeat + logica de pausa)

---

## PARTE 2 — PERFORMANCE (P1)

### 2.1 Lazy-load do exercisesDatabase.json

**Problema:** `src/data/exercisesDatabase.json` (1.3MB) e importado estaticamente em `AdminExerciseGifs.tsx`, carregando no bundle principal.

**Solucao:** Converter o import estatico para `dynamic import()` — o JSON so carrega quando a pagina AdminExerciseGifs e aberta (ja e lazy-loaded via `React.lazy`, mas o JSON nao e).

**Arquivo:** `src/pages/admin/AdminExerciseGifs.tsx`

### 2.2 Indices criticos no banco

Criar indices para queries frequentes:

```sql
CREATE INDEX IF NOT EXISTS idx_events_user_created ON events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workout_completions_user_date ON workout_completions(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_manual_day_logs_user_date ON manual_day_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_daily_user_date ON health_daily(user_id, date);
```

**Arquivo:** Nova migration SQL

### 2.3 Politica de retencao da tabela events

Criar funcao de limpeza para manter apenas ultimos 180 dias:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
BEGIN
  DELETE FROM events WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Agendar via pg_cron (semanal).

---

## PARTE 3 — CONSISTENCIA VISUAL (P1)

### 3.1 Verificacao

Apos auditoria, as seguintes paginas JA usam o Design System (PageHeader, StatCardMini, EmptyState):
- Dashboard (aluno) -- OK
- Treino -- OK
- Nutricao -- OK
- Evolucao -- OK
- Renascer (Hoje) -- OK
- DadosCorpo -- OK
- AdminDashboard -- OK

**Pendente:** Simplificar `HealthDashboardTab` — reduzir 3 tabs para foco principal + "Ver detalhes". Porem esta mudanca e cosmetica e nao critica. Manter como esta por ora e focar em seguranca/performance.

---

## PARTE 4 — LIMPEZA DE CODIGO (P1)

### 4.1 Remover pagina AreaCliente

**Problema:** `src/pages/AreaCliente.tsx` e uma pagina legada com design antigo (gradientes, cards grandes, estilo pre-refatoracao). O Dashboard atual ja substitui toda sua funcionalidade.

**Solucao:**
- Remover a rota `/area-cliente` do App.tsx (linha 116)
- Remover o arquivo `src/pages/AreaCliente.tsx`
- Remover a importacao lazy (linha 30)
- Redirecionar qualquer referencia interna para `/dashboard`

**Nota sobre authStore.ts e healthkit.ts:** NAO remover. Ambos sao usados ativamente pelas paginas do Renascer Connect (`/connect/*`), que e o app mobile Capacitor. Sao servicos essenciais para o conector mobile.

### 4.2 Remover console.logs de debug

Fazer busca e remover `console.log` e `console.error` nao-essenciais em:
- `src/hooks/useWorkoutSession.ts`
- `src/pages/Evolucao.tsx`
- Outros hooks

---

## PARTE 5 — ESCALABILIDADE (P2)

### 5.1 Cache react-query consistente

**Estado atual:** QueryClient ja configurado com `staleTime: 5min` e `refetchOnWindowFocus: false`. Hooks como `useSubscription` e `useEntitlements` usam cache session-level.

**Melhoria:** Nenhuma acao critica necessaria. A arquitetura atual suporta ate ~10k usuarios sem problemas. Para 100k+, sera necessario:
- Materialized views para engagement_summary (futuro)
- Connection pooling configurado no Supabase (via dashboard)
- CDN para assets estaticos

### 5.2 Lazy loading de imagens

As imagens de transformacao e fotos de corpo ja usam URLs assinadas do Storage. Adicionar `loading="lazy"` nas tags `<img>` da galeria de evolucao.

---

## RESUMO DE ARQUIVOS

### Criar
| Arquivo | Descricao |
|---------|-----------|
| `src/components/auth/AdminGuard.tsx` | Guard para rotas administrativas |

### Modificar
| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Envolver rotas admin/mqo com AdminGuard + remover AreaCliente |
| `src/hooks/useWorkoutSession.ts` | Adicionar heartbeat last_seen_at |
| `src/pages/admin/AdminExerciseGifs.tsx` | Dynamic import do exercisesDatabase.json |
| `supabase/functions/send-urgent-support-alert/index.ts` | Adicionar validacao JWT |
| `supabase/functions/weekly-support-report/index.ts` | Adicionar validacao JWT |
| `supabase/functions/audit-treino/index.ts` | Adicionar validacao JWT |
| `supabase/functions/health-sync/index.ts` | Adicionar validacao JWT |
| `supabase/functions/sync-exercise-gifs/index.ts` | Adicionar validacao JWT |
| `supabase/functions/cleanup-old-conversations/index.ts` | Adicionar validacao JWT |
| `supabase/functions/check-free-expiration/index.ts` | Adicionar validacao JWT |

### Remover
| Arquivo | Razao |
|---------|-------|
| `src/pages/AreaCliente.tsx` | Pagina legada substituida pelo Dashboard |

### Database (Migrations)
| Mudanca | Descricao |
|---------|-----------|
| Adicionar coluna `last_seen_at` em `active_workout_sessions` | Heartbeat para sessoes de treino |
| Criar 4 indices em events, workout_completions, manual_day_logs, health_daily | Performance de queries |
| Criar funcao `cleanup_old_events()` | Retencao de 180 dias |

### NAO alterar
- `authStore.ts` — usado pelo Renascer Connect (mobile)
- `healthkit.ts` — usado pelo Renascer Connect (mobile)
- `supabase/config.toml` — nao pode ser editado manualmente
- Sidebar/BottomNav — ja corretos
- Score engine / bodyIndicators — ja corretos
- PDF generator — ja usa helvetica consistentemente

---

## Score Projetado Pos-Sprint

| Dimensao | Antes | Depois |
|----------|-------|--------|
| Arquitetura | 7.5 | 8.5 |
| Seguranca | 7.0 | 9.0 |
| Performance | 7.0 | 8.0 |
| UX | 7.5 | 7.5 |
| Escalabilidade | 6.0 | 7.5 |
| **Geral** | **7.0** | **8.1** |

