
# Plano: Corrigir Perda de Foco ao Digitar nos Campos de Exercício

## Problema Identificado

Ao digitar uma letra nos campos de exercício (nome, séries, repetições, etc.), o input **perde o foco** e a tela **sobe sozinha**. Isso acontece porque:

1. O componente `ExerciseCard` está **definido dentro** do `ProtocolEditor`
2. A cada digitação, o estado `content` é atualizado
3. O React re-renderiza e recria `ExerciseCard` como um **novo componente**
4. O input é desmontado e remontado, perdendo o foco

---

## Solução

**Mover o componente `ExerciseCard` para FORA da função principal**, definindo-o antes do `ProtocolEditor`. Isso garante que o React mantenha a mesma referência do componente entre renders.

---

## Alterações Necessárias

### Arquivo: `src/components/admin/ProtocolEditor.tsx`

#### 1. Mover `ExerciseCard` para fora do componente principal

**DE** (linhas 275-428 - dentro de `ProtocolEditor`):
```typescript
export function ProtocolEditor(...) {
  // ...estados...

  // Componente de exercício reutilizável
  const ExerciseCard = ({ ... }) => (
    <div>...</div>
  );

  return (...);
}
```

**PARA** (antes de `ProtocolEditor`):
```typescript
// Componente de exercício reutilizável - FORA do componente principal
interface ExerciseCardProps {
  exercise: Exercise;
  exerciseIndex: number;
  onUpdate: (field: keyof Exercise, value: any) => void;
  onRemove: () => void;
  onOpenGifPicker: () => void;
  onPreviewGif: (url: string | null) => void;
  isGifUrl: (url: string) => boolean;
}

const ExerciseCard = ({ 
  exercise, 
  exerciseIndex, 
  onUpdate, 
  onRemove, 
  onOpenGifPicker,
  onPreviewGif,
  isGifUrl
}: ExerciseCardProps) => (
  <div className="bg-background rounded-lg p-4 space-y-3">
    {/* ... mesmo conteúdo ... */}
  </div>
);

export function ProtocolEditor(...) {
  // ...
}
```

#### 2. Atualizar chamadas do `ExerciseCard`

Passar as funções auxiliares como props:
```typescript
<ExerciseCard
  key={`exercise-${treinoIndex}-${exerciseIndex}`}
  exercise={exercise}
  exerciseIndex={exerciseIndex}
  onUpdate={(field, value) => updateExerciseNew(treinoIndex, exerciseIndex, field, value)}
  onRemove={() => removeExerciseNew(treinoIndex, exerciseIndex)}
  onOpenGifPicker={() => openGifPickerNew(treinoIndex, exerciseIndex)}
  onPreviewGif={setPreviewGif}
  isGifUrl={isGifUrl}
/>
```

#### 3. Adicionar key única estável

Usar uma key mais descritiva para garantir que o React identifique corretamente cada exercício:
```typescript
// Formato novo
key={`exercise-${treinoIndex}-${exerciseIndex}`}

// Formato legado
key={`exercise-${weekIndex}-${dayIndex}-${exerciseIndex}`}
```

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/admin/ProtocolEditor.tsx` | Refatoração | Mover `ExerciseCard` para fora do componente principal |

---

## Detalhes Técnicos

### Por que isso funciona

Quando um componente é definido **dentro** de outro componente:
```typescript
function Parent() {
  const Child = () => <div>...</div>; // Nova referência a cada render!
  return <Child />;
}
```

O React trata cada render como um **componente diferente**, desmontando e remontando o DOM.

Quando definido **fora**:
```typescript
const Child = () => <div>...</div>; // Mesma referência sempre!

function Parent() {
  return <Child />;
}
```

O React reconhece como o **mesmo componente** e apenas atualiza as props, mantendo foco e scroll.

---

## Resultado Esperado

Após a correção:
- Digitar nos campos de exercício mantém o foco
- A tela não sobe sozinha durante a edição
- Navegação entre campos funciona normalmente (Tab)
- Performance melhorada (menos remounts)
