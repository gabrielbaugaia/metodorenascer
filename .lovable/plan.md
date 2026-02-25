
# Lembrete de Anamnese Pendente no Dashboard

## Problema

A logica atual do Dashboard tenta redirecionar para `/anamnese` quando detecta que a anamnese nao esta completa (linha 239). Porem, isso depende de uma cadeia de condicoes (`subscribed`, timing de loading, etc.) que pode falhar silenciosamente. Quando isso acontece, a cliente (como a Laiza) fica no Dashboard sem nenhuma indicacao visual de que precisa preencher a anamnese.

## Solucao

Adicionar um **estado local `anamneseIncomplete`** no Dashboard e exibir um **card de alerta proeminente** quando a anamnese nao estiver completa. Isso funciona como rede de seguranca: mesmo que o redirect falhe, o lembrete visual aparece.

## Mudancas

### `src/pages/Dashboard.tsx`

1. Adicionar estado `const [anamneseIncomplete, setAnamneseIncomplete] = useState(false)`

2. No `useEffect` de checagem de anamnese (linha 226), alem do redirect, setar `setAnamneseIncomplete(true)` quando `!anamneseComplete`

3. Renderizar um card de alerta **antes** da secao de status executivo (ScoreRing), visivel apenas quando `anamneseIncomplete === true`:
   - Fundo com borda amarela/primaria
   - Icone de alerta (AlertTriangle, ja importado)
   - Titulo: "Anamnese Pendente"
   - Texto: "Preencha sua anamnese para que possamos gerar seus protocolos de treino, dieta e mentalidade personalizados."
   - Botao CTA: "Preencher Anamnese Agora" que navega para `/anamnese`

4. O card aparece para qualquer usuario com `anamneseIncomplete === true`, independente de estar subscribed ou nao — se nao estiver subscribed, a tela de planos ja aparece antes. Entao o card so sera visivel para quem tem assinatura mas nao completou a anamnese.

### Comportamento esperado

- Laiza (e qualquer cliente futura) vera um card grande e claro no topo do Dashboard dizendo que precisa preencher a anamnese
- Ao clicar no botao, sera levada para `/anamnese`
- Apos completar a anamnese, o campo `anamnese_completa` vira `true` e o card desaparece automaticamente na proxima carga do Dashboard
- O redirect automatico continua existindo como primeira tentativa — o card e a rede de seguranca visual

### Nenhuma mudanca de banco de dados necessaria

Os campos `anamnese_completa`, `age`, `weight`, `height`, `goals` ja existem na tabela `profiles`.
