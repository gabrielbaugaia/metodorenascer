

# Plano: Sistema de Inteligência Mental — Cruzamento de Dados para Identificar Padrões Psicológicos

## Dados que JÁ coletamos e podem ser cruzados

O sistema já possui uma riqueza de dados que, quando correlacionados, revelam padrões psicológicos importantes:

### Dados existentes

| Fonte | Dados | Indicador psicológico |
|---|---|---|
| Check-in Cognitivo (SIS) | Energia mental, clareza, foco, irritabilidade, disciplina alimentar, álcool | Estado cognitivo diário |
| Manual Day Logs | Estresse (0-100), energia/foco (1-5), sono (horas) | Carga alostática percebida |
| Health Daily | VFC/HRV, FC repouso, BPM médio | Estresse fisiológico REAL (involuntário) |
| Workout Completions | Frequência, RPE, abandono de treinos | Motivação e overtraining |
| Food Logs | Regularidade, aderência ao plano | Compulsão alimentar / disciplina |
| Mindset Progress | Práticas completadas, rotinas seguidas | Engajamento com saúde mental |
| Comportamento no App | Frequência de login, horários, padrões | Isolamento digital, insônia |

## Análises cruzadas que podemos criar

### 1. Índice de Risco de Burnout (cruzamento de 4 fontes)
- **Estresse alto + sono baixo + VFC em queda + irritabilidade alta** por 5+ dias
- Fórmula: peso nos últimos 7 dias de stress_level, sleep_hours, hrv_ms, irritability
- Classificação: Verde / Amarelo / Vermelho

### 2. Detector de Compulsão Alimentar
- **Disciplina alimentar baixa (1-2) + estresse alto + álcool frequente**
- Correlacionar com food_logs irregulares ou ausentes
- Sinalizar quando padrão se repete 3+ dias na semana

### 3. Análise Sono-Humor (correlação direta)
- Gráfico dual: sono vs energia mental ao longo de 30 dias
- Identificar se sono < 6h precede consistentemente energia/clareza baixas
- Orientação: "Seus dados mostram que abaixo de 6h de sono sua clareza mental cai 40%"

### 4. Divergência Corpo vs Mente
- Quando VFC/FC dizem que o corpo está bem MAS o check-in cognitivo mostra irritabilidade/foco baixo → possível causa psicológica (não fisiológica)
- Quando corpo está em risco MAS mente reporta "tudo bem" → possível negação ou alexitimia

### 5. Padrão de Motivação (Engagement Decay)
- Medir queda progressiva: login frequente → esporádico, treinos completos → abandonados
- Cruzar com estresse e sono para diferenciar: desmotivação vs overtraining vs burnout

### 6. Índice de Resiliência Emocional
- Medir velocidade de recuperação: após dias de estresse alto, quantos dias leva para voltar ao baseline?
- Resiliência alta: 1-2 dias / Baixa: 5+ dias

## O que precisamos ADICIONAR ao check-in

Novos campos rápidos (mantendo o check-in em 1-2 min):

| Campo | Tipo | Por quê |
|---|---|---|
| **Humor** (1-5) | Slider | Escala básica de valência emocional |
| **Ansiedade** (1-5) | Slider | Diferencia estresse (externo) de ansiedade (interno) |
| **Motivação para treinar** (1-5) | Slider | Detecta anedonia e perda de interesse |
| **Qualidade do sono** (1-5) | Slider | Complementa horas — insônia vs sono longo mas ruim |
| **Interação social** (sim/não) | Toggle | Isolamento é marcador forte de depressão |

## Implementação técnica

### 1. Migration: expandir `sis_cognitive_checkins`
Adicionar colunas: `mood`, `anxiety`, `training_motivation`, `sleep_quality`, `social_interaction`

### 2. Novo componente: `MindsetInsightsPanel`
- Dashboard na página Mindset ou Renascer
- Cards com os 6 índices calculados (Burnout, Compulsão, Sono-Humor, etc.)
- Gráficos de correlação de 30 dias
- Alertas automáticos com orientações

### 3. Edge function: `compute-mental-wellness`
- Roda junto com `compute-sis-score` (ou após)
- Calcula os índices cruzados e salva em nova tabela `mental_wellness_scores`
- Gera alertas quando detecta padrões de risco

### 4. Nova tabela: `mental_wellness_scores`
```
user_id, date, burnout_index, compulsion_risk, sleep_mood_correlation,
body_mind_divergence, motivation_trend, resilience_index,
alerts (jsonb), created_at
```

### 5. Integração com prescrição
- `generate-protocol` (mindset) recebe o wellness score para personalizar:
  - Burnout alto → protocolo focado em recuperação e limites
  - Ansiedade alta → técnicas de respiração e grounding
  - Motivação baixa → micro-metas e recompensas

### 6. Alerta para o admin/mentor
- No painel admin do cliente, exibir bandeira quando algum índice está vermelho
- Permite intervenção proativa antes que o aluno desista

## Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Expandir `sis_cognitive_checkins` + criar `mental_wellness_scores` |
| `src/components/sis/SisCognitiveCheckin.tsx` | Adicionar novos campos (humor, ansiedade, motivação, qualidade sono, social) |
| `supabase/functions/compute-sis-score/index.ts` | Adicionar cálculo dos índices mentais |
| `src/components/mindset/MindsetInsightsPanel.tsx` | Novo — dashboard de insights mentais |
| `src/pages/Mindset.tsx` ou `src/pages/Renascer.tsx` | Integrar painel de insights |
| `src/pages/admin/AdminClienteDetalhes.tsx` | Exibir alertas mentais do cliente |

## Resultado

O mentor verá: "João está com índice de burnout em 78% (vermelho) há 5 dias — estresse alto, sono < 5h, VFC caindo, irritabilidade 5/5. Sugestão: conversa de suporte + ajuste de protocolo para recuperação."

O aluno verá: orientações personalizadas baseadas nos seus próprios padrões — sem rótulos clínicos, focando em ações práticas.

