

# Corrigir Metricas Financeiras: Contar Apenas Vendas Reais do Stripe

## Diagnostico

Analisei os dados e encontrei o problema central: das 21 assinaturas marcadas como "active" no banco, **apenas 1 tem pagamento real no Stripe** (Vinicius, com `stripe_subscription_id`). Os demais foram ativados manualmente (convite ou acao em lote) e nao pagaram.

**Rosangela**: ela TEM uma assinatura ativa no Stripe (`sub_1SnfhTCuFZvf5xFd0NKP23HZ`, cliente `cus_TlC5Rq3n1zIxuJ`), mas o banco nao esta sincronizado -- o `stripe_subscription_id` esta vazio e o `stripe_customer_id` esta com o valor do convite. Sera necessario corrigir o registro dela.

## Regra de Negocio

- **Venda/Receita** = somente subscriptions com `stripe_subscription_id IS NOT NULL` (pagou de fato pelo Stripe)
- **Cadastro** = todos os demais (gratuito, pending_payment, movido manualmente sem pagamento)

## O Que Sera Feito

### 1. Corrigir dados da Rosangela no banco

Atualizar o registro dela na tabela `subscriptions` com o `stripe_subscription_id` e `stripe_customer_id` reais do Stripe, e setar `mrr_value = 4990` para que ela apareca corretamente nas metricas.

### 2. Atualizar Views do banco de dados (migration)

Recriar as 3 views financeiras adicionando o filtro `AND stripe_subscription_id IS NOT NULL`:

| View | O que muda |
|------|-----------|
| `v_mrr_summary` | So soma MRR de quem tem stripe_subscription_id |
| `v_metrics_by_channel` | So conta active_subscribers e total_mrr de quem tem stripe_subscription_id |
| `v_retention_cohorts` | So rastreia retencao de quem efetivamente pagou |

### 3. Corrigir AdminDashboard.tsx (codigo frontend)

O Dashboard admin busca subscriptions e calcula metricas financeiras localmente. Atualmente filtra por `plan_type !== "free" && price_cents > 0`, mas isso inclui quem foi movido manualmente para Elite Fundador sem pagar.

Mudancas:
- Adicionar `stripe_subscription_id` ao `select` da query
- Filtrar `paidActiveSubs` para incluir apenas registros com `stripe_subscription_id` preenchido
- Corrigir calculo de churn para usar mesma logica
- Corrigir distribuicao por plano para separar "pagantes reais" de "cadastros"

### 4. Nenhuma mudanca em AdminMetricas.tsx

A pagina de Metricas ja consome as views do banco (`v_mrr_summary`, etc). Ao corrigir as views, os dados exibidos la serao automaticamente corretos.

---

## Detalhes Tecnicos

### Migration SQL

```text
-- Recriar v_mrr_summary com filtro stripe_subscription_id
WHERE status = 'active' AND stripe_subscription_id IS NOT NULL

-- Recriar v_metrics_by_channel com filtro
CASE WHEN s.status = 'active' AND s.stripe_subscription_id IS NOT NULL THEN ...

-- Recriar v_retention_cohorts com filtro
WHERE started_at IS NOT NULL AND stripe_subscription_id IS NOT NULL
```

### AdminDashboard.tsx

```text
// Select
.select("status, price_cents, plan_type, created_at, updated_at, stripe_subscription_id")

// Filtro de pagantes reais
const paidActiveSubs = activeSubs.filter(
  s => s.stripe_subscription_id != null
);

// Churn so de quem pagou
const paidCanceledSubs = canceledSubs.filter(
  s => s.stripe_subscription_id != null
);
```

### Dados da Rosangela (INSERT/UPDATE)

```text
UPDATE subscriptions
SET stripe_subscription_id = 'sub_1SnfhTCuFZvf5xFd0NKP23HZ',
    stripe_customer_id = 'cus_TlC5Rq3n1zIxuJ',
    mrr_value = 4990
WHERE user_id = '4c64442e-985a-418d-8683-e90c9d871f95';
```

## Resultado Esperado

Apos as mudancas:
- **MRR**: R$ 99,80 (Vinicius R$49,90 + Rosangela R$49,90)
- **Assinantes Ativos (pagantes)**: 2
- **Total Clientes (cadastros)**: continua mostrando todos
- **Distribuicao por Plano**: mostra separadamente quantos pagam de fato vs quantos sao gratuitos/pendentes
