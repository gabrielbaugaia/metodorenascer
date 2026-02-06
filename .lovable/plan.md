

# Alterar Plano em Lote: Exigir Pagamento (Sem Acesso Imediato)

## Problema Atual

Quando voce muda clientes de GRATUITO para ELITE FUNDADOR via acao em lote, o sistema seta:
- `subscription.status = "active"` (acesso liberado)
- `entitlements.access_level = "full"` (acesso total)

Isso faz o cliente entrar direto na plataforma sem pagar.

## Solucao

Alterar o `BatchPlanModal` para marcar como `pending_payment` em vez de `active`, mantendo o entitlement em `none`. Dessa forma, quando o cliente fizer login, o Dashboard (que ja tem essa logica implementada) mostra automaticamente a tela "Pagamento Pendente" com o botao "Pagar Agora" via Stripe.

## Fluxo do Cliente Apos a Mudanca

```text
Admin muda plano em lote
        |
        v
subscription.status = "pending_payment"
entitlements.access_level = "none"
        |
        v
Cliente faz login
        |
        v
Dashboard detecta "pending_payment"
        |
        v
Exibe tela de pagamento com botao "Pagar Agora"
        |
        v
Cliente paga via Stripe --> webhook ativa a subscription
```

## Mudancas Tecnicas

### Arquivo: `src/components/admin/BatchPlanModal.tsx`

Apenas 3 alteracoes no `handleConfirm`:

1. **Subscription status**: mudar de `"active"` para `"pending_payment"`
2. **Entitlements access_level**: mudar de `"full"` para `"none"`
3. **Profile client_status**: mudar de `"active"` para `"pending_payment"`

A tela de pagamento pendente ja existe no Dashboard (linhas 338-389) e ja mapeia os `plan_type` para os `priceId` corretos do Stripe, entao nenhuma mudanca adicional e necessaria no frontend.

### Nenhum arquivo novo

### Nenhuma mudanca no Dashboard, SubscriptionGuard ou AcessoBloqueado

Toda a logica de exibir a tela de pagamento e redirecionar apos confirmacao ja esta implementada.

