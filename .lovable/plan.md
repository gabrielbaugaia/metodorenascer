

# Diagnóstico: Dados cardiovasculares NÃO estão integrados na prescrição nem na evolução

## Situação atual

Analisei todo o fluxo e confirmei que os dados avançados de saúde (VFC, FC repouso, BPM diário) **NÃO são usados** em dois pontos críticos:

### 1. Análise de Evolução (`analyze-evolution`)
- Recebe apenas: fotos (antes/depois), peso inicial, peso atual e notas do cliente
- **Não recebe**: dados de `health_daily` (VFC, FC repouso, sono, passos, calorias ativas)
- A IA compara apenas visualmente as fotos, sem contexto fisiológico

### 2. Geração de Protocolos (`generate-protocol`)
- Recebe: dados da anamnese (perfil, objetivo, horários, restrições) + ajustes de evolução visual
- **Não recebe**: histórico de `health_daily`, tendência de VFC, FC de repouso, volume de treino real, qualidade de sono
- O `evolutionAdjustments` já existe e funciona, mas vem apenas da análise visual das fotos — não dos dados numéricos de saúde

### O que JÁ funciona
- VFC, FC repouso e BPM alimentam o **SIS Score** (compute-sis-score) e o **dashboard de saúde**
- Mas esses dados param ali — não chegam ao sistema de prescrição

---

## Plano de integração

### 1. Enriquecer `analyze-evolution` com dados de saúde
No `analyze-evolution/index.ts`, além das fotos e peso, passar os últimos 30 dias de `health_daily` para a IA comparar:
- Tendência de VFC (subindo = boa adaptação, caindo = overtraining)
- FC de repouso (caindo = bom condicionamento)
- Média de sono, passos, calorias ativas
- Score SIS médio do período

A IA poderá então sugerir ajustes baseados em dados fisiológicos reais, não só visuais.

### 2. Enriquecer `generate-protocol` com snapshot de saúde
No `generate-protocol/index.ts`, antes de gerar o protocolo, buscar os últimos 14-30 dias de `health_daily` do usuário e passar como contexto adicional no prompt:
- VFC média e tendência
- FC de repouso média
- Horas de sono médias
- Volume de atividade (passos, calorias)
- Score SIS mais recente

Isso permite que a IA ajuste intensidade, volume e recuperação com base em dados reais.

### 3. Atualizar o frontend que chama `analyze-evolution`
No componente que dispara a análise de evolução (provavelmente em `Evolucao.tsx`), buscar e enviar os dados de `health_daily` junto com as fotos.

---

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `supabase/functions/analyze-evolution/index.ts` | Receber `healthData` no body, incluir no prompt como contexto fisiológico |
| `supabase/functions/generate-protocol/index.ts` | Buscar `health_daily` dos últimos 30 dias do usuário e injetar no prompt |
| `supabase/functions/generate-protocol/prompts/treino.ts` | Adicionar seção de contexto fisiológico no system prompt |
| `supabase/functions/generate-protocol/prompts/nutricao.ts` | Adicionar contexto de sono e recuperação no prompt |
| `src/pages/Evolucao.tsx` (ou componente que chama analyze-evolution) | Passar dados de health_daily na chamada |

## Resultado esperado

Após a implementação, quando gerar um novo protocolo ou análise de evolução, a IA verá dados como:
- "VFC média 18ms (baixa), tendência estável → cuidado com volume excessivo"
- "FC repouso 99 BPM (elevada) → priorizar recuperação e aeróbico leve"
- "Sono médio 5.5h → ajustar horário de treino e suplementação"

Transformando os dados coletados em decisões de prescrição inteligentes.

