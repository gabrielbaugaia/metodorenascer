
# MQO -- Laboratorio de Prescricao

Modulo completamente independente do fluxo Renascer, com branding, rota, logica e PDFs proprios.

---

## Fase 1: Infraestrutura de Banco de Dados

Quatro novas tabelas com RLS restrito a admins:

### Tabela `mqo_clients`
Perfil do cliente dentro do MQO (separado de `profiles`).

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid | Referencia ao profiles.id (opcional) |
| name | text | Nome do cliente |
| summary | text | Resumo gerado/editado |
| objectives | text | Objetivos detectados |
| strengths | text | Pontos fortes |
| attention_points | text | Pontos de atencao |
| suggested_strategy | text | Estrategia sugerida |
| trainer_direction | text | Direcionamento Tecnico do Treinador (campo prioritario) |
| created_at / updated_at | timestamptz | |

### Tabela `mqo_materials`
Arquivos enviados (metadados, URL no storage).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| client_id | uuid FK mqo_clients |
| file_name | text |
| file_url | text |
| file_type | text |
| file_size | integer |
| created_at | timestamptz |

### Tabela `mqo_protocols`
Protocolos gerados no MQO.

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| client_id | uuid FK mqo_clients |
| type | text (treino/dieta/mentalidade) |
| title | text |
| content | jsonb |
| status | text (rascunho/editado/publicado) |
| generation_options | jsonb |
| published_at | timestamptz |
| created_at / updated_at | timestamptz |

### Tabela `mqo_protocol_versions`
Historico de versoes para restauracao.

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| protocol_id | uuid FK mqo_protocols |
| version_number | integer |
| content | jsonb |
| status | text |
| created_at | timestamptz |

### Storage
- Novo bucket privado: `mqo-materials`

### RLS
- Todas as tabelas: somente `has_role(auth.uid(), 'admin')` para ALL.

---

## Fase 2: Edge Functions Independentes

### `mqo-analyze`
- Recebe IDs dos materiais enviados
- Usa Lovable AI (gemini-2.5-flash) para analisar PDFs/imagens via URLs
- Retorna: resumo, objetivos, pontos fortes, atencao, estrategia
- Requer role admin

### `mqo-generate-protocol`
- Recebe: tipo, dados do cliente, trainer_direction (campo prioritario), opcoes (frequencia, intensidade, considerar arquivos, etc.)
- Gera protocolo via Lovable AI com prompts independentes (nao reutiliza prompts do Renascer)
- O campo "Direcionamento Tecnico do Treinador" e inserido como instrucao prioritaria no system prompt
- Requer role admin

---

## Fase 3: Frontend -- Pagina /mqo

### Rota
- `/mqo` no App.tsx, protegida com AuthGuard + verificacao de admin interna

### Identidade Visual (aplicada SOMENTE neste modulo)
- Amarelo: `#FFC400`
- Preto: `#000000`
- Branco: `#FFFFFF`
- Zero laranja, zero logo/nome Renascer
- Classes Tailwind customizadas inline (sem poluir o tema global)

### Layout da Pagina (componentes em `src/components/mqo/`)

```text
+------------------------------------------+
| MQO -- Laboratorio de Prescricao         |
+------------------------------------------+
| [Selecionar Cliente v]  [+ Novo Cliente] |
+------------------------------------------+
|                                          |
| SECAO 1: Upload de Materiais             |
| [Drag & Drop / Selecionar Arquivos]      |
| Lista de arquivos enviados               |
| [Enviar Material]  [Analisar Arquivos]   |
|                                          |
+------------------------------------------+
| SECAO 2: Analise + Edicao Manual         |
| Resumo do cliente        [editavel]      |
| Objetivos detectados     [editavel]      |
| Pontos fortes            [editavel]      |
| Pontos de atencao        [editavel]      |
| Estrategia sugerida      [editavel]      |
| ---------------------------------------- |
| DIRECIONAMENTO TECNICO   [campo grande]  |
| DO TREINADOR (prioritario)               |
+------------------------------------------+
| SECAO 3: Geracao de Protocolos           |
| Opcoes:                                  |
|  [x] Considerar arquivos enviados        |
|  [x] Priorizar obs. do treinador         |
|  Frequencia: [3x/sem v]                  |
|  Intensidade: [Moderada v]               |
| [Gerar Treino] [Gerar Dieta]            |
| [Gerar Mentalidade] [Gerar Completo]     |
+------------------------------------------+
| SECAO 4: Editor Pos-Geracao              |
| Tabs: Treino | Dieta | Mentalidade      |
| Editor completo (todos campos editaveis) |
+------------------------------------------+
| SECAO 5: Versionamento                   |
| Versao atual: Rascunho                   |
| Historico: v1, v2, v3...                 |
| [Restaurar v1]                           |
+------------------------------------------+
| SECAO 6: Publicacao                      |
| [Baixar PDF MQO] [Publicar p/ cliente]   |
+------------------------------------------+
```

### Componentes a criar

| Componente | Responsabilidade |
|---|---|
| `MqoPage.tsx` | Pagina principal /mqo |
| `MqoLayout.tsx` | Wrapper com branding MQO |
| `MqoClientSelector.tsx` | Selecao/criacao de cliente |
| `MqoMaterialUpload.tsx` | Upload e listagem de arquivos |
| `MqoAnalysisPanel.tsx` | Analise IA + edicao manual |
| `MqoProtocolGenerator.tsx` | Opcoes e botoes de geracao |
| `MqoProtocolEditor.tsx` | Editor completo pos-geracao |
| `MqoVersionHistory.tsx` | Versionamento e restauracao |
| `MqoPublishPanel.tsx` | Publicacao e download PDF |

---

## Fase 4: PDF com Branding MQO

### Novo arquivo: `src/lib/generateMqoProtocolPdf.ts`

Totalmente independente de `generateProtocolPdf.ts`.

- Cabecalho: fundo preto, texto "MQO -- Metodologia de Qualificacao Operacional" em branco, detalhe amarelo `#FFC400`
- Titulos de secao: fundo amarelo, texto preto
- Linhas divisorias: amarelas
- Fundo geral: branco
- Rodape em todas as paginas: "Documento tecnico gerado pelo sistema MQO | Uso profissional -- confidencial"
- Zero referencia a "Renascer", "Gabriel Bau" ou laranja

---

## Fase 5: Publicacao para o Cliente

O botao "Publicar para o cliente" faz:
1. Salva o protocolo com status `publicado`
2. Cria versao no historico
3. Se o cliente tem `profile_id` vinculado, insere na tabela `protocolos` existente (para aparecer no app do aluno)
4. Toast de confirmacao

---

## O que NAO muda

- Nenhuma alteracao no fluxo Renascer existente
- Nenhuma alteracao em PDFs existentes
- Nenhuma alteracao em cores/tema global
- Nenhuma alteracao nas edge functions existentes (generate-protocol permanece intacta)

---

## Sequencia de Implementacao

1. Migracoes SQL (tabelas + bucket + RLS)
2. Edge functions `mqo-analyze` e `mqo-generate-protocol`
3. Componentes frontend MQO
4. Pagina `/mqo` + rota no App.tsx
5. PDF MQO independente
6. Fluxo de publicacao

## Secao Tecnica

- Todas as tabelas usam `has_role(auth.uid(), 'admin')` -- somente o treinador acessa
- Edge functions validam JWT + role admin antes de processar
- Arquivos vao para bucket `mqo-materials` (privado, RLS admin-only)
- AI usa Lovable AI gateway (`google/gemini-2.5-flash`) -- sem API key adicional necessaria
- Prompts sao 100% independentes dos prompts Renascer
- O campo `trainer_direction` e injetado como `### INSTRUCAO PRIORITARIA DO TREINADOR ###` no system prompt da IA
