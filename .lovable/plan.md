
# Prescrição Nutricional Completa + Lista de Compras + Substituições

Upgrade massivo no sistema de geração nutricional para produzir protocolos quantificados, estratégicos e completos, com lista de compras automatica e sistema de substituições equivalentes.

---

## O Que Muda

O prompt de nutrição atual gera dietas incompletas: sem macros por refeição obrigatórios, sem diferenciação dia de treino vs descanso, sem refeição pré-sono obrigatória, sem lista de compras estruturada e sem substituições equivalentes detalhadas. Este upgrade transforma a geração em uma prescrição profissional completa.

---

## Fase 1 -- Atualizar o Schema de Nutrição

**Arquivo:** `supabase/functions/generate-protocol/schemas.ts`

Expandir a interface `NutricaoProtocolSchema` para incluir os novos campos obrigatórios:

- `macros_diarios` com calorias, proteina_g, carboidrato_g, gordura_g, agua_litros
- `hidratacao_pratica` (array de distribuição: "500ml ao acordar", etc.)
- `plano_dia_treino` com refeições completas (cada uma com macros obrigatórios por refeição)
- `plano_dia_descanso` com refeições ajustadas (carbs reduzidos 15-30%)
- `refeicao_pre_sono` com 3 opções fixas com macros
- `estrategia_anti_compulsao` (seção textual obrigatória)
- `lista_compras_semanal` estruturada por categorias (proteinas, carboidratos, gorduras, frutas, vegetais, outros), cada item com nome e quantidade semanal
- `substituicoes` por categoria (proteínas, carboidratos, gorduras) com equivalências numéricas
- `substituicoes_por_refeicao` (para cada refeição, lista de trocas possíveis)

Atualizar `validateNutricaoProtocol` para verificar **obrigatoriamente**:

1. Macros diários definidos (calorias, P, C, G)
2. Macros por refeição em cada refeição
3. Existência de refeição pré-treino
4. Existência de refeição pós-treino
5. Existência de refeição pré-sono com 3 opções
6. Hidratação definida (litros + distribuição)
7. Dois planos: dia de treino e dia de descanso
8. Lista de compras gerada
9. Substituições geradas

Se algum critério falhar, o protocolo é rejeitado e a IA deve corrigir automaticamente (loop de correção no edge function).

---

## Fase 2 -- Reescrever o Prompt de Nutrição

**Arquivo:** `supabase/functions/generate-protocol/prompts/nutricao.ts`

Reescrever `getNutricaoSystemPrompt` para incluir:

- Instrução explícita de calcular macros diários e mostrar em formato tabular
- Regra de hidratação: 35-45ml/kg, distribuída em 6 momentos do dia
- Instrução de criar 2 planos: dia de treino (carbs altos pré/pós) e dia de descanso (carbs -15/30%)
- Refeição pré-treino obrigatória (60-120min antes): P 25-45g, C alto, G baixa
- Refeição pós-treino obrigatória (até 2h após): P 30-50g, C alto, G baixa
- Refeição pré-sono obrigatória: P 25-40g, C baixo, G moderada, 3 opções com macros
- Seção anti-compulsão noturna obrigatória
- Macros por refeição obrigatórios (P, C, G, kcal em cada refeição)
- Substituições equivalentes por categoria com quantidades (ex: 180g frango = 200g tilápia)
- Substituições por refeição
- Lista de compras semanal por categoria com quantidades calculadas (diário x 7)
- Respeitar restrições alimentares, aversões e condições de saúde da anamnese

Atualizar o JSON de retorno esperado para o novo formato expandido.

Atualizar `getNutricaoUserPrompt` para incluir dados adicionais do perfil: peso, medicações, condições de saúde, aversões.

---

## Fase 3 -- Validação com Loop de Correção no Edge Function

**Arquivo:** `supabase/functions/generate-protocol/index.ts`

No bloco `tipo === "nutricao"`, após parsear o JSON:

1. Rodar `validateNutricaoProtocol` expandido com os 9 critérios
2. Se falhar em algum critério obrigatório, fazer uma segunda chamada à IA com prompt de correção específico: "O protocolo falhou nos seguintes critérios: X, Y, Z. Corrija e retorne o JSON completo."
3. Máximo 2 tentativas de correção (3 chamadas total)
4. Se ainda falhar após 3 tentativas, salvar com warning no audit_result

---

## Fase 4 -- Atualizar Auditoria Nutricional

**Arquivo:** `supabase/functions/audit-prescription/index.ts`

Quando `type === "nutricao"`, usar critérios de auditoria específicos para nutrição:

- `macros_definidos` -- macros diários presentes com valores numéricos
- `macros_por_refeicao` -- cada refeição tem P, C, G, kcal
- `pre_treino_presente` -- refeição pré-treino existe com macros adequados
- `pos_treino_presente` -- refeição pós-treino existe
- `pre_sono_presente` -- refeição pré-sono com 3 opções
- `hidratacao_presente` -- hidratação calculada por kg
- `dia_treino_vs_descanso` -- dois planos diferenciados existem
- `lista_compras_gerada` -- lista de compras com quantidades
- `substituicoes_geradas` -- substituições equivalentes presentes
- `compativel_anamnese` -- respeita restrições, aversões e condições

Score: cada critério vale 10 pontos (total 100).

---

## Fase 5 -- Atualizar Frontend (Página Nutrição do Aluno)

**Arquivo:** `src/pages/Nutricao.tsx`

Expandir para exibir:

1. **Cards de macros diários** (já existem parcialmente, melhorar com água)
2. **Tabs "Dia de Treino" / "Dia de Descanso"** para alternar entre os dois planos
3. **Macros por refeição** exibidos dentro de cada card de refeição (P, C, G, kcal)
4. **Seção pré-sono** destacada com as 3 opções e macros
5. **Card de hidratação** com distribuição visual ao longo do dia
6. **Seção "Lista de Compras"** colapsável, organizada por categoria
7. **Seção "Substituições"** colapsável, organizada por categoria
8. **Seção anti-compulsão** como card informativo

---

## Fase 6 -- Atualizar PDF de Nutrição

**Arquivo:** `src/lib/generateProtocolPdf.ts`

Na função `generateNutricaoPdf`, adicionar seções:

1. Tabela de macros diários completa (incluindo água)
2. Seção "Plano Dia de Treino" com todas as refeições e macros
3. Seção "Plano Dia de Descanso" com refeições ajustadas
4. Seção "Refeição Pré-Sono" com 3 opções
5. Seção "Hidratação" com distribuição
6. Seção "Lista de Compras Semanal" por categoria
7. Seção "Substituições Equivalentes" por categoria
8. Seção "Controle da Fome Noturna" com orientações
9. Seção de auditoria (admin only, com `includeAudit`)

---

## Fase 7 -- Atualizar Editor Admin de Nutrição

**Arquivo:** `src/components/admin/NutritionProtocolEditor.tsx`

Adicionar campos editáveis para:

- Macros diários (já existe parcialmente)
- Hidratação (litros + distribuição)
- Toggle dia treino/descanso para editar ambos os planos
- Editor de substituições
- Visualização da lista de compras
- Seção pré-sono editável

---

## Fase 8 -- Painel de Auditoria Nutricional (Admin)

**Arquivo:** `src/components/admin/PrescriptionAuditPanel.tsx`

Expandir para reconhecer critérios nutricionais quando `tipo === "nutricao"`:

- Mostrar checklist dos 10 critérios nutricionais (em vez dos 9 de treino)
- Score final XX/100
- Itens falhados em destaque

---

## Arquivos a Criar

Nenhum arquivo novo necessário. Toda a implementação se encaixa nos arquivos existentes.

## Arquivos a Modificar

| Arquivo | Alteração |
|---|---|
| `supabase/functions/generate-protocol/schemas.ts` | Expandir interface e validação de nutrição |
| `supabase/functions/generate-protocol/prompts/nutricao.ts` | Reescrever prompt completo |
| `supabase/functions/generate-protocol/index.ts` | Adicionar loop de correção para nutrição |
| `supabase/functions/audit-prescription/index.ts` | Critérios de auditoria específicos para nutrição |
| `src/pages/Nutricao.tsx` | UI expandida com tabs, macros por refeição, lista de compras, substituições |
| `src/lib/generateProtocolPdf.ts` | Novas seções no PDF |
| `src/components/admin/NutritionProtocolEditor.tsx` | Campos de edição expandidos |
| `src/components/admin/PrescriptionAuditPanel.tsx` | Critérios nutricionais |

---

## Seção Técnica

- O novo formato JSON de nutrição mantém retrocompatibilidade: o campo `refeicoes` continua existindo para protocolos antigos. Novos protocolos terão `plano_dia_treino.refeicoes` e `plano_dia_descanso.refeicoes`.
- A página Nutricao.tsx detecta automaticamente o formato (legado vs novo) e renderiza conforme disponível.
- O loop de correção no edge function faz no máximo 2 chamadas adicionais. Se o protocolo ainda falhar, ele é salvo com um `audit_result.warning` para revisão manual do admin.
- A lista de compras é calculada pela IA com base nas quantidades diárias x 7 dias. Não há cálculo no frontend.
- As substituições respeitam obrigatoriamente as restrições da anamnese (se o cliente não come peixe, peixe não aparece nas substituições).
- Nenhuma alteração nos fluxos MQO/admin de geração. Apenas o prompt de nutrição e sua validação são afetados.
- Não há alteração de schema no banco de dados. Os novos campos ficam dentro do JSONB `conteudo` da tabela `protocolos`.
