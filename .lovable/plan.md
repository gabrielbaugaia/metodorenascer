

# Plano: Gerar PDF Documentando o Sistema de Inteligência Mental

## O que será gerado

Um PDF profissional (seguindo o branding do Método Renascer — Helvetica, laranja #FF4500) documentando toda a arquitetura do Sistema de Inteligência Mental, incluindo:

### Conteúdo do documento

**1. Visão Geral do Sistema**
- Nome: Sistema de Inteligência Mental (Mental Wellness Intelligence)
- Objetivo: cruzar dados subjetivos (check-in cognitivo) com dados fisiológicos (VFC, FC, sono) para identificar padrões psicológicos

**2. Fontes de Dados**
- Tabela `sis_cognitive_checkins`: 9 métricas subjetivas (1-5) + álcool + interação social
- Tabela `manual_day_logs`: horas de sono, nível de estresse, energia/foco
- Tabela `health_daily`: VFC, FC repouso, FC média

**3. Os 6 Índices e suas Fórmulas**
- Burnout (pesos: estresse 30%, sono 25%, irritabilidade 25%, queda VFC 20%)
- Risco Compulsão (disciplina alimentar 40%, álcool 30%, estresse alto 30%)
- Correlação Sono→Humor (delta energia mental entre dias <6h vs ≥7h sono)
- Divergência Corpo-Mente (cognitivo subjetivo vs VFC normalizada)
- Tendência Motivação (1ª metade vs 2ª metade da semana)
- Resiliência (duração média dos períodos de estresse alto)

**4. Sistema de Alertas Automáticos**
- Burnout ≥70% → alerta alta prioridade
- Compulsão ≥60% → alerta média
- Motivação ≥50% → alerta média
- Isolamento social ≥5 dias → alerta alta
- Ansiedade ≥4/5 por 4+ dias → alerta alta

**5. Classificação Visual**
- Verde (Baixo): <40%
- Amarelo (Moderado): 40-69%
- Vermelho (Alto): ≥70%
- Resiliência invertida (maior = melhor)

**6. Insights Personalizados por Nível**
- Cada índice tem texto específico para alto/moderado/baixo

## Execução

| Ação | Detalhe |
|---|---|
| Script Python com reportlab | Gerar PDF em `/mnt/documents/` |
| Branding | Helvetica, laranja #FF4500, fundo cinza escuro para header |
| QA | Converter para imagem e inspecionar |

Nenhuma alteração no código do projeto. Apenas geração de artefato PDF.

