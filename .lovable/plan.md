

# Ativar Modo de Geracao Deterministica Perfeita

## Estado Atual

O sistema ja implementa validacao rigorosa e auto-correcao para Treino (5 criterios obrigatorios + loop de correcao) e Nutricao (9 criterios + loop de correcao). O Mindset tem validacao basica (campos presentes) mas sem criterios estruturados nem loop de auto-correcao.

A regra solicitada exige que os 3 blocos (Treino, Nutricao, Mindset) passem por validacao completa e auto-correcao automatica antes de serem finalizados.

---

## O Que Precisa Mudar

### 1. Validacao Estruturada do Mindset (schemas.ts)

Converter `validateMindsetProtocol` para retornar resultado com criterios detalhados (igual treino/nutricao):

| Criterio | Descricao |
|---|---|
| `rotina_manha_presente` | Rotina da manha com passos claros (praticas array >= 2) |
| `rotina_noite_presente` | Rotina da noite com passos claros (praticas array >= 2) |
| `crencas_limitantes_completas` | 2+ crencas com crenca_original + reformulacao + acao_pratica |
| `afirmacoes_presentes` | Array de afirmacoes personalizadas (>= 2) |
| `mentalidade_necessaria` | Secao mentalidade com titulo e descricao |
| `tarefas_semanais_presentes` | Tarefas rastreavéis definidas |

Criar nova interface `MindsetValidationResult` com `criteria`, `failedCriteria` e `errors`.

### 2. Loop de Auto-Correcao para Mindset (index.ts)

Adicionar bloco de auto-correcao para mindset identico ao de treino e nutricao:

- Se validacao falhar, enviar prompt de correcao especifico
- Maximo 3 tentativas
- Salvar com warning se nao atingir 100%

### 3. Auditoria do Mindset (audit-prescription/index.ts)

Quando `tipo === "mindset"`, usar criterios especificos de mindset na auditoria:

- `rotina_manha_presente`
- `rotina_noite_presente`
- `crencas_com_reformulacao`
- `afirmacoes_comportamentais`
- `tarefas_rastreavéis`
- `mentalidade_definida`

Score: cada criterio vale ~16.7 pontos (6 criterios, total 100).

### 4. Painel de Auditoria Admin (PrescriptionAuditPanel.tsx)

Expandir para reconhecer criterios de mindset quando `tipo === "mindset"`:

- Mostrar checklist dos 6 criterios de mindset
- Score final XX/100
- Itens falhados em destaque

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/generate-protocol/schemas.ts` | Nova interface `MindsetValidationResult`, reescrever `validateMindsetProtocol` com criterios estruturados |
| `supabase/functions/generate-protocol/index.ts` | Adicionar loop de auto-correcao para mindset (linhas ~561) |
| `supabase/functions/audit-prescription/index.ts` | Criterios de auditoria especificos para mindset |
| `src/components/admin/PrescriptionAuditPanel.tsx` | Exibir criterios de mindset no painel admin |

---

## Secao Tecnica

- A validacao de mindset atualmente retorna `{ valid, errors }` sem `failedCriteria`. Sera expandida para `MindsetValidationResult` com `criteria` e `failedCriteria` (mesmo padrao de treino/nutricao).
- O loop de auto-correcao segue o mesmo padrao ja implementado: maximo 3 tentativas, prompt de correcao com criterios falhados, revalidacao apos cada tentativa.
- Os 3 tipos (treino, nutricao, mindset) passarao pelo mesmo pipeline: gerar -> validar -> corrigir automaticamente -> auditar.
- Nenhuma alteracao no banco de dados. Os dados de auditoria continuam no campo `audit_result` (JSONB) da tabela `protocolos`.
- Os prompts de treino e nutricao ja estao completos e nao precisam de alteracao. Apenas o pipeline de validacao do mindset precisa ser nivelado.
