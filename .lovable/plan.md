

# Plano: Resetar formulário após salvar dados

## Problema
Após salvar os dados do dia, o formulário mantém os valores preenchidos (prints, campos de fitness, etc.) em vez de limpar tudo para uma nova entrada.

## Solução
Adicionar uma função `resetForm()` no `ManualInput.tsx` que zera todos os estados do formulário, chamada no `onSuccess` da mutation.

## Alteração única em `src/components/renascer/ManualInput.tsx`

No `onSuccess` da `saveMutation` (linha ~290), após invalidar queries e mostrar toast, resetar:

- `screenshotFiles` → `[]`
- `screenshotPreviews` → `[]`
- Todos os campos fitness (`steps`, `activeCals`, `exerciseMins`, `standingHrs`, `distanceKm`, `restingHr`, `hrvMs`, `avgHrBpm`, `sleepingHr`, `sleepingHrv`, `minHr`, `maxHr`, `sedentaryHr`) → `""`
- `multiDayPending` → `[]`
- `fitnessOpen` → `false`
- `sleep` → `7.5`, `stress` → `30`, `energy` → `3`, `trained` → `false`, `rpe` → `7`
- `dateOption` → `"today"`

## Arquivo modificado
- `src/components/renascer/ManualInput.tsx`

