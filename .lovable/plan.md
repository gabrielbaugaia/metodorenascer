

# Backfill SIS Scores (30 dias) + PDF Executive Report

## O que precisa ser feito

### 1. Edge Function: `backfill-sis-scores`
Nova edge function que recebe um `user_id` (admin pode passar qualquer user_id, aluno só o próprio) e itera pelos últimos 30 dias, chamando a lógica de cálculo do `compute-sis-score` para cada dia que tenha dados em `manual_day_logs`, `workout_set_logs` ou `workout_completions`. Isso popula `sis_scores_daily` com o histórico retroativo.

Alternativa mais simples: modificar `compute-sis-score` para aceitar um parâmetro `backfill: true` que roda o cálculo para cada dia dos últimos 30 dias em loop, em vez de criar uma função separada.

### 2. Botão de Backfill na UI
Adicionar um botão discreto no dashboard `/renascer` (ex: "Importar histórico SIS") que chama o backfill. Mostrar loading e feedback de sucesso. Após concluir, invalidar queries do SIS para atualizar gráficos e scores.

### 3. PDF: `generateSisReportPdf.ts`
Criar `src/lib/generateSisReportPdf.ts` seguindo o padrão existente (jsPDF, Helvetica, barras laranja #FF4500):

**Página 1 — Resumo Executivo:**
- Shape Intelligence Score™ + classificação + tendência 7vs30
- 6 sub-scores em grid
- Alertas ativos

**Página 2 — Tendências (30 dias):**
- Tabela com scores diários (data, SIS, mechanical, recovery, cognitive, consistency)
- Médias 7d/14d/30d

**Página 3 — Módulos detalhados:**
- Card por módulo: score atual + insight textual
- Seção "Como ler seu score"

### 4. Botão de Download PDF
Adicionar botão "Baixar Relatório SIS" no dashboard `/renascer`, ao lado do trend chart ou no topo. Busca os 30 dias de `sis_scores_daily` + perfil do usuário e gera o PDF client-side.

### 5. Admin: Download PDF do cliente
Na página de detalhes do cliente (`/admin/clientes/{id}`), adicionar botão para gerar o mesmo PDF SIS passando o `user_id` do cliente. O admin também pode disparar o backfill para qualquer cliente.

## Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/compute-sis-score/index.ts` | Adicionar modo `backfill` (loop 30 dias) |
| `src/lib/generateSisReportPdf.ts` | Criar — PDF executive report |
| `src/pages/Renascer.tsx` | Botões backfill + download PDF |
| `src/pages/admin/AdminClienteDetalhes.tsx` | Botão backfill + PDF para admin |

Sem mudanças no banco de dados.

