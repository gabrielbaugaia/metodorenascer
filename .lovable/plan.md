
# Plano: Correção do Bug de Acesso aos Protocolos de Clientes

## Diagnóstico do Problema

Os clientes **Vinicius** e **bau@gabrielbau.com.br** não conseguem acessar seus protocolos de treino porque:

1. **A Edge Function `check-subscription` não reconhece o status "free"**: A query busca apenas por `status = "active"`, mas assinaturas gratuitas podem ter `status = "free"` ou `plan_type = "gratuito"`.

2. **A lógica de validação local está incompleta**: Mesmo encontrando a assinatura no banco local, a função não trata corretamente os planos gratuitos/free.

3. **O fluxo está indo ao Stripe desnecessariamente**: Para planos gratuitos, não deveria consultar o Stripe, pois não há cliente real.

## Dados Confirmados no Banco

| Cliente | Status | Plan Type | Stripe ID |
|---------|--------|-----------|-----------|
| bau@gabrielbau.com.br | active | gratuito | invite_... |
| vinicius.hs@outlook.com | active | embaixador | cus_Trkk... |

Os dois têm assinaturas válidas e ativas, mas a Edge Function está retornando `subscribed: false`.

## Plano de Correção

### 1. Corrigir a Edge Function `check-subscription`

Atualizar a query de assinatura local para incluir todos os status válidos:

```text
Alterar a linha que busca status = "active" para:
.in("status", ["active", "free"])
```

E adicionar verificação para planos gratuitos não irem ao Stripe:

```text
Se plan_type = "gratuito" ou status = "free":
  - Retornar subscribed: true imediatamente
  - Não consultar Stripe
```

### 2. Arquivos a Modificar

**`supabase/functions/check-subscription/index.ts`**
- Alterar query na linha ~60-66 para incluir status "free"
- Adicionar lógica para skip Stripe em planos gratuitos
- Melhorar logs para debug

### 3. Também Atualizar `SubscriptionGuard.tsx`

Garantir que a verificação local também considere status "free":
- Linha ~72-75: adicionar "free" na verificação de status ativo

### 4. Deploy e Teste

Após as correções:
1. Deploy automático da Edge Function
2. Testar com as contas dos clientes afetados
3. Confirmar que o protocolo de treino aparece

## Benefícios

- Clientes com planos gratuitos terão acesso correto
- Menos chamadas desnecessárias ao Stripe (performance)
- Logs melhorados para debug futuro

## Resumo Técnico

O bug ocorre porque a Edge Function `check-subscription` não está tratando corretamente os planos gratuitos criados pelo admin. A query só busca `status = "active"` e depois vai ao Stripe, que obviamente não encontra nenhum cliente para emails de planos gratuitos, retornando `subscribed: false` e bloqueando o acesso.

A solução é:
1. Incluir status "free" na query local
2. Para planos gratuitos, retornar imediatamente sem consultar Stripe
3. Atualizar o SubscriptionGuard no frontend para consistência
