

# Painel Admin — Visibilidade do Renascer Mode dos Clientes

## Problema

O Renascer Mode esta ativo para clientes, mas o admin (Gabriel) nao tem como ver os dados registrados pelos alunos. Nao existe nenhuma tela ou secao no painel admin que mostre os scores, logs diarios ou tendencias dos clientes.

## Solucao

Adicionar uma secao "Renascer" dentro da pagina de detalhes do cliente (`AdminClienteDetalhes.tsx`) que mostra o historico de registros e o score atual do aluno. Isso permite que o admin acompanhe cada cliente individualmente e oriente com base nos dados reais.

---

## 1. Nova Secao no Detalhe do Cliente

**Arquivo a modificar:** `src/pages/admin/AdminClienteDetalhes.tsx`

Adicionar um novo bloco/card "Renascer Mode" apos as secoes existentes (anamnese, evolucao, etc.), contendo:

### Card 1 — Score Atual + Status
- Score do dia (ou ultimo registro)
- Badge de classificacao (ELITE / ALTO / MODERADO / RISCO)
- Texto de status ("Pronto para evoluir", etc.)
- Data do ultimo registro

### Card 2 — Historico (ultimos 14 dias)
- Tabela compacta com colunas: Data | Sono | Estresse | Energia | Treinou? | RPE | Score
- Ordenada por data desc
- Se nao houver registros: "Cliente ainda nao registrou dados no Renascer"

### Card 3 — Tendencia Resumida
- Mesma logica de tendencia do hook (media 3d vs 3d anteriores)
- Indicador visual: seta + texto

---

## 2. Novo Componente

**Arquivo a criar:** `src/components/admin/AdminRenascerSection.tsx`

Componente que recebe `clientId: string` e:
1. Busca os ultimos 14 registros de `manual_day_logs` para esse usuario
2. Calcula o score para cada dia (mesma formula do `useRenascerScore`)
3. Renderiza os 3 cards acima

A logica de calculo sera extraida do hook existente para uma funcao pura reutilizavel, evitando duplicacao.

---

## 3. Funcao Pura de Calculo

**Arquivo a criar:** `src/lib/renascerScoreCalc.ts`

Extrair a logica de calculo de score para uma funcao pura:
```
calculateRenascerScore(log: { sleep_hours, stress_level, energy_focus, trained_today, rpe }) => { score, classification, statusText }
```

Essa funcao sera usada tanto pelo hook do cliente (`useRenascerScore.ts`) quanto pelo componente admin, garantindo consistencia.

---

## 4. Integracao no AdminClienteDetalhes

No arquivo `AdminClienteDetalhes.tsx`, importar e renderizar `AdminRenascerSection` passando o `clientId` do aluno sendo visualizado. Posicionar apos a secao de evolucao.

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/lib/renascerScoreCalc.ts` | Criar — funcao pura de calculo de score |
| `src/components/admin/AdminRenascerSection.tsx` | Criar — secao Renascer no detalhe do cliente |
| `src/hooks/useRenascerScore.ts` | Modificar — importar calculo de `renascerScoreCalc` em vez de duplicar |
| `src/pages/admin/AdminClienteDetalhes.tsx` | Modificar — adicionar `AdminRenascerSection` |

## Sem alteracoes de banco

A tabela `manual_day_logs` ja tem RLS para admin (`has_role`). Nenhuma migracao necessaria.

