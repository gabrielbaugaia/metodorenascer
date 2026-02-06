
# Corrigir Mapeamento de Precos no Dashboard

## Problema Encontrado

O fluxo de "pendente de pagamento" funciona corretamente: o cliente nao consegue acessar a plataforma e ve a tela de pagamento. Porem, o botao "Pagar Agora" tem um bug que impede o redirecionamento para o Stripe.

No Dashboard (linha 236), o mapeamento de precos usa a chave `elite_founder`, mas o `BatchPlanModal` salva o plano como `elite_fundador` (com 'd'). Resultado: quando o cliente clica em "Pagar Agora", o sistema nao encontra o preco correspondente e nada acontece.

## Solucao

Substituir o mapeamento manual (hardcoded) no Dashboard pelo mapeamento centralizado que ja existe em `planConstants.ts` (`STRIPE_PRICE_IDS`). Isso garante consistencia e evita esse tipo de erro de digitacao.

## Mudanca Tecnica

### Arquivo: `src/pages/Dashboard.tsx`

1. Importar `STRIPE_PRICE_IDS` de `@/lib/planConstants`
2. Remover o objeto `priceIdMap` hardcoded (linhas 235-241)
3. Usar `STRIPE_PRICE_IDS[data.plan_type]` no lugar

Antes:
```text
const priceIdMap = {
  elite_founder: "price_...",   <-- chave errada (falta o 'd')
  mensal: "price_...",
  ...
};
priceId: priceIdMap[data.plan_type]
```

Depois:
```text
import { STRIPE_PRICE_IDS } from "@/lib/planConstants";
// ...
priceId: STRIPE_PRICE_IDS[data.plan_type || "mensal"]
```

### Nenhum outro arquivo modificado

O `BatchPlanModal`, `SubscriptionGuard` e `AcessoBloqueado` permanecem inalterados.

## Resultado Esperado

1. Admin muda cliente de Gratuito para Elite Fundador via acao em lote
2. Cliente faz login e ve a tela "Pagamento Pendente"
3. Cliente clica "Pagar Agora" e e redirecionado ao Stripe com o preco correto (R$49,90)
4. Apos pagamento, webhook ativa a subscription automaticamente
