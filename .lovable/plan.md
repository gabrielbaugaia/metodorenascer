

# Plano de Correção: Página de Treino Não Abrindo no Domínio Customizado

## Diagnóstico

Analisei os erros do console na página `/treino` do domínio `metodo.renascerapp.com.br`:

### Erros Identificados

1. **Erro 406 (Not Acceptable)** - Uma requisição ao Supabase está retornando status 406
2. **TypeError: Cannot read properties of undefined (reading 'filter')** - Ocorrendo múltiplas vezes em código minificado

### Causa Raiz

O problema está no hook `useWorkoutTracking.ts`. Quando o `completions` retorna `undefined` (antes do fetch completar ou em caso de erro), os métodos `getWeeklyCount()` e `getMonthlyCount()` tentam chamar `.filter()` em `undefined`.

Locais específicos do problema:
- **Linha 276**: `completions.filter((c) => ...)` - sem verificação de null/undefined
- **Linha 283**: `completions.filter((c) => ...)` - sem verificação de null/undefined

O componente `Treino.tsx` chama `getWeeklyCount()` na linha 166, que dispara o erro quando `completions` ainda está carregando.

---

## Plano de Implementação

### Etapa 1: Corrigir `useWorkoutTracking.ts`

Adicionar verificações defensivas para evitar `.filter()` em `undefined`:

```typescript
// Linha 272-277: getWeeklyCount
const getWeeklyCount = () => {
  if (!completions || !Array.isArray(completions)) return 0;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return completions.filter((c) => new Date(c.workout_date) >= oneWeekAgo).length;
};

// Linha 279-284: getMonthlyCount  
const getMonthlyCount = () => {
  if (!completions || !Array.isArray(completions)) return 0;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return completions.filter((c) => new Date(c.workout_date) >= oneMonthAgo).length;
};

// Linha 286: getTotalCount
const getTotalCount = () => completions?.length ?? 0;

// Linha 288-290: getTotalCalories
const getTotalCalories = () => {
  if (!completions || !Array.isArray(completions)) return 0;
  return completions.reduce((acc, c) => acc + (c.calories_burned || 0), 0);
};

// Linha 293: getCurrentStreak
const getCurrentStreak = useCallback(() => {
  if (!completions || completions.length === 0) return 0;
  // ... resto do código
}, [completions]);
```

### Etapa 2: Melhorar Tratamento de Erro no `fetchCompletions`

Garantir que `completions` sempre seja um array válido, mesmo em caso de erro:

```typescript
const fetchCompletions = useCallback(async () => {
  if (!user) {
    setCompletions([]);  // Sempre array vazio, nunca undefined
    setLoading(false);
    return;
  }
  // ... resto do código
}, [user]);
```

### Etapa 3: Adicionar Verificação Defensiva em `Treino.tsx`

Garantir que o componente não tente renderizar dados enquanto ainda está carregando:

```typescript
// Já existe verificação de loading, mas podemos melhorar
const weeklyCount = loading ? 0 : getWeeklyCount();
const totalCount = loading ? 0 : getTotalCount();
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useWorkoutTracking.ts` | Adicionar verificações `Array.isArray()` e `?.` em todos os métodos que usam `completions` |
| `src/pages/Treino.tsx` | Verificação adicional de loading antes de chamar funções do hook |

---

## Benefícios

1. **Elimina crash da página** - A página não vai mais quebrar com erro de "filter undefined"
2. **Experiência de usuário suave** - Mostra 0 enquanto carrega, depois atualiza com dados reais
3. **Compatibilidade** - Funciona em todos os domínios (lovable.app e customizados)
4. **Robustez** - Segue o padrão de programação defensiva já estabelecido no projeto

