

# Área de Preferências de Treino — Pergunta aberta para personalização pela IA

## Resumo

Adicionar um novo campo `preferencias_treino` na anamnese com perguntas orientadoras para que o aluno descreva seus desejos e prioridades de treino. A IA usará essa resposta junto com os dados da anamnese para gerar prescrições mais personalizadas.

## Implementação

### 1. Novo campo no banco de dados (migration)

Adicionar coluna `preferencias_treino TEXT` na tabela `profiles`.

### 2. Novo componente: `TrainingPreferencesSection.tsx`

Card com título "Seus Desejos para o Treino" e um Textarea com placeholder orientador:

> "Conte-nos sobre suas preferências de treino. Por exemplo: Quer dar mais ênfase em glúteos e pernas? Prefere não treinar muito braço? Gosta de treinos mais curtos e intensos ou mais longos e leves? Tem algum exercício favorito ou que não gosta? Quer focar em força, resistência ou estética? Descreva livremente o que espera do seu programa."

O campo é opcional mas com uma nota incentivando: "Quanto mais detalhes, mais personalizado será seu treino."

### 3. Integração na Anamnese (`Anamnese.tsx`)

- Adicionar `preferencias_treino` ao `FormData` e `initialFormData`
- Renderizar o novo componente entre Objetivos e Histórico de Treino
- Salvar no `profiles` junto com os demais campos
- Incluir no `userContext` passado para geração de protocolos

### 4. Prompt de treino (`prompts/treino.ts`)

Adicionar ao `getTreinoUserPrompt` uma seção dedicada:

```
### PREFERÊNCIAS PESSOAIS DO ALUNO ###
${userContext.preferencias_treino || "Nenhuma preferência específica informada."}

IMPORTANTE: Respeite as preferências descritas acima ao montar o protocolo. 
Se o aluno pediu ênfase em algum grupo muscular, aumente o volume desse grupo. 
Se pediu para não treinar muito algo, reduza o volume mas mantenha o mínimo funcional.
```

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| Nova migration SQL | Adicionar coluna `preferencias_treino` em `profiles` |
| `src/components/anamnese/TrainingPreferencesSection.tsx` | Novo componente com textarea orientado |
| `src/pages/Anamnese.tsx` | Integrar novo campo no form e no userContext |
| `supabase/functions/generate-protocol/prompts/treino.ts` | Incluir preferências no prompt da IA |

