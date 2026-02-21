

# Indicadores Premium no Topo da Pagina "Dados do Corpo"

## Resumo

Adicionar 3 indicadores compactos (Consistencia, Recuperacao, Capacidade Atual) acima das abas na pagina Dados do Corpo. Eles combinam dados de `health_daily` e `manual_day_logs` dos ultimos 7 dias em uma unica query unificada.

---

## 1. Funcao utilitaria: computeBodyIndicators

**Arquivo novo:** `src/lib/bodyIndicators.ts`

Recebe logs unificados dos ultimos 7 dias (cada dia com campos opcionais: sleep_hours, stress_level, energy_focus, trained_today, steps, active_calories, resting_hr, hrv_ms) e retorna:

```text
{
  consistencyPercent: number | null   // null se < 3 dias
  recoveryTrendLabel: string | null   // "estavel", "em alta", "em queda", "oscilando"
  recoveryTrendArrow: string          // "arrow-up", "arrow-down", "minus", "activity"
  capacityLabel: string | null        // "baixa", "moderada", "alta"
  hasEnoughData: boolean
}
```

**Calculos:**

- **Consistencia**: dias com pelo menos 1 campo valido / 7 * 100, arredondado. Se < 3 dias, retorna null.
- **Recovery score diario** (0-100): normaliza sono (7-9h = 100, <5h = 20), stress (invertido), energy (1-5 mapeado para 20-100), resting_hr e hrv quando disponiveis. Media dos campos presentes.
- **Trend**: media recovery ultimos 3 dias vs 3 anteriores. Delta > +3 = "em alta", < -3 = "em queda", variancia alta = "oscilando", senao "estavel".
- **Capacidade**: media recovery ultimos 3 dias. < 45 = "baixa", 45-74 = "moderada", >= 75 = "alta".

---

## 2. Hook para buscar dados unificados

**Dentro do componente** (ou inline no DadosCorpo): reutilizar o `useHealthData` ja existente (que traz `health_daily` dos ultimos 7 dias) e adicionar uma query para `manual_day_logs` dos ultimos 7 dias. Unificar por data, priorizando dados automaticos quando ambos existem.

A query de `manual_day_logs` sera adicionada diretamente no componente `BodyPremiumIndicators` para manter o DadosCorpo.tsx limpo.

---

## 3. Componente BodyPremiumIndicators

**Arquivo novo:** `src/components/health/BodyPremiumIndicators.tsx`

- Recebe `userId: string`
- Faz 2 queries: `health_daily` (ultimos 7 dias) + `manual_day_logs` (ultimos 7 dias)
- Unifica por data em array de 7 posicoes
- Chama `computeBodyIndicators()`
- Renderiza 3 chips em `grid grid-cols-3` (desktop) e `grid-cols-1` (mobile)

Cada chip:

```text
+---------------------------+
| [icone] Consistencia      |
|        82%                |
|   ultimos 7 dias          |
+---------------------------+
```

- Fundo: card dark padrao (`bg-card border border-border/50`)
- Valor principal: `text-primary` (laranja Renascer) quando tem dado, `text-muted-foreground` quando "--"
- Icone discreto: CheckCircle (consistencia), TrendingUp (recuperacao), Zap (capacidade)
- Loading: 3 Skeleton retangulares
- Empty state (< 3 dias): valor "--" e legenda "complete 3 dias para ativar"

---

## 4. Integracao na pagina DadosCorpo

**Arquivo:** `src/pages/DadosCorpo.tsx`

Inserir `<BodyPremiumIndicators userId={user.id} />` entre o header e as Tabs. O componente fica fixo independente da aba selecionada.

---

## Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `src/lib/bodyIndicators.ts` | Criar funcao computeBodyIndicators |
| `src/components/health/BodyPremiumIndicators.tsx` | Criar componente com queries + render |
| `src/pages/DadosCorpo.tsx` | Inserir componente acima das tabs |

## Sem alteracoes

- Banco de dados (RLS ja cobre ambas as tabelas)
- Rotas
- Outros componentes

