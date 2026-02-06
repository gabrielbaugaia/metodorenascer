

# Integracao Completa: useEntitlements nas Paginas + Admin Override

## Resumo

Integrar o hook `useEntitlements` (ja criado) nas 5 paginas de modulos (Treino, Nutricao, Mindset, Receitas, Suporte), substituindo a dependencia de `useModuleAccess` pelo sistema centralizado de entitlements + trial_usage. Tambem adicionar a secao de override de cortesia no AdminClienteDetalhes.

---

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/Treino.tsx` | EDITAR | Substituir `useModuleAccess` por `useEntitlements` + trial_usage |
| `src/pages/Nutricao.tsx` | EDITAR | Substituir `useModuleAccess` por `useEntitlements` + trial_usage |
| `src/pages/Mindset.tsx` | EDITAR | Substituir `useModuleAccess` por `useEntitlements` + trial_usage |
| `src/pages/Receitas.tsx` | EDITAR | Substituir `useModuleAccess` por `useEntitlements` + trial_usage |
| `src/pages/Suporte.tsx` | EDITAR | Adicionar limite de mensagens trial |
| `src/pages/admin/AdminClienteDetalhes.tsx` | EDITAR | Adicionar secao de entitlements + override |
| `src/components/access/TrialBadge.tsx` | EDITAR | Adaptar TrialBanner para aceitar `isTrialing` do useEntitlements |

---

## Mudancas Detalhadas

### 1. Treino.tsx

**Antes:** Usa `useModuleAccess('treino')` para determinar `hasFullAccess`, `hasAnyAccess`, `isTrialing`, etc.

**Depois:** Usa `useEntitlements()` como fonte primaria.

- Importar `useEntitlements` em vez de `useModuleAccess`
- Derivar acesso:
  - `isFull` -> mostra tudo, PDF habilitado
  - `isTrialing` -> mostra 1 treino, marca `used_workout = true` via `markUsed('used_workout')` ao abrir a pagina
  - `isBlocked` -> abre UpgradeModal automaticamente
- Remover imports de `LockedContent` (nao mais necessario com logica inline)
- Manter cards bloqueados (blur + cadeado) para treinos alem do limite
- `trialDaysLeft` nao vem mais do hook (o TrialBanner sera simplificado)

Logica de limite:
```
const maxVisible = isTrialing ? 1 : workouts.length;
// Ao renderizar, marcar used_workout
useEffect(() => {
  if (isTrialing && !trialUsage.used_workout && workouts.length > 0) {
    markUsed('used_workout');
  }
}, [isTrialing, workouts]);
```

### 2. Nutricao.tsx

**Antes:** Usa `useModuleAccess('nutricao')` com `access.limits.max_meals_visible`.

**Depois:** Usa `useEntitlements()`.

- `isFull` -> mostra todas refeicoes, macros, PDF
- `isTrialing` -> mostra 2 refeicoes, oculta macros e PDF, marca `used_diet = true`
- `isBlocked` -> UpgradeModal
- Manter cards de refeicao bloqueados (blur) para refeicoes alem do limite

Logica:
```
const maxMealsVisible = isTrialing ? 2 : refeicoes.length;
useEffect(() => {
  if (isTrialing && !trialUsage.used_diet && refeicoes.length > 0) {
    markUsed('used_diet');
  }
}, [isTrialing, refeicoes]);
```

### 3. Mindset.tsx

**Antes:** Usa `useModuleAccess('mindset')` com `hasFullAccess` para mostrar/ocultar secoes.

**Depois:** Usa `useEntitlements()`.

- `isFull` -> mostra tudo (manha, noite, crencas, afirmacoes)
- `isTrialing` -> mostra apenas rotina da manha + mentalidade necessaria. Bloqueio em noite/crencas/afirmacoes. Marca `used_mindset = true`
- `isBlocked` -> UpgradeModal
- Substituir `LockedContent` por cards bloqueados inline (mesma UX de Treino/Nutricao)

### 4. Receitas.tsx

**Antes:** Usa `useModuleAccess('receitas')` com `incrementUsage()` e `access.limits.total_recipes_allowed`.

**Depois:** Usa `useEntitlements()`.

- `isFull` -> geracao ilimitada
- `isTrialing` -> `trialUsage.used_recipe_count <= 1` (maximo 1 receita). Apos gerar, chama `markUsed('used_recipe_count', true)`
- `isBlocked` -> UpgradeModal
- Botao de gerar desabilitado quando limite atingido + texto "Limite atingido"

Logica:
```
const canGenerate = isFull || trialUsage.used_recipe_count < 1;
// Apos gerar com sucesso:
if (isTrialing) await markUsed('used_recipe_count', true);
```

### 5. Suporte.tsx

**Antes:** Sem controle de acesso por entitlements.

**Depois:** Adicionar `useEntitlements()`.

- `isFull` -> chat sem restricoes
- `isTrialing` -> permite enviar mensagem apenas se `trialUsage.used_support_count < 1`. Apos enviar primeira mensagem, chama `markUsed('used_support_count', true)`. Se limite atingido, desabilita input e mostra UpgradeModal
- `isBlocked` -> mostra FAQ normalmente, mas chat bloqueado com UpgradeModal

Logica no `sendMessage`:
```
if (isTrialing && trialUsage.used_support_count >= 1) {
  setShowUpgradeModal(true);
  return;
}
// Apos enviar com sucesso:
if (isTrialing) await markUsed('used_support_count', true);
```

### 6. TrialBadge.tsx (TrialBanner)

Simplificar o `TrialBanner` para nao depender de `trialDaysLeft` do useModuleAccess (que nao existe mais nesse contexto). Em vez disso:

- Aceitar prop `isTrialing: boolean` (obrigatorio)
- Remover `trialDaysLeft` como prop obrigatorio (tornando opcional)
- Se `trialDaysLeft` nao fornecido, mostrar mensagem generica "Voce esta no periodo de teste"

### 7. AdminClienteDetalhes.tsx

Adicionar nova secao "Controle de Acesso" no painel de acoes administrativas (antes da zona de perigo).

Nova secao inclui:
- **Visualizacao do entitlement atual**: badge com `access_level` e `effective_level`
- **Visualizacao de trial_usage**: tabela simples mostrando used_workout, used_diet, etc.
- **Botao "Aplicar Override de Cortesia"**: abre Dialog com:
  - Select: nivel (`trial_limited` ou `full`)
  - Input date: `override_expires_at` (obrigatorio, minimo = amanha)
  - Botao salvar que faz upsert na tabela `entitlements`
- **Botao "Remover Override"**: limpa override_level e override_expires_at

Novos estados:
```
const [entitlement, setEntitlement] = useState(null);
const [trialUsageData, setTrialUsageData] = useState(null);
const [overrideOpen, setOverrideOpen] = useState(false);
const [overrideLevel, setOverrideLevel] = useState('trial_limited');
const [overrideExpires, setOverrideExpires] = useState('');
const [savingOverride, setSavingOverride] = useState(false);
```

Fetch no useEffect existente:
```
// Fetch entitlement
const { data: entData } = await supabase
  .from('entitlements')
  .select('*')
  .eq('user_id', id)
  .maybeSingle();
setEntitlement(entData);

// Fetch trial usage
const { data: usageData } = await supabase
  .from('trial_usage')
  .select('*')
  .eq('user_id', id)
  .maybeSingle();
setTrialUsageData(usageData);
```

---

## Padrao de Migracao por Pagina

Cada pagina segue o mesmo padrao:

1. Remover `import { useModuleAccess }` e `import { LockedContent }`
2. Adicionar `import { useEntitlements } from '@/hooks/useEntitlements'`
3. Manter `import { UpgradeModal }` (ja usa o novo com links Stripe)
4. No componente:
   ```typescript
   const { isFull, isTrialing, isBlocked, trialUsage, markUsed, loading: entLoading } = useEntitlements();
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
   ```
5. Substituir condicoes `hasFullAccess` por `isFull`
6. Substituir `hasAnyAccess` por `!isBlocked`
7. Adicionar `useEffect` para auto-open UpgradeModal se `isBlocked`
8. Adicionar marcacao de uso via `markUsed()`

---

## Fluxo de Acesso Resultante

```text
Usuario abre /treino
  |
  v
SubscriptionGuard verifica entitlements:
  - effectiveLevel != 'none' -> permite entrada
  - effectiveLevel == 'none' -> redireciona /dashboard
  |
  v
Treino.tsx usa useEntitlements():
  - isFull -> mostra tudo
  - isTrialing -> mostra 1 treino, marca used_workout
  - isBlocked -> UpgradeModal auto-open
```

---

## Resumo de Entregas

1. Treino com limite de 1 treino e marcacao `used_workout`
2. Nutricao com limite de 2 refeicoes e marcacao `used_diet`
3. Mindset com limite de 1 modulo (manha) e marcacao `used_mindset`
4. Receitas com limite de 1 geracao e contador `used_recipe_count`
5. Suporte com limite de 1 mensagem e contador `used_support_count`
6. TrialBanner simplificado para funcionar sem trialDaysLeft
7. Admin com visualizacao de entitlements + override com validade
8. UpgradeModal (ja pronto) acionado em todos os bloqueios

