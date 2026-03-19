

# Tendência 30 dias explicativa + Telas de detalhe dos sub-scores

## Resumo

Duas melhorias na experiência do aluno:

1. **Gráfico de Tendência 30 dias** — adicionar legenda explicativa abaixo do gráfico e tooltip enriquecido com contexto (o que significa cada número, o que as médias 7d/14d/30d representam).

2. **Sub-score cards clicáveis** — cada card (Treino, Recuperação, Cognitivo, Consistência, Nutrição) abre um modal/sheet com:
   - Gráfico de linha dos últimos 30 dias daquele pilar específico
   - Explicação do que o pilar mede
   - Como o score é calculado (linguagem simples)
   - Dica de como melhorar
   - Por que é importante preencher os dados

## Implementação

### 1. SisTrendChart.tsx — Legenda explicativa

Adicionar abaixo do gráfico:
- Texto explicativo: "Este gráfico mostra a evolução do seu Shape Intelligence Score™ nos últimos 30 dias."
- Explicação das médias: "7d = média dos últimos 7 dias · 14d = últimos 14 · 30d = média geral do mês"
- Indicador de tendência: se avg7 > avg30 → "Sua tendência está subindo ↑" (verde), se avg7 < avg30 → "Sua tendência está caindo ↓" (vermelho)
- Dica: "Preencha seus dados diariamente para manter a precisão do gráfico."

### 2. SisSubScoreCards.tsx — Cards clicáveis com Sheet de detalhe

Tornar cada card clicável → abre um `Sheet` (drawer de baixo) com:

**Conteúdo do Sheet por pilar:**

| Pilar | O que mede | Como melhorar |
|---|---|---|
| Treino | Volume e intensidade dos treinos registrados | Registre séries e RPE após cada treino |
| Recuperação | Qualidade do sono e nível de estresse | Registre horas de sono e estresse diariamente |
| Cognitivo | Clareza mental, foco e disposição | Faça o check-in cognitivo de 1 minuto |
| Consistência | Frequência de registros ao longo do tempo | Registre dados todos os dias, mesmo nos dias de descanso |
| Nutrição | Adesão ao plano alimentar e registro de refeições | Registre suas refeições no Diário Nutricional |

Cada Sheet inclui:
- Ícone + título do pilar
- Score atual (grande)
- Mini gráfico de linha 30 dias (dados do `scores30dFull`)
- Texto "O que este número significa" com explicação simples
- Texto "Como melhorar" com ação prática
- Texto "Por que preencher?" enfatizando que dados vazios = score baixo

### 3. Dados necessários

Os dados de 30 dias por pilar já existem em `scores30dFull` do `useSisScore`. Basta passar esse array para o componente e extrair o campo correspondente (ex: `mechanical_score`, `recovery_score`, etc.).

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/sis/SisTrendChart.tsx` | Adicionar legenda explicativa + indicador de tendência |
| `src/components/sis/SisSubScoreCards.tsx` | Tornar cards clicáveis, abrir Sheet com gráfico + explicações |
| `src/pages/Renascer.tsx` | Passar `scores30dFull` para SisSubScoreCards |

Nenhuma migration necessária — todos os dados já existem.

