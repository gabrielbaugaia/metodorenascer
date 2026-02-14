
# Modo Auditor de Prescricao (Admin Only)

Sistema de auditoria automatica que valida qualidade, seguranca e coerencia dos protocolos de treino e mindset antes da liberacao.

---

## Visao Geral

O auditor sera implementado como uma camada de validacao integrada ao fluxo de geracao de protocolos (tanto no fluxo Renascer quanto no MQO), executada por IA apos a geracao do protocolo. O resultado da auditoria e armazenado junto ao protocolo e visivel apenas para admins.

---

## Fase 1: Estrutura de Dados

### Adicionar coluna na tabela `protocolos`

| Coluna | Tipo | Default |
|---|---|---|
| audit_result | jsonb | null |

### Adicionar coluna na tabela `mqo_protocols`

| Coluna | Tipo | Default |
|---|---|---|
| audit_result | jsonb | null |

### Formato do `audit_result` (jsonb)

```text
{
  "coherence_anamnese": true/false,
  "coherence_objective": true/false,
  "restriction_respect": true/false,
  "weekly_volume": true/false,
  "muscle_distribution": true/false,
  "progression_defined": true/false,
  "instruction_clarity": true/false,
  "mindset_quality": true/false,
  "safety_score": true/false,
  "final_score": 88,
  "classification": "Muito bom",
  "issues": ["lista de problemas encontrados"],
  "corrections_applied": ["lista de correcoes automaticas"],
  "audited_at": "ISO timestamp"
}
```

---

## Fase 2: Edge Function `audit-prescription`

Nova edge function dedicada que recebe o protocolo gerado + dados do cliente (anamnese) e executa a auditoria via IA.

### Fluxo

1. Recebe: protocolo gerado (treino + mindset), dados da anamnese do cliente, tipo
2. Envia para a IA com prompt de auditoria especifico
3. IA retorna o objeto `prescription_audit` com os 9 criterios + score
4. Se score < 80: a IA recebe instrucoes de correcao e regenera o protocolo corrigido
5. Loop ate score >= 80 (maximo 2 tentativas de correcao)
6. Retorna o protocolo (possivelmente corrigido) + resultado da auditoria

### Criterios de avaliacao (9 itens, cada um vale ~11 pontos)

1. Coerencia com anamnese
2. Coerencia com objetivo
3. Respeito a restricoes/lesoes
4. Volume semanal adequado
5. Distribuicao de grupamentos musculares
6. Progressao definida (4 semanas)
7. Clareza das instrucoes
8. Qualidade do protocolo de mindset
9. Seguranca geral da prescricao

### Score final

- 90-100: Excelente
- 80-89: Muito bom
- 70-79: Aceitavel
- <70: Requer correcao automatica

---

## Fase 3: Integracao no Fluxo de Geracao

### Fluxo Renascer (`generate-protocol`)

Apos gerar e salvar o protocolo, chamar a auditoria automaticamente:

1. Protocolo de treino e gerado e salvo
2. Chama `audit-prescription` com os dados do protocolo + anamnese
3. Se score < 80, o protocolo e regenerado com as correcoes
4. O `audit_result` e salvo na coluna do protocolo
5. O protocolo final (possivelmente corrigido) e atualizado

### Fluxo MQO (`mqo-generate-protocol`)

Mesmo processo: apos gerar, auditar e corrigir se necessario.

---

## Fase 4: Frontend - Exibicao do Auditor (Admin Only)

### Componente `PrescriptionAuditPanel`

Exibido apenas quando `useAdminCheck().isAdmin === true`.

Mostra:
- Titulo "AUDITORIA INTERNA DE QUALIDADE"
- 9 criterios com icones de check verde ou X vermelho
- Score final XX/100 com badge de classificacao colorida
- Lista de problemas encontrados (se houver)
- Lista de correcoes aplicadas (se houver)

### Locais de exibicao

1. **Pagina de Treino do admin** (`AdminClienteDetalhes.tsx`): ao visualizar protocolos de um cliente, mostrar o painel de auditoria abaixo de cada protocolo
2. **MQO Editor** (`MqoProtocolEditor.tsx`): mostrar auditoria de cada protocolo gerado no MQO

### Visibilidade

- Admin: mostra o painel completo de auditoria
- Aluno: componente NAO e renderizado (condicional via `useAdminCheck`)

---

## Fase 5: PDF com Auditoria (Apenas Admin)

### PDF do aluno (existente)

Nenhuma alteracao -- auditoria NAO aparece.

### PDF admin (novo parametro)

Adicionar parametro `includeAudit: boolean` nas funcoes de PDF:

- `generateProtocolPdf`: adicionar secao final "AUDITORIA INTERNA DE QUALIDADE" quando `includeAudit = true`
- `generateMqoProtocolPdf`: mesma logica

A secao de auditoria no PDF mostra:
- Tabela com os 9 criterios e status (Passou/Falhou)
- Score final
- Classificacao
- Observacoes

---

## Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `supabase/functions/audit-prescription/index.ts` | Edge function de auditoria com IA |
| `src/components/admin/PrescriptionAuditPanel.tsx` | Componente visual do auditor |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/generate-protocol/index.ts` | Chamar auditoria apos geracao, salvar audit_result |
| `supabase/functions/mqo-generate-protocol/index.ts` | Chamar auditoria apos geracao no MQO |
| `supabase/config.toml` | Registrar nova edge function |
| `src/pages/admin/AdminClienteDetalhes.tsx` | Exibir PrescriptionAuditPanel nos protocolos |
| `src/components/mqo/MqoProtocolEditor.tsx` | Exibir auditoria nos protocolos MQO |
| `src/lib/generateProtocolPdf.ts` | Adicionar secao de auditoria para PDFs admin |
| `src/lib/generateMqoProtocolPdf.ts` | Adicionar secao de auditoria para PDFs MQO admin |

## Migracao SQL

```text
ALTER TABLE protocolos ADD COLUMN audit_result jsonb DEFAULT null;
ALTER TABLE mqo_protocols ADD COLUMN audit_result jsonb DEFAULT null;
```

---

## Secao Tecnica

- A auditoria usa Lovable AI (`google/gemini-2.5-flash`) via tool calling para extrair o objeto estruturado de auditoria
- O prompt de auditoria e independente dos prompts de geracao
- A funcao `audit-prescription` valida JWT + role admin
- O loop de correcao tem limite de 2 tentativas para evitar loops infinitos
- Se apos 2 tentativas o score ainda for < 80, o protocolo e salvo com flag de alerta no audit_result
- A verificacao de admin no frontend usa `useAdminCheck` (consulta server-side via `user_roles`), nunca localStorage
- Nenhum dado de auditoria e exposto ao cliente via RLS (o campo `audit_result` so e lido por admins nas paginas admin)
