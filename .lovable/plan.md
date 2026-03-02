
# Permitir Finalizar Treino Sem Anotar Séries

## Problema
Atualmente, o botão "Concluir Treino" só fica habilitado quando **todas** as séries de **todos** os exercícios foram registradas (`allSetsCompleted`). Se o cliente não anotou nada, o botão fica desabilitado com opacidade reduzida.

## Solução
Remover a restrição de `allSetsCompleted` do `canCompleteWorkout`, permitindo finalizar a qualquer momento (exceto durante o descanso ativo).

### Mudanças

**`src/hooks/useWorkoutSession.ts` (linha 400)**
- De: `const canCompleteWorkout = allSetsCompleted && !restTimer.active;`
- Para: `const canCompleteWorkout = !restTimer.active;`

**`src/components/treino/WorkoutSessionManager.tsx` (linhas 231-234)**
- Remover a classe `opacity-50` condicional baseada em `canCompleteWorkout` (o botão já respeita `disabled`)
- Manter o `disabled` apenas para `session.saving`

Duas linhas de código alteradas em dois arquivos. Sem mudanças no banco de dados.
