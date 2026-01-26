
# Plano de Correção: Tela Preta na Página de Treino

## Problema Identificado

A página de Treino está apresentando "tela preta" para o usuário `bau@gabrielbau.com.br` devido a um erro JavaScript:

```
TypeError: Cannot read properties of undefined (reading 'filter')
```

O erro ocorre quando componentes tentam chamar `.filter()` ou `.map()` em arrays que podem estar `undefined`.

---

## Causa Raiz

Existem **3 pontos de vulnerabilidade** no código que não protegem contra valores nulos/undefined:

### 1. WorkoutCard.tsx (Linha 57-58)
```javascript
const completedCount = exercises.filter((e) => e.completed).length;
const progressPercent = (completedCount / exercises.length) * 100;
```
- Se `exercises` for `undefined`, o `.filter()` falha imediatamente

### 2. ExerciseTable.tsx (Linha 32)
```javascript
{exercises.map((exercise, index) => (
```
- O `.map()` também falhará se `exercises` for `undefined`

### 3. Inconsistências nos dados do protocolo
- Mesmo que o `Treino.tsx` tenha proteções, se os dados JSON no banco tiverem estrutura inesperada, os exercícios podem chegar como `undefined` nos componentes filhos

---

## Solução Proposta

### Arquivo 1: `src/components/treino/WorkoutCard.tsx`

Adicionar proteção null-safe:

```javascript
// ANTES (linha 57-58):
const completedCount = exercises.filter((e) => e.completed).length;
const progressPercent = (completedCount / exercises.length) * 100;

// DEPOIS:
const safeExercises = exercises || [];
const completedCount = safeExercises.filter((e) => e.completed).length;
const progressPercent = safeExercises.length > 0 
  ? (completedCount / safeExercises.length) * 100 
  : 0;
```

### Arquivo 2: `src/components/treino/ExerciseTable.tsx`

Adicionar verificação antes do map:

```javascript
// ANTES (linha 32):
{exercises.map((exercise, index) => (

// DEPOIS (adicionar verificação e fallback):
const safeExercises = exercises || [];

// E mostrar mensagem se vazio:
{safeExercises.length === 0 ? (
  <p className="text-muted-foreground text-sm py-4 text-center">
    Nenhum exercício disponível
  </p>
) : (
  safeExercises.map((exercise, index) => (
    // ... resto do código
  ))
)}
```

### Arquivo 3: `src/pages/Treino.tsx`

Reforçar a proteção no useMemo para garantir que exercises nunca seja undefined:

```javascript
// Na linha 120, garantir fallback robusto:
exercises: Array.isArray(treino.exercicios) 
  ? treino.exercicios.map(...) 
  : [],
```

---

## Resumo das Alterações

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| WorkoutCard.tsx | 57-58 | Adicionar `safeExercises = exercises \|\| []` e proteção contra divisão por zero |
| ExerciseTable.tsx | 19, 32 | Criar `safeExercises` e adicionar fallback visual para lista vazia |
| Treino.tsx | 120, 150 | Usar `Array.isArray()` antes do map para garantir tipo correto |

---

## Resultado Esperado

Após essas correções:
1. A página de Treino carregará corretamente mesmo quando os dados estiverem incompletos
2. Se não houver exercícios, será exibida uma mensagem amigável ao invés de crash
3. O usuário `bau@gabrielbau.com.br` poderá acessar sua página de treino normalmente

---

## Detalhes Técnicos

As correções seguem o padrão de **defensive programming**:
- Sempre assume que dados externos podem estar malformados
- Usa operador de coalescência nula (`||`) para fallbacks
- Verifica o tipo do array antes de iterar (`Array.isArray()`)
- Protege contra divisão por zero no cálculo de progresso
