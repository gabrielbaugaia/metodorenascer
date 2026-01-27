
# Plano de Correção: Protocolo de Treino Não Reconhecido

## Diagnóstico

### Problema Identificado
O erro **"Estrutura do protocolo não reconhecida"** ocorre porque existe incompatibilidade entre:

1. **Formato Novo (gerado atualmente)**: Usa estrutura com `treinos` e `letra` (A, B, C, D)
   ```json
   {
     "titulo": "Protocolo de Treino",
     "treinos": [
       { "letra": "A", "foco": "Peito e Tríceps", "exercicios": [...] }
     ]
   }
   ```

2. **Formato Legado (esperado pelo editor)**: Usa estrutura com `semanas` e `dias`
   ```json
   {
     "semanas": [
       { "dias": [{ "dia": "Segunda", "exercicios": [...] }] }
     ]
   }
   ```

### Arquivos Afetados
- **Página do Cliente (`Treino.tsx`)**: ✅ Já suporta ambos os formatos
- **Editor do Admin (`ProtocolEditor.tsx`)**: ❌ Só suporta formato legado

---

## Solução

Atualizar o `ProtocolEditor.tsx` para suportar ambos os formatos, similar ao que já foi feito no `Treino.tsx`.

### Modificações Necessárias

**Arquivo**: `src/components/admin/ProtocolEditor.tsx`

#### 1. Atualizar interfaces para suportar formato novo

Adicionar interface para o novo formato:
```typescript
interface TrainingLetter {
  letra: string;
  foco: string;
  duracao_minutos?: number;
  exercicios: Exercise[];
}

interface TrainingContentNew {
  nivel: string;
  titulo: string;
  treinos: TrainingLetter[];
}

interface TrainingContentLegacy {
  nivel: string;
  titulo: string;
  semanas: TrainingWeek[];
}

type TrainingContent = TrainingContentNew | TrainingContentLegacy;
```

#### 2. Modificar a verificação de estrutura válida

Trocar (linha 165):
```typescript
// DE:
if (!content?.semanas) {
  return <div>Estrutura do protocolo não reconhecida</div>;
}

// PARA:
const hasNewFormat = Array.isArray((content as any)?.treinos);
const hasLegacyFormat = Array.isArray((content as any)?.semanas);

if (!hasNewFormat && !hasLegacyFormat) {
  return <div>Estrutura do protocolo não reconhecida</div>;
}
```

#### 3. Criar funções de atualização para ambos formatos

Para o novo formato (`treinos`):
```typescript
const updateExerciseNew = (treinoIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
  const newContent = { ...content } as TrainingContentNew;
  if (newContent.treinos?.[treinoIndex]?.exercicios?.[exerciseIndex]) {
    newContent.treinos[treinoIndex].exercicios[exerciseIndex] = {
      ...newContent.treinos[treinoIndex].exercicios[exerciseIndex],
      [field]: value
    };
    setContent(newContent);
  }
};
```

#### 4. Renderizar o formato correto baseado na estrutura

```typescript
{hasNewFormat ? (
  // Renderiza formato novo: Treino A, B, C, D
  <Accordion type="multiple">
    {(content as TrainingContentNew).treinos.map((treino, treinoIndex) => (
      <AccordionItem key={treinoIndex} value={`treino-${treinoIndex}`}>
        <AccordionTrigger>
          Treino {treino.letra} - {treino.foco}
        </AccordionTrigger>
        <AccordionContent>
          {treino.exercicios?.map((exercise, exerciseIndex) => (
            // Campos de edição do exercício
          ))}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
) : (
  // Renderiza formato legado: Semanas > Dias
  <Accordion type="multiple">
    {(content as TrainingContentLegacy).semanas.map((week, weekIndex) => (
      // Código atual permanece
    ))}
  </Accordion>
)}
```

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/admin/ProtocolEditor.tsx` | Modificação | Adicionar suporte ao formato novo com `treinos` + `letra` |

---

## Detalhes Técnicos

### Funções a Atualizar

1. **`updateExercise`**: Precisa detectar o formato e atualizar o caminho correto
2. **`addExercise`**: Precisa funcionar para ambos formatos
3. **`removeExercise`**: Precisa funcionar para ambos formatos
4. **`openGifPicker`**: Precisa passar índices corretos para cada formato

### Lógica de Detecção de Formato

```typescript
const isNewFormat = (content: any): content is TrainingContentNew => {
  return Array.isArray(content?.treinos) && content.treinos.length > 0;
};

const isLegacyFormat = (content: any): content is TrainingContentLegacy => {
  return Array.isArray(content?.semanas) && content.semanas.length > 0;
};
```

---

## Resultado Esperado

Após a correção:
- ✅ Admin poderá visualizar e editar protocolos no formato novo (`treinos`)
- ✅ Protocolos legados continuarão funcionando (`semanas`)
- ✅ Cliente continuará vendo o treino normalmente (já funciona)
- ✅ Botões de adicionar/remover exercício funcionarão em ambos formatos
- ✅ Busca e vinculação de GIFs funcionará em ambos formatos
