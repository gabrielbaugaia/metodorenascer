

# Fase 2: Integrar Controle de Acesso nas Paginas + Navegacao Admin

## Resumo

Agora que a fundacao esta pronta (tabelas, hooks, componentes), precisamos conectar tudo nas paginas reais de Treino, Nutricao, Mindset e Receitas, alem de adicionar links de navegacao no menu admin.

---

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/Treino.tsx` | EDITAR | Adicionar controle de acesso com limites por treino |
| `src/pages/Nutricao.tsx` | EDITAR | Adicionar controle de acesso com limites por refeicao |
| `src/pages/Mindset.tsx` | EDITAR | Adicionar controle de acesso com limite de modulo |
| `src/pages/Receitas.tsx` | EDITAR | Adicionar controle de acesso com limite de receitas |
| `src/components/layout/ClientSidebar.tsx` | EDITAR | Adicionar links admin para Planos Comerciais e Campanhas Trial |
| `src/components/auth/SubscriptionGuard.tsx` | EDITAR | Permitir acesso de trial users (nao bloquear mais quem esta em trial) |
| `src/pages/admin/AdminDashboard.tsx` | EDITAR | Adicionar quick actions para Planos Comerciais e Campanhas Trial |

---

## Mudancas Detalhadas

### 1. SubscriptionGuard.tsx - Permitir Trial Users

**Problema atual:** O guard bloqueia completamente quem nao tem subscription `active/free`. Trial users com `user_module_access` nao conseguem acessar nenhuma pagina.

**Solucao:** Adicionar verificacao de `user_module_access` como terceira camada antes de bloquear:

```typescript
// Apos verificar subscription, antes de redirecionar:
// 3. Verificar se usuario tem acesso de trial em pelo menos 1 modulo
const { data: trialAccess } = await supabase
  .from("user_module_access")
  .select("id")
  .eq("user_id", user.id)
  .limit(1)
  .maybeSingle();

if (trialAccess) {
  setLocalState({ hasSubscription: true, isBlocked: false, isPendingPayment: false });
}
```

Isso permite que o usuario entre na area de cliente. O controle fino (qual modulo pode ver) fica por conta do `LockedContent` e `useModuleAccess` dentro de cada pagina.

---

### 2. Treino.tsx - Controle de Acesso por Treino

**Logica:**
- `full`: mostra todos os treinos, PDF e historico
- `limited`: mostra apenas 1 treino (o primeiro), bloqueia PDF e historico
- `none`: mostra overlay de conteudo bloqueado

**Mudancas:**
- Importar `useModuleAccess` e `LockedContent`
- Importar `TrialBanner` e `UpgradeModal`
- Envolver lista de treinos com logica de limite
- Esconder botao "Baixar PDF" se acesso limitado
- Apos o 1o treino, mostrar cards bloqueados com overlay

```typescript
// Limitar treinos visiveis
const maxVisible = access?.level === 'limited' 
  ? (access.limits.max_workouts_visible || 1) 
  : workouts.length;
const visibleWorkouts = workouts.slice(0, maxVisible);
const lockedWorkouts = workouts.slice(maxVisible);
```

Para cada treino bloqueado, exibir um card desfocado com overlay de cadeado e botao "Ver Planos".

---

### 3. Nutricao.tsx - Controle de Acesso por Refeicao

**Logica:**
- `full`: mostra todas as refeicoes e macros
- `limited`: mostra apenas 2 refeicoes, oculta macros completos e PDF
- `none`: mostra overlay de bloqueio

**Mudancas:**
- Importar `useModuleAccess`
- Limitar refeicoes visiveis: `refeicoes.slice(0, maxMealsVisible)`
- Esconder botao "Baixar PDF" se limitado
- Mostrar UpgradePrompt apos as refeicoes visiveis
- Se trial ativo, mostrar TrialBanner no topo

---

### 4. Mindset.tsx - Controle de Acesso por Modulo

**Logica:**
- `full`: mostra tudo (manha, noite, crencas, afirmacoes)
- `limited`: mostra apenas rotina da manha, bloqueia restante
- `none`: overlay de bloqueio

**Mudancas:**
- Importar `useModuleAccess`
- Se `limited`, renderizar rotina da manha normalmente
- Envolver rotina da noite, crencas, e afirmacoes com `LockedContent`
- Mostrar UpgradePrompt apos conteudo visivel

---

### 5. Receitas.tsx - Controle de Acesso com Contador

**Logica:**
- `full`: geracao ilimitada
- `limited`: maximo X receitas por dia e Y total
- `none`: overlay de bloqueio

**Mudancas:**
- Importar `useModuleAccess`
- Verificar `usage_count` contra `total_recipes_allowed`
- Antes de gerar, verificar se esta dentro do limite
- Chamar `incrementUsage()` apos gerar com sucesso
- Se limite atingido, desabilitar botao e mostrar UpgradePrompt

```typescript
const canGenerate = hasFullAccess || 
  (access?.usageCount || 0) < (access?.limits?.total_recipes_allowed || 3);
```

---

### 6. ClientSidebar.tsx - Links Admin

Adicionar 2 novos itens ao array `adminMenuItems`:

```typescript
{ title: "Planos Comerciais", url: "/admin/commercial-plans", icon: CreditCard },
{ title: "Campanhas Trial", url: "/admin/trial-campaigns", icon: Gift },
```

---

### 7. AdminDashboard.tsx - Quick Actions

Adicionar 2 novos quick actions no array existente:

```typescript
{ title: "Planos Comerciais", icon: CreditCard, url: "/admin/commercial-plans", color: "from-indigo-500 to-violet-600" },
{ title: "Campanhas Trial", icon: Gift, url: "/admin/trial-campaigns", color: "from-amber-500 to-orange-600" },
```

---

## Fluxo de Acesso do Usuario

```text
Usuario entra na pagina /treino
    |
    v
SubscriptionGuard verifica:
  - Tem subscription ativa? -> Permite
  - Tem user_module_access? -> Permite (trial)
  - Nenhum? -> Redireciona para /dashboard
    |
    v
Dentro de Treino.tsx:
  useModuleAccess('treino') retorna:
    - level: 'full' -> Mostra tudo
    - level: 'limited' -> Mostra 1 treino + bloqueados
    - level: 'none' -> Mostra overlay de bloqueio
```

---

## Componentes Reutilizados

Todos os componentes criados na Fase 1 serao reutilizados:
- `LockedContent` para envolver conteudo bloqueado
- `UpgradeModal` para exibir planos ao clicar em bloqueado
- `TrialBanner` no topo das paginas para trial users
- `FullAccessOnly` para esconder botoes de PDF/download

---

## Resumo de Entregas

1. SubscriptionGuard adaptado para trial users
2. Treino com limite de 1 treino visivel no trial
3. Nutricao com limite de 2 refeicoes visiveis no trial
4. Mindset com limite de 1 modulo visivel no trial
5. Receitas com contador de uso no trial
6. Menu admin com links para Planos Comerciais e Campanhas Trial
7. Dashboard admin com quick actions para as novas paginas

