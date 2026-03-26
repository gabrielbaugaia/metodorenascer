

# Plano: Cards de Saúde clicáveis com detalhe premium

## O que muda

Cada card de métrica no painel "Dados do Corpo" (Passos, Calorias, Sono, FC Repouso, VFC, BPM Diário, Exercício, Distância) passa a ser **clicável**. Ao tocar, abre um Drawer (mesmo padrão visual do SIS pillar detail) com:

1. **Valor atual** grande e colorido (verde/amarelo/vermelho conforme faixa saudável)
2. **Gráfico de 7 dias** com sparkline usando Recharts (mesma lib já usada no SIS)
3. **Tendência**: seta + texto ("melhorando", "estável", "em queda") comparando últimos 3 dias vs anteriores
4. **O que significa**: explicação científica em linguagem simples e natural
5. **Orientação para amanhã**: dica prática e personalizada baseada no valor atual

## Conteúdo científico por métrica

| Métrica | Faixas | Orientação |
|---|---|---|
| Passos | <5k risco, 5-8k moderado, >8k ideal | Caminhar mais 2000 passos = +10min vida |
| Calorias Ativas | Contextual (>300 bom) | Manter NEAT alto, subir escadas |
| Sono | <6h risco, 6-7h moderado, 7-9h ideal | Higiene do sono, regularidade |
| FC Repouso | >75 alerta, 60-75 normal, <60 atlético | Tendência caindo = bom condicionamento |
| VFC (HRV) | <20 baixo, 20-50 moderado, >50 bom | VFC subindo = boa adaptação ao treino |
| BPM Diário | >100 elevado, 70-100 normal, <70 ótimo | Monitorar picos de estresse |
| Exercício | Quantitativo | Meta OMS 150min/semana |
| Distância | Quantitativo | Progressão gradual de 10%/semana |

## Implementação técnica

### 1. Refatorar `MetricCard` em `HealthDashboardTab.tsx`
- Adicionar `onClick` e `cursor-pointer` + `ChevronRight` quando há dados
- Passar `dailyData` (7 dias) para extrair série histórica por métrica

### 2. Criar `HealthMetricDetailDrawer` (componente interno ou separado)
- Reutilizar exatamente o padrão visual do `PillarDetailDrawer` do SIS:
  - Score grande colorido no topo
  - Gráfico Recharts LineChart com dados de 7 dias
  - Cards de "O que significa", "Como melhorar", "Orientação"
- Calcular1 tendência (média últimos 3 vs anteriores)

### 3. Dadosreen usados: `dailyData` já  disponível no componente (7 dias de `health_daily`)

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/health/HealthDashboardTab.tsx` | MetricCard clicável + state para drawer aberto + HealthMetricDetailDrawer com gráfico e orientações |

Nenhuma migration necessária - todos os dados já existem em `health_daily`.

