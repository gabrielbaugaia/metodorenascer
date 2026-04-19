

## Plano: Captura de leads do Quiz para reativação comercial

### Como vai funcionar

Adicionar um **passo de captura de contato** no quiz (entre o resultado e a oferta) onde a pessoa preenche **nome, email e WhatsApp** para "liberar a análise completa". Isso converte 100% dos quiz-completers em leads qualificados, mesmo quem não fecha a compra.

Todos os dados ficam numa nova tabela `quiz_leads` com:
- Respostas do quiz (sono, stress, compulsão, treino) → permite segmentar quem tem maior dor
- Score de risco calculado (% burnout)
- Status: `completed_quiz` / `viewed_offer` / `clicked_checkout` / `converted`
- UTM source/medium para rastrear origem da campanha
- Timestamp de cada etapa para identificar onde travou

### Fluxo do quiz atualizado

```text
Step 0: Hero
Step 1-4: Perguntas (sono, stress, compulsão, treino)
Step 5: Resultado parcial (% risco) ──┐
Step 6: 🆕 CAPTURA → Nome + Email + WhatsApp
        └─ INSERT em quiz_leads (status: completed_quiz)
Step 7: Mentor (Gabriel Baú)
Step 8: Método
Step 9: Sistema
Step 10: Oferta R$ 497
        └─ UPDATE status: viewed_offer
        └─ Click no Stripe → UPDATE status: clicked_checkout
```

### Nova aba no admin: `/admin/leads-quiz`

Painel com tabela filtrável:
- **Filtros**: Score de risco (alto/médio/baixo), status (completou quiz / viu oferta / clicou checkout / converteu), data, UTM source
- **Colunas**: Nome, WhatsApp, Email, Risco %, Quando completou, Última ação, Respostas detalhadas (expandível)
- **Ações por lead**: Copiar WhatsApp, marcar como contatado, exportar CSV
- **Métricas no topo**: Total de leads, taxa de conversão por etapa (funil visual: completou quiz → viu oferta → clicou checkout → comprou)

### Mudanças no banco

**Nova migration** — criar tabela `quiz_leads`:
```text
- id, created_at
- nome, email, whatsapp
- quiz_answers (jsonb com 4 respostas)
- risk_score (0-100)
- status: completed_quiz | viewed_offer | clicked_checkout | converted
- utm_source, utm_medium, utm_campaign
- viewed_offer_at, clicked_checkout_at, converted_at
- contacted_by_admin (bool), contacted_at, contact_notes
- session_id (correlaciona com analytics)
```

RLS:
- INSERT público (anyone can submit)
- SELECT/UPDATE só admin
- Service role full access (para webhook Stripe marcar `converted`)

### Mudanças no código

**Editar `src/pages/Quiz.tsx`**:
- Adicionar Step 6 com formulário (Nome, Email, WhatsApp) — validação básica e botão "Liberar análise completa"
- Renumerar steps existentes (Mentor 6→7, Método 7→8, Sistema 8→9, Oferta 9→10)
- Persistir `leadId` em estado para fazer UPDATE conforme avança
- Atualizar contadores das barras de progresso
- Capturar UTM da URL no mount

**Nova página `src/pages/admin/AdminLeadsQuiz.tsx`**:
- Tabela com filtros (reusar padrão de `AdminLeads.tsx` existente)
- Funil visual no topo (4 cards: completaram → viram oferta → clicaram → converteram)
- Modal lateral com detalhes do lead (respostas + ações de contato)
- Export CSV dos leads filtrados

**Editar `src/components/layout/AdminSidebar.tsx`** (ou onde fica o menu admin):
- Adicionar item "Leads do Quiz" no menu

**Editar `src/App.tsx`**:
- Adicionar rota `/admin/leads-quiz`

**Editar `supabase/functions/stripe-webhook/index.ts`**:
- Quando pagamento de R$ 497 é confirmado e o email bate com algum `quiz_leads`, fazer UPDATE `status='converted', converted_at=now()`

### Onde isso ajuda comercialmente

1. **Lista quente diária**: Quem completou o quiz nas últimas 24-48h e não comprou → contato imediato no WhatsApp
2. **Segmentação por dor**: Risco >70% (burnout severo) → abordagem urgente "vi seu resultado, precisamos conversar"
3. **Reengajamento**: Quem clicou no checkout mas não pagou → oferta especial / parcelamento
4. **Campanhas de email/WhatsApp em massa**: Filtrar por risco + UTM e disparar oferta direcionada

### Resumo dos arquivos

- **Nova migration**: criar `quiz_leads` + RLS
- **Editar**: `src/pages/Quiz.tsx` (adicionar step de captura)
- **Nova página**: `src/pages/admin/AdminLeadsQuiz.tsx`
- **Editar**: `src/App.tsx` (rota admin)
- **Editar**: sidebar admin (item de menu)
- **Editar**: `supabase/functions/stripe-webhook/index.ts` (marcar conversão)

