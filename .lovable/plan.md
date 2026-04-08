

# Plano: Entrada manual de protocolo de treino com IA para transcrição automática

## Objetivo
Permitir que o admin cole ou escreva um protocolo de treino manualmente (ou anexe imagem/PDF) e a IA transcreva automaticamente para o formato estruturado do sistema, puxando GIFs e subindo o treino na hora.

## Como funciona

```text
Admin abre protocolo do aluno → Aba "Gerar Novo" (já existe) + Nova aba "Entrada Manual"
                                                                    │
                                    ┌───────────────────────────────┘
                                    ▼
                          Textarea para colar/escrever protocolo
                          + Upload de imagem/PDF
                                    │
                                    ▼
                          Botão "Processar com IA"
                                    │
                                    ▼
                    Edge Function transcreve → JSON estruturado
                    (exercícios, séries, reps, dicas, GIFs)
                                    │
                                    ▼
                         Salva como protocolo ativo
                         Cliente vê imediatamente
```

## Alterações

### 1. Nova Edge Function `transcribe-manual-protocol`
- Recebe: texto livre e/ou imagem base64 / URL do storage
- Usa Lovable AI (gemini-3-flash-preview) para extrair exercícios no formato JSON do sistema (`TrainingContentNew`)
- Consulta tabela `exercise_gifs` para auto-vincular GIFs por nome do exercício
- Retorna JSON estruturado pronto para salvar na tabela `protocolos`

### 2. Novo componente `ManualProtocolInput.tsx` (em `src/components/admin/`)
- Tabs internas: "Escrever" | "Anexar"
- **Escrever**: Textarea grande para colar/digitar protocolo livre (nome, séries, reps, instruções)
- **Anexar**: Upload de imagem (foto de treino escrito) ou PDF — armazena no bucket `mqo-materials` e envia para a IA
- Campo de orientações adicionais para a IA (ex: "foco em hipertrofia", "aluno intermediário")
- Botão "Processar com IA" que chama a edge function
- Após processar: insere o protocolo no banco como ativo e fecha o modal / atualiza a lista

### 3. Integrar no `ProtocolEditor.tsx`
- Ao lado do botão "Gerar Novo Protocolo", adicionar botão "Entrada Manual"
- Ao clicar, abre o `ManualProtocolInput` como uma seção expansível (mesmo padrão do `showRegenerateInput`)

### 4. Integrar também no `AdminPlanos.tsx`
- Na aba de Treino, ao lado do "Gerar Novo Protocolo de Treino", adicionar botão "Entrada Manual"
- Usa o mesmo componente `ManualProtocolInput`

## Arquivos
- **Novo**: `supabase/functions/transcribe-manual-protocol/index.ts`
- **Novo**: `src/components/admin/ManualProtocolInput.tsx`
- **Editar**: `src/components/admin/ProtocolEditor.tsx` — adicionar botão + seção manual
- **Editar**: `src/pages/admin/AdminPlanos.tsx` — adicionar botão de entrada manual na aba treino

