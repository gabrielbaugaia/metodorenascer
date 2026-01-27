
# Plano de Correção: Acesso do Cliente Vinicius Henrique Souza

## Diagnóstico Completo

Identifiquei **2 problemas distintos** afetando o cliente `vinicius.hs@outlook.com`:

---

## Problema 1: Sincronização Stripe Falhou

### Causa Raiz
O log mostra claramente:
```
[SYNC-STRIPE-SUB] ERROR - {"message":"Error upserting subscription: there is no unique or exclusion constraint matching the ON CONFLICT specification"}
```

A Edge Function `sync-stripe-subscription` (linha 218) tenta fazer:
```javascript
.upsert(subscriptionData, { onConflict: "user_id" })
```

Porém, a tabela `subscriptions` **não possui um índice UNIQUE na coluna `user_id`**, causando falha no upsert.

### Dados do Stripe (encontrados)
- **Cliente Stripe**: `cus_TrkkbMTUtNiNCr`
- **Assinatura Stripe**: `sub_1Su1FKCuFZvf5xFdNAokNkTc`
- **Status**: active
- **Plano**: ELITE Fundador (price_1ScZqTCuFZvf5xFdZuOBMzpt)

### Dados no Banco (incompletos)
A assinatura existe mas com campos nulos:
- `stripe_customer_id`: NULL
- `stripe_subscription_id`: NULL
- `status`: active
- `plan_type`: embaixador

### Solucao

#### Parte A: Criar indice UNIQUE na tabela subscriptions (Migration SQL)
```sql
-- Adicionar constraint UNIQUE em user_id para permitir upsert
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
```

#### Parte B: Atualizar assinatura do Vinicius manualmente (SQL de dados)
```sql
UPDATE public.subscriptions 
SET 
  stripe_customer_id = 'cus_TrkkbMTUtNiNCr',
  stripe_subscription_id = 'sub_1Su1FKCuFZvf5xFdNAokNkTc',
  updated_at = NOW()
WHERE user_id = 'ad095bfc-429b-4467-8dd2-966123f5650e';
```

---

## Problema 2: Reset de Senha Falhou

### Causa Raiz
O log mostra:
```
AuthWeakPasswordError: Password is known to be weak and easy to guess
reasons: [ "pwned" ]
```

A senha que voce tentou definir esta em listas publicas de senhas vazadas (verificacao do Supabase Auth).

### O que aconteceu
O sistema de reset de senha esta funcionando corretamente, mas a senha escolhida foi rejeitada. A Edge Function ja tem o mapeamento de erro em portugues, mas provavelmente a mensagem nao apareceu claramente no toast do frontend.

### Solucao
Nao precisa corrigir codigo. Basta usar uma senha mais forte no formato: `Vinicius@2026!` ou `Cliente#Metodo2026`

O Supabase exige senhas que:
1. Nao estejam em listas de vazamentos conhecidos
2. Tenham combinacao de maiusculas, minusculas, numeros e simbolos

---

## Resumo das Alteracoes

| Tipo | Acao | Impacto |
|------|------|---------|
| Migration SQL | Criar UNIQUE constraint em subscriptions.user_id | Permite upsert funcionar em futuras sincronizacoes |
| Data Update | Atualizar stripe_customer_id e stripe_subscription_id do Vinicius | Corrige o vinculo com Stripe imediatamente |
| Senha | Usar senha forte como Vinicius@2026! | Permitira reset funcionar |

---

## Passos Apos Aprovacao

1. Executarei a migration para criar a constraint UNIQUE
2. Atualizarei os dados do Stripe na assinatura do Vinicius
3. Voce podera tentar resetar a senha novamente usando `Vinicius@2026!` ou similar
4. O cliente podera acessar normalmente

---

## Resultado Esperado

Apos as correcoes:
1. O cliente Vinicius tera acesso completo ao sistema
2. A sincronizacao manual com Stripe funcionara para todos os clientes futuros
3. O reset de senha funcionara com senhas fortes
