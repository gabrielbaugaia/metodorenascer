

# Corrigir Acesso da Laiza e Bug do check-subscription

## Problema

A funcao `check-subscription` consulta o Stripe filtrando apenas por `status: "active"` (linha 129). A assinatura da Laiza no Stripe esta com status `"trialing"` (periodo de teste do Stripe), entao a funcao nao encontra nada e sobrescreve o status local para "inactive", bloqueando o acesso dela.

Fluxo do bug:
1. `sync-stripe-subscription` sincroniza corretamente como "active" no banco local
2. `check-subscription` roda, consulta Stripe com filtro `status: "active"`
3. Stripe retorna 0 resultados (porque la esta "trialing")
4. Funcao sobrescreve status local para "inactive"
5. Entitlements ficam como "none" -- acesso bloqueado

## Correcao

### 1. `supabase/functions/check-subscription/index.ts`

Alterar a consulta do Stripe (linha 127-131) para buscar TAMBEM assinaturas com status "trialing":

- Trocar `status: "active"` por duas consultas: primeiro "active", se nao encontrar, buscar "trialing"
- Ou usar a API do Stripe sem filtro de status e verificar manualmente se e "active" ou "trialing"

Abordagem escolhida: remover o filtro `status: "active"` e filtrar no codigo, aceitando "active" e "trialing" como validos.

Tambem: quando encontrar uma assinatura "trialing", mapear para status local "active" (como o sync ja faz) e atualizar o entitlement para "full".

### 2. Atualizar entitlements junto com a subscription

Na secao de upsert da subscription (linha 231-243), adicionar um upsert na tabela `entitlements` para garantir que o access_level seja atualizado para "full" quando houver assinatura ativa ou trialing.

### 3. Acesso imediato da Laiza

A correcao do codigo resolve o problema para o futuro. Para liberar o acesso da Laiza AGORA, o admin pode usar o override de cortesia que ja existe no sistema (na pagina de detalhes do cliente), ou a correcao do check-subscription vai resolver na proxima vez que ela abrir o app.

## Resumo de Mudancas

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/check-subscription/index.ts` | Aceitar status "trialing" do Stripe como valido; atualizar entitlements junto com subscription |

## Impacto

- Qualquer cliente que pague via Stripe e entre em periodo de trial (ex: 7 dias gratis antes da cobranca) tera acesso liberado imediatamente
- Nenhuma tabela alterada, apenas logica da edge function
- Backward compatible: assinaturas "active" continuam funcionando normalmente

