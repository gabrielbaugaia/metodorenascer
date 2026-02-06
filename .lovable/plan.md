
# Plano: Reestruturacao Completa do Sistema de Planos, Trial e Controle de Acesso

## Resumo

Este pacote unifica a pagina de precos (3 planos visiveis + dual CTA no Elite), cria uma tabela `entitlements` como fonte central de acesso, implementa um `UpgradeModal` padrao com links Stripe diretos, atualiza o webhook para sincronizar entitlements, e corrige usuarios "gratis elite" sem assinatura real.

---

## Links Stripe (Fixos)

| Tipo | URL |
|------|-----|
| Trial 7 dias | `https://buy.stripe.com/9B67sKeMW4ru2sp7Gy2B201` |
| Direto (sem trial) | `https://buy.stripe.com/fZu3cudIS3nqaYVf902B205` |

---

## Parte 1: Banco de Dados (Migracao SQL)

### 1.1 Criar tabela `entitlements`

```sql
CREATE TABLE entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'none',
  override_level text,
  override_expires_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

Valores possiveis para `access_level`: `'none'`, `'trial_limited'`, `'full'`
Valores possiveis para `override_level`: `'trial_limited'`, `'full'`, `NULL`

### 1.2 Criar tabela `trial_usage`

```sql
CREATE TABLE trial_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_workout boolean DEFAULT false,
  used_diet boolean DEFAULT false,
  used_mindset boolean DEFAULT false,
  used_recipe_count integer DEFAULT 0,
  used_support_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

### 1.3 Adicionar campo `trial_end` na tabela `subscriptions`

A tabela ja existe e tem os campos necessarios (stripe_customer_id, stripe_subscription_id, status, current_period_end). Adicionaremos:

```sql
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end timestamptz;
```

### 1.4 RLS Policies

- `entitlements`: Users SELECT own, Admins ALL, Service role ALL
- `trial_usage`: Users SELECT/UPDATE own, Admins ALL, Service role ALL

### 1.5 Migrar dados existentes

Para cada usuario com `subscriptions.status = 'active'`, criar entitlement com `access_level = 'full'`.
Para usuarios sem subscription ativa, criar entitlement com `access_level = 'none'`.
Corrigir usuarios elite sem pagamento real (item 7):

```sql
-- Corrigir elite "gratis" sem subscription Stripe real
UPDATE entitlements SET access_level = 'none'
WHERE user_id IN (
  SELECT s.user_id FROM subscriptions s
  WHERE s.plan_type IN ('elite_fundador','embaixador')
  AND (s.stripe_subscription_id IS NULL OR s.stripe_subscription_id = '')
  AND s.status NOT IN ('active','trialing')
);
```

---

## Parte 2: Hook `useEntitlements`

Novo hook que substitui a logica dispersa de `useModuleAccess` e `useSubscription` para acesso premium.

### Arquivo: `src/hooks/useEntitlements.ts`

```typescript
function useEntitlements() {
  // Busca da tabela entitlements
  // Calcula effective_access_level:
  //   se override_level != null E override_expires_at > now() -> override_level
  //   senao -> access_level
  
  return {
    effectiveLevel, // 'none' | 'trial_limited' | 'full'
    isTrialing,     // effectiveLevel === 'trial_limited'
    isFull,         // effectiveLevel === 'full'
    isBlocked,      // effectiveLevel === 'none'
    trialUsage,     // { used_workout, used_diet, etc. }
    loading,
    markUsed,       // (field: keyof trial_usage) => Promise
    refetch
  };
}
```

### Integracao com `useModuleAccess`

O hook `useModuleAccess` existente sera adaptado para consultar `entitlements` PRIMEIRO:

- Se `effective_level === 'full'` -> todos os modulos = `full`
- Se `effective_level === 'trial_limited'` -> verificar `trial_usage` para limites
- Se `effective_level === 'none'` -> todos os modulos = `none`

Isso mantem compatibilidade com o sistema `commercial_plans` ja criado, mas adiciona a camada de entitlements como autoridade final.

---

## Parte 3: Pagina de Precos (PricingSection)

### 3.1 Remover da UI: Mensal e Semestral

Filtrar o array `allPlans` para mostrar apenas 3 cards:
1. Elite Fundador
2. Trimestral
3. Anual

Os dados permanecem no backend para assinaturas existentes.

### 3.2 Card Elite Fundador (dual CTA)

Layout do card:

```text
+---------------------------------------------------+
|                              [25 VAGAS]           |
| Elite Fundador                                    |
| R$ 49,90 /mes                                    |
|                                                   |
| "Teste o metodo por 7 dias com acesso parcial     |
|  para conhecer a plataforma antes de desbloquear  |
|  tudo."                                           |
|                                                   |
| [CTA Primario - FIRE]                             |
| "Testar 7 dias gratis"                            |
| -> https://buy.stripe.com/...trial                |
|                                                   |
| [CTA Secundario - OUTLINE]                        |
| "Assinar agora"                                   |
| -> https://buy.stripe.com/...direto               |
|                                                   |
| "Acesso parcial no trial. Desbloqueio completo    |
|  apos ativacao."                                  |
+---------------------------------------------------+
```

### 3.3 Cards Trimestral / Anual

Manter CTAs existentes (chamam `createCheckout(priceId)`), atualizar textos:
- Trimestral: "Compromisso minimo para consolidar resultados."
- Anual: "Transformacao completa com melhor custo-beneficio."

---

## Parte 4: UpgradeModal Padrao

### Arquivo: `src/components/access/UpgradeModal.tsx` (reescrever)

Modal unico para todo o app:

```text
+---------------------------------------------------+
|                  [X]                              |
|        [Crown Icon]                               |
|                                                   |
|     Desbloqueie o acesso completo                 |
|                                                   |
|  Voce esta no acesso limitado. Desbloqueie o      |
|  plano completo para continuar.                   |
|                                                   |
|  [check] Todos os treinos personalizados          |
|  [check] Plano nutricional completo               |
|  [check] Biblioteca de receitas ilimitada         |
|  [check] Mindset e desenvolvimento pessoal        |
|  [check] Suporte prioritario com mentor           |
|                                                   |
|  [BTN FIRE] "Testar 7 dias gratis"               |
|  -> TRIAL link                                    |
|                                                   |
|  [BTN OUTLINE] "Assinar agora"                    |
|  -> DIRETO link                                   |
|                                                   |
|  Cancele a qualquer momento.                      |
+---------------------------------------------------+
```

Ambos os botoes abrem os links Stripe diretos em nova aba (`window.open`). Nao dependem de edge function.

---

## Parte 5: Bloqueios nas Paginas

### Logica para cada pagina

Para todas as paginas (Treino, Nutricao, Mindset, Receitas, Suporte), usar `useEntitlements`:

**Se `effectiveLevel === 'none'`:**
- Mostrar UpgradeModal imediatamente
- Bloquear todo conteudo premium

**Se `effectiveLevel === 'trial_limited'`:**
- Aplicar limites usando `trial_usage`:
  - Treino: 1 treino visivel, marcar `used_workout = true`
  - Nutricao: 1 secao amostra, marcar `used_diet = true`
  - Mindset: 1 modulo, marcar `used_mindset = true`
  - Receitas: `used_recipe_count <= 1`, incrementar apos gerar
  - Suporte: `used_support_count <= 1`
- Clicar em conteudo bloqueado abre UpgradeModal

**Se `effectiveLevel === 'full'`:**
- Liberar tudo

### Arquivos a modificar:

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Treino.tsx` | Integrar `useEntitlements` + trial_usage |
| `src/pages/Nutricao.tsx` | Integrar `useEntitlements` + trial_usage |
| `src/pages/Mindset.tsx` | Integrar `useEntitlements` + trial_usage |
| `src/pages/Receitas.tsx` | Integrar `useEntitlements` + trial_usage |
| `src/pages/Suporte.tsx` | Adicionar limite de mensagens para trial |

---

## Parte 6: Webhook Stripe (Backend)

### 6.1 `stripe-webhook/index.ts`

Atualizar a funcao `upsertSubscription` para TAMBEM sincronizar `entitlements`:

```typescript
// Apos upsert em subscriptions:
const accessLevel = 
  subscription.status === 'trialing' ? 'trial_limited' :
  subscription.status === 'active' ? 'full' : 'none';

await supabase.from('entitlements').upsert({
  user_id: userId,
  access_level: accessLevel,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' });

// Se status = trialing, criar trial_usage se nao existe
if (subscription.status === 'trialing') {
  await supabase.from('trial_usage').upsert({
    user_id: userId,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id', ignoreDuplicates: true });
}

// Se trial_end disponivel, salvar
if (subscription.trial_end) {
  await supabase.from('subscriptions').update({
    trial_end: safeTimestampToISO(subscription.trial_end)
  }).eq('user_id', userId);
}
```

Para `customer.subscription.deleted` e `invoice.payment_failed`:
```typescript
await supabase.from('entitlements').upsert({
  user_id: userId,
  access_level: 'none',
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' });
```

### 6.2 Adicionar evento `customer.subscription.created`

O webhook ja trata `checkout.session.completed` que cobre a criacao. Adicionaremos tratamento explicito para robustez.

### 6.3 `create-checkout/index.ts`

Nenhuma mudanca necessaria para os links Stripe diretos (Payment Links). Os botoes da pagina abrem URLs diretamente.

O `create-checkout` continua funcionando para os planos Trimestral/Anual que usam `createCheckout(priceId)`.

---

## Parte 7: Corrigir Elite Gratis (Migracao)

Na migracao SQL, incluir:

```sql
-- Usuarios com plan_type elite mas sem stripe_subscription_id real
-- Manter cadastro, bloquear acesso premium
INSERT INTO entitlements (user_id, access_level)
SELECT s.user_id, 'none'
FROM subscriptions s
WHERE s.plan_type IN ('elite_fundador', 'embaixador')
AND (s.stripe_subscription_id IS NULL OR s.stripe_subscription_id = '' 
     OR s.stripe_subscription_id LIKE 'invite_%')
AND s.status NOT IN ('active', 'trialing')
ON CONFLICT (user_id) DO UPDATE SET access_level = 'none';
```

---

## Parte 8: Admin - Override de Cortesia

### Modificar `AdminClienteDetalhes.tsx`

Adicionar secao para admin:
- Visualizar `entitlements.access_level` atual
- Visualizar `trial_usage`
- Botao "Aplicar Override":
  - Selecionar: `trial_limited` ou `full`
  - Definir `override_expires_at` (obrigatorio, nunca infinito)
  - Salvar no banco

As paginas `AdminCommercialPlans.tsx` e `AdminTrialCampaigns.tsx` ja existem da fase anterior.

---

## Parte 9: SubscriptionGuard

### Adaptar `SubscriptionGuard.tsx`

Adicionar verificacao de `entitlements`:

```typescript
// 1. Verificar subscription (existente)
// 2. Verificar entitlements
const { data: entitlement } = await supabase
  .from('entitlements')
  .select('access_level, override_level, override_expires_at')
  .eq('user_id', user.id)
  .single();

const effectiveLevel = getEffectiveLevel(entitlement);
if (effectiveLevel !== 'none') {
  // Permitir acesso (trial ou full)
  setLocalState({ hasSubscription: true, ... });
}
```

---

## Parte 10: Assinatura.tsx (Pagina interna)

Filtrar para mostrar apenas Elite, Trimestral e Anual (mesmo filtro da PricingSection).
Adicionar dual CTA no card Elite.

---

## Resumo de Arquivos

### Criar
| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useEntitlements.ts` | Hook central de acesso baseado em entitlements |
| Migracao SQL | Tabelas entitlements, trial_usage, campo trial_end |

### Modificar
| Arquivo | Descricao |
|---------|-----------|
| `src/components/landing/PricingSection.tsx` | 3 planos + dual CTA no Elite |
| `src/components/access/UpgradeModal.tsx` | Modal padrao com links Stripe diretos |
| `src/hooks/useModuleAccess.ts` | Integrar com entitlements como autoridade |
| `src/components/auth/SubscriptionGuard.tsx` | Verificar entitlements |
| `src/pages/Treino.tsx` | Integrar trial_usage |
| `src/pages/Nutricao.tsx` | Integrar trial_usage |
| `src/pages/Mindset.tsx` | Integrar trial_usage |
| `src/pages/Receitas.tsx` | Integrar trial_usage |
| `src/pages/Suporte.tsx` | Adicionar limite trial |
| `src/pages/Assinatura.tsx` | Filtrar planos + dual CTA |
| `supabase/functions/stripe-webhook/index.ts` | Sincronizar entitlements |
| `src/pages/admin/AdminClienteDetalhes.tsx` | Override de cortesia |

---

## Ordem de Execucao

1. Migracao SQL (entitlements + trial_usage + trial_end + dados iniciais + correcao elite gratis)
2. Criar `useEntitlements.ts`
3. Atualizar `useModuleAccess.ts` para usar entitlements
4. Reescrever `UpgradeModal.tsx` com links Stripe diretos
5. Atualizar `PricingSection.tsx` (3 planos + dual CTA)
6. Atualizar `Assinatura.tsx` (mesma logica)
7. Atualizar `SubscriptionGuard.tsx`
8. Atualizar paginas de modulos (Treino, Nutricao, Mindset, Receitas, Suporte)
9. Atualizar `stripe-webhook` para sincronizar entitlements
10. Atualizar admin para override
