

# Filtros de Engajamento + Bloqueio Automatico de Plano Gratuito (30 dias)

## Resumo

Adicionar novos filtros na aba de Clientes do admin para identificar rapidamente clientes inativos, sem protocolos gerados e que nunca acessaram. Tambem implementar a regra de negocio: clientes do plano gratuito que completam 30 dias sao automaticamente bloqueados e redirecionados para assinar, sem direito ao trial de 7 dias.

---

## Parte 1: Novos Filtros no AdminClientes

### 1.1 Dados adicionais no fetch

O `fetchClients` atual busca `profiles` e `subscriptions`. Precisamos adicionar:
- `user_activity.last_access` para cada cliente
- Contagem de `protocolos` por tipo (treino, nutricao, mindset)

Isso sera feito em batch (nao N+1) usando queries paralelas:

```text
1. Fetch todos user_activity (admin tem RLS ALL)
2. Fetch contagem de protocolos agrupado por user_id e tipo (admin tem RLS ALL)
3. Merge no array de clients
```

### 1.2 Novo filtro: "Engajamento"

Adicionar um novo Select no painel de Filtros Avancados com as opcoes:

| Valor | Label | Logica |
|-------|-------|--------|
| `all` | Todos | Sem filtro |
| `never_accessed` | Nunca acessou | `last_access` e null ou nao existe em user_activity |
| `no_protocols` | Sem protocolos gerados | Nenhum protocolo de treino, nutricao ou mindset |
| `inactive_7d` | Inativo +7 dias | `last_access` anterior a 7 dias atras |
| `inactive_14d` | Inativo +14 dias | `last_access` anterior a 14 dias atras |
| `inactive_30d` | Inativo +30 dias | `last_access` anterior a 30 dias atras |
| `free_expired_30d` | Gratuito expirado (30d+) | Plano gratuito com `created_at` da subscription ha mais de 30 dias |

### 1.3 Interface do filtro

O novo select sera posicionado na grid de filtros avancados existente (linha 339), adicionando mais uma coluna:

```text
Tipo de Plano | Sexo | Objetivo | Engajamento
Cadastro - De | Cadastro - Ate | Termino Plano - De
```

### 1.4 Dados no Client interface

Estender a interface `Client` com:
```typescript
interface Client {
  // ... existentes
  lastAccess: string | null;        // de user_activity
  protocolCount: {
    treino: number;
    nutricao: number;
    mindset: number;
  };
}
```

### 1.5 Coluna "Ultimo Acesso" na tabela

Adicionar uma nova coluna visivel na tabela desktop (hidden em mobile) mostrando a data do ultimo acesso. Se nunca acessou, mostrar badge vermelha "Nunca acessou".

---

## Parte 2: Bloqueio Automatico do Plano Gratuito apos 30 dias

### 2.1 Atualizar `check-free-expiration/index.ts`

A funcao atual ja verifica subscriptions com `status = 'free'` e `invitation_expires_at < now()`. O comportamento sera expandido:

**Regra nova:** Alem de verificar `invitation_expires_at`, adicionar uma verificacao separada para subscriptions gratuitas com mais de 30 dias de existencia (`created_at + 30 days < now()`), independente do `invitation_expires_at`.

Para esses usuarios:
1. Marcar `access_blocked = true` na subscription
2. Atualizar `blocked_reason = "Plano gratuito expirado apos 30 dias. Assine para continuar."`
3. Atualizar `entitlements.access_level = 'none'` (sem override)
4. Atualizar `profiles.client_status = 'blocked'`
5. **Nao conceder trial de 7 dias** -- o entitlement vai direto para `'none'`, forcando assinatura direta

### 2.2 Pagina de bloqueio (AcessoBloqueado.tsx)

A pagina `AcessoBloqueado.tsx` ja existe. Ela recebera uma variacao de mensagem quando o motivo for "plano gratuito expirado":
- Mensagem: "Seu periodo gratuito de 30 dias expirou. Para continuar acessando o Metodo Renascer, escolha um plano."
- Mostrar apenas os botoes de assinatura direta (sem opcao de trial)
- Usar os links Stripe diretos ja configurados

### 2.3 Logica no SubscriptionGuard

O `SubscriptionGuard` ja verifica `access_blocked`. Quando detectar que o motivo e "plano gratuito expirado", redirecionar para `/acesso-bloqueado` com um parametro indicando que nao tem direito a trial.

---

## Parte 3: Indicador visual na lista

Na tabela de clientes, alem do filtro, adicionar indicadores visuais:

- **Badge vermelha "Nunca acessou"** ao lado do nome quando `lastAccess` e null
- **Badge amarela "Sem protocolos"** quando nenhum protocolo foi gerado
- **Badge cinza "Inativo Xd"** calculada dinamicamente a partir de `lastAccess`
- **Badge vermelha "Gratuito expirado"** quando plano gratuito tem mais de 30 dias

Esses badges aparecem apenas no layout desktop (na coluna de Status ou como badges adicionais).

---

## Resumo Tecnico de Arquivos

### Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/AdminClientes.tsx` | Novo filtro de engajamento, fetch de user_activity e protocolos, coluna ultimo acesso, badges visuais |
| `supabase/functions/check-free-expiration/index.ts` | Nova regra de bloqueio apos 30 dias para planos gratuitos + sincronizar entitlements |
| `src/pages/AcessoBloqueado.tsx` | Mensagem diferenciada para plano gratuito expirado sem opcao de trial |
| `src/components/auth/SubscriptionGuard.tsx` | Passar motivo de bloqueio para AcessoBloqueado |

### Nenhum arquivo novo necessario

---

## Ordem de Execucao

1. Atualizar `AdminClientes.tsx` com novos dados (user_activity, protocolos), filtro de engajamento e badges visuais
2. Atualizar `check-free-expiration/index.ts` com regra de 30 dias + sync entitlements
3. Atualizar `AcessoBloqueado.tsx` com mensagem diferenciada
4. Atualizar `SubscriptionGuard.tsx` para passar motivo de bloqueio

