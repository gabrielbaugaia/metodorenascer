
# Melhorar Analise Corporal por IA — Percentual de Gordura e Avaliacao Postural Tecnica

## Diagnostico

O prompt atual ja solicita percentual de gordura estimado e analise postural, e o frontend ja exibe esses campos. Porem:

1. O modelo usado (`gemini-2.5-flash`) e mais rapido mas menos preciso em analise visual detalhada
2. O prompt nao enfatiza suficientemente a obrigatoriedade desses campos
3. Falta instrucao tecnica sobre COMO estimar o percentual (referencias visuais tipo ACBM/Jackson-Pollock)
4. A analise postural nao detalha angulos articulares especificos (ombro protuso, joelho valgo grau, etc.)

## Mudancas

### 1. Edge Function `supabase/functions/analyze-body-composition/index.ts`

**Trocar modelo** de `google/gemini-2.5-flash` para `google/gemini-2.5-pro` — modelo superior para analise de imagens com raciocinio complexo.

**Reforcar prompt** com instrucoes tecnicas mais detalhadas:

- Percentual de gordura: instruir a IA a estimar com base em referencias visuais (pregas cutaneas visiveis, definicao abdominal, separacao muscular, vascularizacao) e fornecer faixa numerica obrigatoria (ex: "18-22%")
- Analise postural tecnica expandida:
  - **Ombros**: protrusao, elevacao, rotacao interna, assimetria em grau leve/moderado/severo
  - **Coluna**: lordose lombar, cifose toracica, retificacao cervical, escoliose aparente
  - **Quadril**: anteversao/retroversao pelvica, desnivelamento
  - **Joelhos**: valgo/varo, hiperextensao, rotacao tibial
  - **Tornozelos/pes**: pronacao/supinacao (novo campo)
- Adicionar campo `escalaVisualGordura` com descricao tecnica (ex: "Pregas abdominais visiveis, sem definicao de serrátil, vascularizacao ausente — compativel com 20-24%")
- Tornar TODOS os campos obrigatorios no prompt com instrucao "NUNCA omita nenhum campo"

### 2. Frontend `src/components/anamnese/BodyAnalysisResult.tsx`

- Adicionar exibicao do campo `escalaVisualGordura` como texto descritivo abaixo do badge de percentual
- Adicionar campo "Tornozelos" na grade postural
- Melhorar labels para serem mais tecnicos (ex: "Alinhamento Escapular" em vez de apenas "Ombros")

### 3. Interface no `ScheduleAndPhotosFields.tsx`

- Atualizar tipo `BodyAnalysis` para incluir novo campo `escalaVisualGordura` e `tornozelos` na analise postural

## Arquivos alterados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/analyze-body-composition/index.ts` | Trocar modelo para pro, reforcar prompt tecnico |
| `src/components/anamnese/BodyAnalysisResult.tsx` | Exibir escala visual gordura, adicionar tornozelos |
| `src/components/anamnese/ScheduleAndPhotosFields.tsx` | Atualizar interface BodyAnalysis |

Nenhuma mudanca no banco de dados.
