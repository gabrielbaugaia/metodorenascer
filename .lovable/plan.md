

## Reels Admin v4 — preview fiel, botão de descrição sempre visível, edição em lote dos publicados

Três ajustes complementando o que já está em produção:

### 1. Preview da descrição idêntico ao do aluno

No `ReelCard.tsx`, o preview hoje está num mini-quadro 9:16 separado, com fundo escuro e texto `text-[10px]`. A página `/reels` do aluno usa overlay `bg-gradient-to-t from-background/95 to-transparent p-3` com texto `text-xs line-clamp-3` **diretamente sobre o player do próprio card**, sem quadro extra.

Refatoração:
- Remover o mini-preview separado
- Aplicar o mesmo overlay (gradient + `p-3` + `text-xs line-clamp-3`) **sobre o vídeo de preview principal** que já fica à esquerda do card (área 180px / aspect 9:16)
- O overlay aparece quando `showDescription = true` e `description` tem texto, replicando exatamente o JSX do `ReelTile` em `Reels.tsx` (mesmas classes Tailwind)
- Garante 1:1 visual com o que o aluno vê

### 2. Botão "Gerar descrição" sempre visível no card

Hoje o botão "Gerar descrição" está dentro do bloco condicional `{draft.showDescription && (...)}` (linha 172 do `ReelCard.tsx`). Resultado: pra reexecutar a descrição o admin precisa primeiro ligar o toggle.

Mover o botão pra fora do bloco condicional, ao lado do botão "Reescrever com IA" (no header do título). Assim:
- Sempre visível (linha de ações no topo do form: `[Reescrever com IA] [Gerar descrição]`)
- Ao clicar com toggle desligado, gera a descrição E ativa automaticamente o `showDescription` (handler já faz isso)
- O textarea + preview continuam aparecendo só quando o toggle está ligado

### 3. Edição em lote dos vídeos publicados

Esta é a parte nova e maior. Na grid "Vídeos publicados" do `AdminReels.tsx`, adicionar seleção múltipla + barra de ações em lote.

**UI:**
- Cada card ganha um `Checkbox` no canto superior direito (sempre visível, não só no hover)
- Quando 1+ vídeos estão selecionados, aparece uma barra fixa no topo da grid com: contador "N selecionados", botão "Limpar seleção", e os botões de ação em lote
- Botão "Selecionar todos" / "Desmarcar todos" ao lado dos filtros

**Ações em lote disponíveis:**
- **🪄 Reescrever com IA (todos)** — para cada vídeo selecionado: baixa o arquivo do storage, captura 3 frames, chama `reels-suggest-title` (modo full), e atualiza `title`, `description`, `muscle_groups` no banco. Mostra progresso "3 de 8…"
- **📝 Gerar descrição (todos)** — igual acima mas com `mode: "description_only"`, atualiza só `description` e ativa `show_description`
- **💪 Definir grupos musculares** — abre popover com `MuscleGroupMultiSelect` + 2 opções: "Substituir" (sobrescreve) ou "Adicionar" (merge sem duplicar). Aplica a todos os selecionados via `update`
- **👁 Ativar / 🚫 Desativar** — toggle `is_published` em massa
- **🗑 Excluir** — confirmação dupla, remove registros + arquivos do storage em paralelo (limite 3 simultâneos)

**Detalhe técnico do "IA em lote nos publicados":**
Diferente do upload (onde o `File` está em memória), aqui os vídeos já estão no storage. Pra capturar frames preciso baixar primeiro:
- Função helper `fetchVideoAsFile(url)` faz `fetch` + `blob()` + `new File()` 
- Usa esse File com `captureKeyFrames` que já existe em `reelsVideoUtils.ts`
- Roda sequencial (1 por vez) pra não estourar memória nem rate limit da IA
- Toast agregado no fim ("7 atualizados, 1 falhou")
- Cada update vai direto ao Supabase via `.update().eq('id', ...)` — não precisa edge function nova

### Detalhes técnicos

**Arquivos editados:**
- `src/components/admin/ReelCard.tsx` — mover botão "Gerar descrição" pra fora do toggle, refatorar preview pra usar overlay no player principal (mesmas classes do `ReelTile`)
- `src/pages/admin/AdminReels.tsx` — adicionar `selectedIds: Set<string>`, checkbox em cada card, barra de ações em lote, handlers (`handleBulkDelete`, `handleBulkTogglePublish`, `handleBulkSetMuscles`, `handleBulkRewriteAi`, `handleBulkGenerateDescAi`)

**Arquivo novo:**
- Nenhum — a barra de ações em lote vai inline no `AdminReels.tsx` (umas 80 linhas a mais). Se ficar muito grande, posso extrair pra `BulkReelsActionsBar.tsx` numa próxima iteração.

**Sem mudanças em:** banco, edge function, RLS, página do aluno, `EditReelModal`, `MuscleGroupMultiSelect`, `ReelsBatchUpload`.

