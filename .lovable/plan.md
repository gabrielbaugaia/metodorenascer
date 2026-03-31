

# Plano: Gerar PDF — Sistema de Inteligência Geral do Método Renascer

## Documento a ser gerado

PDF profissional (branding Método Renascer — Helvetica, #FF4500) documentando o **Sistema Completo de Análise de Inteligência** do Método Renascer, cobrindo todos os subsistemas e suas interconexões.

### Estrutura do documento (~8-10 páginas)

**1. Introdução — Sistema de Inteligência do Método Renascer**
- Visão geral: sistema que cruza dados subjetivos, fisiológicos, comportamentais e nutricionais para prescrição personalizada
- Fluxo de dados: Coleta → Processamento → Score → Prescrição → Monitoramento

**2. Fontes de Dados e Coleta Diária**
- `manual_day_logs`: sono, estresse, energia/foco, RPE, treinou hoje, screenshots fitness (passos, calorias, exercício, distância)
- `sis_cognitive_checkins`: 9 métricas subjetivas (1-5) + álcool + interação social
- `health_daily`: VFC, FC repouso, FC média, sono (minutos), passos, calorias ativas
- `workout_set_logs`: volume mecânico por exercício (carga × repetições)
- `workout_completions`: duração, exercícios completados
- `food_logs` + `daily_nutrition_targets`: aderência calórica e distribuição de refeições
- `body_assessments`: composição corporal (gordura, músculo, circunferências, análise segmentar)
- `photos`: fotos de evolução (frente, lado, costas)

**3. Shape Intelligence Score™ (SIS) — Score Geral Diário**
- 5 sub-scores com pesos: Mecânico (25%), Recuperação (20%), Cognitivo (15%), Consistência (20%), Nutrição (20%)
- Fórmulas de cada sub-score detalhadas
- Classificação: Elite (≥85), Alta Performance (≥70), Moderado (≥50), Risco (<50)
- Sistema de alertas automáticos (HRV baixo 3d, sono <6h 3d, estresse alto 3d, queda mecânica)

**4. Renascer Score™ — Prontidão Diária para Treino**
- Fórmula: inicia em 100, penalidades por sono, estresse, energia, RPE do dia anterior
- Classificação: Elite (≥85), Alto (≥65), Moderado (≥40), Risco (<40)
- Recomendações de volume por nível (100%, 80%, 50-60%, recuperação ativa)
- Análise de tendência (3 dias recentes vs 3 anteriores)

**5. Health Readiness — Integração Fisiológica**
- Cruzamento de dados de wearables com dados subjetivos
- Cálculo de prontidão: sono (<5h = -35pts), VFC vs baseline, FC vs baseline, passos, treinos recentes
- Impacto HIIT + sono baixo (penalidade composta)

**6. Inteligência Mental (Mental Wellness)**
- 6 índices: Burnout, Compulsão, Sono→Humor, Corpo-Mente, Motivação, Resiliência
- Fórmulas e pesos detalhados
- Sistema de alertas (isolamento social, ansiedade persistente)

**7. Perfil Comportamental e Desafios Adaptativos**
- 4 perfis: Consistent, Explorer, Executor, Resistant
- Métricas de classificação (14 dias de histórico)
- Desafios desbloqueados por streak (10, 21, 30 dias)
- Micro-wins diárias (treino, sono, mental, nutrição)

**8. Plano de 90 Dias — Ciclo de Prescrição**
- Análise → Prescrição → Execução (4 semanas) → Evolução → Ajuste
- Fotos de evolução obrigatórias a cada 4 semanas
- IA consome 30 dias de health_daily + SIS score para ajuste dinâmico do protocolo
- Análise visual comparativa enriquecida com dados fisiológicos

**9. Detecção Precoce de Irregularidades e Comorbidades**
- VFC em queda contínua → sinal de overtraining ou estresse crônico
- FC de repouso elevada → possível inflamação, infecção subclínica, ou estresse cardíaco
- Padrão sono <6h + estresse >70% → risco cardiovascular e metabólico
- Compulsão alimentar recorrente → sinalização de transtorno alimentar
- Isolamento social + ansiedade persistente → risco de depressão
- Divergência corpo-mente elevada → possível síndrome de fadiga crônica
- Queda motivação + queda performance mecânica → overreaching/overtraining
- Como o sistema gera alertas antecipados para o prescritor agir

**10. Importância dos Dados na Saúde e Prescrição Personalizada**
- Cada dado tem um papel: sono → recuperação, VFC → sistema nervoso autônomo, estresse → cortisol
- A prescrição não é genérica: o protocolo se adapta ao estado real do aluno
- Diferencial competitivo: decisões baseadas em dados vs intuição

## Execução

| Ação | Detalhe |
|---|---|
| Script Python com reportlab | Gerar PDF em `/mnt/documents/` |
| Branding | Helvetica, laranja #FF4500, headers com fundo escuro |
| QA | Converter para imagem e inspecionar todas as páginas |

Nenhuma alteração no código do projeto. Apenas geração de artefato PDF.

