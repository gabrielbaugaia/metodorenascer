

## Reels Admin v5 — paginação real, "carregar mais" e edição rápida individual

Três problemas resolvidos: (1) só aparecem 50 vídeos dos 197 que existem, (2) selecionar/editar individualmente está confuso (ações escondidas no hover), (3) edição rápida com IA por vídeo único só existia via "reescrever em lote de 1".

### 1. Paginação real — ver e gerenciar todos os 197 vídeos

Hoje a query trava em `range(0, 49)`. Mudanças:

- Trocar `PAGE_SIZE` para **48** por página (múltiplo da grid 2/3/4/6 colunas) e adicionar suporte a paginação cumulativa
- Buscar `count: 'exact'` na query pra mostrar contador real ("Mostrando 48 de 197")
- Botão **"Carregar mais 48"** abaixo da grid que faz append do próximo lote (não substitui)
- Quando todos foram carregados, botão some e mostra "Todos os 197 vídeos carregados"
- Botão extra **"Carregar todos"** ao lado, que puxa o restante de uma vez (até 1000) — útil pra ações em lote globais
- Filtros (busca/categoria/status/ordenação) resetam pra página 0 automaticamente

### 2. "Selecionar todos" agora cobre a base inteira, não só a tela

Hoje `toggleSelectAll` só seleciona o que está visível na tela. Adicionar:

- Botão **"Selecionar todos os 197"** ao lado do "Selecionar todos da página"
- Ele faz uma query separada só com IDs (`select id`) usando os mesmos filtros aplicados, sem `range`
- Mostra toast "197 vídeos selecionados" e marca todos no `selectedIds`
- Mesma barra de ações em lote já existente passa a operar sobre todos

### 3. Ações individuais sempre visíveis (não só no hover)

Hoje os botões "Editar / Ativar / Excluir" só aparecem ao passar o mouse. No mobile (430px viewport, sem hover) isso fica inacessível. Mudanças no card:

- Remover o overlay `opacity-0 group-hover:opacity-100`
- Adicionar embaixo da thumb uma **mini-toolbar sempre visível** com 4 ícone-botões compactos:
  - ✏️ **Editar** (abre `EditReelModal` — já tem todos os campos: título, descrição, grupos, categoria, toggle mostrar)
  - ✨ **IA** (botão novo) — baixa o vídeo, captura frames, chama `reels-suggest-title` (full mode), atualiza o registro. Mostra spinner no botão durante o processo. Toast "Atualizado pela IA"
  - 👁/🚫 **Ativar/Desativar** (toggle visual rápido)
  - 🗑 **Excluir** (com confirmação)
- Ícones com `h-3.5 w-3.5`, padding mínimo, tooltip no hover, layout `flex justify-between` ou grid de 4 colunas

### 4. Modal de edição: adicionar botões de IA dentro

No `EditReelModal.tsx`, adicionar acima do título 2 botões:
- **"Reescrever tudo com IA"** — preenche título + descrição + grupos automaticamente nos campos do form (admin ainda confirma com Salvar)
- **"Gerar só descrição"** — preenche só o textarea de descrição

Assim o admin abre o modal de qualquer vídeo, pode rodar IA, ajustar manualmente o que quiser, e salvar. Fluxo de edição individual completo num único lugar.

### Detalhes técnicos

**Arquivos editados:**
- `src/pages/admin/AdminReels.tsx`:
  - Estado `page: number`, `total: number`, `loadingMore: boolean`
  - `load()` aceita `append: boolean` e usa `.range(page * PAGE_SIZE, (page+1)*PAGE_SIZE - 1)` + `select(..., { count: 'exact' })`
  - `loadMore()` incrementa `page` e faz append
  - `loadAll()` busca o restante até total
  - `selectAllGlobal()` faz query separada de IDs
  - Card refatorado: remover overlay, adicionar toolbar inline, novo handler `handleSingleAi(reel)` reusando lógica do bulk

- `src/components/admin/EditReelModal.tsx`:
  - Adicionar prop opcional `videoUrl?: string` (pra IA poder baixar e processar)
  - Estado `aiBusy: 'full' | 'desc' | null`
  - 2 botões no topo do modal + handlers `handleAiFull` e `handleAiDesc` que preenchem os campos do form (não salvam direto)

**Sem mudanças em:** banco, RLS (já permite admin ler tudo), edge function, página do aluno, `ReelsBatchUpload`, `ReelCard` (esse é só do upload).

