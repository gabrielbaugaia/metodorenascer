

## Reels Admin v2 — IA gera nome + descrição + grupo muscular, e gestão pós-publicação

Expande o sistema de Reels com 3 melhorias: a IA passa a gerar pacote completo (título + descrição + grupos musculares), grupo muscular vira seleção múltipla com lista pré-definida (não mais texto livre), e os vídeos já publicados ganham gestão completa (editar, ativar/desativar, excluir) na própria página de admin.

### O que muda

**1. IA gera pacote completo (não só título)**

Quando o admin clica em "Reescrever com IA" (no card individual ou no botão em lote), a IA agora retorna 3 campos de uma vez:
- **Título** (até 60 caracteres) — como já é hoje
- **Descrição curta** (até 200 caracteres) explicando como executar/o que o vídeo mostra
- **Grupos musculares** (array) detectados nos frames

Esses 3 campos preenchem automaticamente o card. Se o toggle "Mostrar descrição" estiver desligado, a descrição é gerada e salva mesmo assim — só não aparece pro aluno.

**2. Grupo muscular: seleção múltipla com lista fixa**

O campo de texto livre vira um seletor de múltiplos grupos musculares com lista pré-definida (mesma usada no resto do sistema):
- Peito, Costas, Ombros, Bíceps, Tríceps, Antebraço
- Quadríceps, Posterior, Glúteos, Panturrilha, Adutores, Abdutores
- Abdômen, Lombar, Trapézio, Core, Cardio, Mobilidade, Alongamento, Corpo todo

Reuso o componente `MuscleGroupMultiSelect` que já existe em `src/components/admin/`. A IA também escolhe da mesma lista fixa (passada no system prompt) pra garantir consistência.

**3. Gestão de vídeos publicados na página `/admin/reels`**

Embaixo da área de upload, adiciono uma seção "Vídeos publicados" com listagem dos reels já no banco. Cada item mostra thumbnail + título + status, e tem 3 ações:

- **Editar** — abre modal com título, descrição, grupos musculares e categoria editáveis (mesmos campos do card de upload, sem o vídeo em si)
- **Ativar / Desativar** — toggle que altera campo `is_active` na tabela `reels_videos`. Vídeo desativado não aparece pro aluno mas fica salvo
- **Excluir** — confirmação dupla, remove o registro do banco e o arquivo do storage `reels-videos`

Filtros simples no topo da listagem: busca por título + filtro por categoria + filtro por ativos/inativos.

### Detalhes técnicos

**Banco de dados**
- Adicionar coluna `is_active boolean default true` na tabela `reels_videos` (migration)
- Mudar coluna `muscle_group text` para `muscle_groups text[]` (migration com conversão dos valores existentes em array de 1 elemento)
- Atualizar RLS: query do aluno passa a filtrar `is_active = true`

**Edge function**
- Renomear conceito da função `reels-suggest-title` para retornar pacote completo. Mantém o mesmo endpoint mas a tool call agora se chama `set_video_metadata` com 3 parâmetros: `title` (string), `description` (string ≤200), `muscle_groups` (array de strings da lista fixa)
- System prompt atualizado: além do título, gera descrição curta em pt-BR explicando execução/dica, e seleciona 1-3 grupos musculares da lista fixa fornecida no próprio prompt
- A lista fixa de grupos vira constante compartilhada em `supabase/functions/_shared/muscleGroups.ts` pra ser usada também na validação

**Frontend**
- `ReelCard.tsx`: substituir `<Input value={muscleGroup}>` pelo `MuscleGroupMultiSelect`. Trocar `muscleGroup: string` por `muscleGroups: string[]` no tipo `ReelDraft`
- `ReelsBatchUpload.tsx`: handler `handleSuggestTitle` recebe agora `{title, description, muscle_groups}` e atualiza os 3 campos do draft. Bulk handler idem. Se descrição vier preenchida, ativa automaticamente o toggle "Mostrar descrição" no card
- `AdminReels.tsx`: adicionar seção "Vídeos publicados" abaixo do upload. Componente novo `PublishedReelsList.tsx` faz o fetch + filtros + ações
- Componente novo `EditReelModal.tsx` reutilizando os mesmos inputs do `ReelCard` (sem o preview de upload)
- Página do aluno `Reels.tsx`: ajustar query pra filtrar `is_active = true` e ler `muscle_groups` (array) ao invés de `muscle_group` (string)

### Arquivos
- 1 migration (coluna `is_active`, conversão `muscle_group` → `muscle_groups[]`)
- Edge function editada: `supabase/functions/reels-suggest-title/index.ts` (retorna pacote completo)
- 1 arquivo novo: `supabase/functions/_shared/muscleGroups.ts`
- 2 componentes novos: `PublishedReelsList.tsx`, `EditReelModal.tsx`
- Edits: `ReelCard.tsx`, `ReelsBatchUpload.tsx`, `AdminReels.tsx`, `Reels.tsx` (página do aluno)

