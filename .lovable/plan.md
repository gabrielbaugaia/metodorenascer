
# Corrigir Exibicao do MRR: Dividir Centavos por 100

## Problema

O campo `mrr_value` esta armazenado em **centavos** (4990 = R$49,90). A view `v_mrr_summary` soma os valores (4990 + 4990 = 9980), mas o frontend exibe esse numero diretamente como reais, resultando em R$ 9.980,00 ao inves de R$ 99,80.

## Solucao

Corrigir a exibicao no frontend dividindo por 100 nos dois locais que usam dados de MRR em centavos:

### 1. AdminMetricas.tsx

Dividir `totalMrr` por 100 antes de exibir:

```text
// Antes (errado):
const totalMrr = paidMrrSummary.reduce((acc, s) => acc + (Number(s.total_mrr) || 0), 0);

// Depois (correto):
const totalMrr = paidMrrSummary.reduce((acc, s) => acc + (Number(s.total_mrr) || 0), 0) / 100;
```

Tambem corrigir a exibicao individual por plano na secao "MRR por Plano":

```text
// Antes:
R$ {Number(plan.total_mrr || 0).toLocaleString("pt-BR")}

// Depois:
R$ {(Number(plan.total_mrr || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
```

E na tabela de canais:

```text
// Antes:
R$ {Number(ch.total_mrr || 0).toLocaleString("pt-BR")}

// Depois:
R$ {(Number(ch.total_mrr || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
```

### 2. Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminMetricas.tsx` | Dividir total_mrr por 100 no KPI card, na secao MRR por Plano, e na tabela de canais |

### Resultado Esperado

- **MRR Total**: R$ 99,80 (em vez de R$ 9.980,00)
- **MRR por plano ELITE FUNDADOR**: R$ 99,80 (em vez de R$ 9.980,00)
- Todos os valores monetarios exibidos corretamente em reais
