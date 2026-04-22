

## Reels Admin v3 — ordenação, preview, RLS e geração granular

Quatro melhorias sobre a tela `/admin/reels`: ordenação persistente da lista de publicados, preview da descrição no card de upload, hardening da query/RLS, e botão dedicado pra reexecutar só a descrição via IA.

### 1. Ordenação persistente em "Vídeos publicados"

No componente da listagem (dentro de `AdminReels.tsx` ou `PublishedReelsList.tsx`), adiciono ao lado dos filtros existentes um `<Select>` "Ordenar por" com 4 opções:
- Mais recentes (created_at desc) — padrão
- Mais antigos (created_at asc)
- Título A-Z (title asc)
- Título Z-A (title desc)

O critério é persistido em `localStorage` sob a chave `reels-admin-sort` e reaplicado quando o admin troca qualquer filtro (busca, categoria, status). A query `.order(...)` no Supabase usa o critério escolhido. Trocar filtro NÃO reseta a ordenação.

### 2. Preview da descrição no card de upload

No `ReelCard.tsx`, quando o toggle "Mostrar descrição" está ligado E há texto na descrição, aparece embaixo do textarea um bloco de preview que simula como o aluno vai ver: fundo escuro semi-transparente, texto branco, mesma tipografia/tamanho usados na página `/reels` do aluno (linha de até 2 linhas truncadas, padding 12px, posicionado como overlay no rodapé do vídeo).

O preview é puramente visual (não afeta o upload) e some quando o toggle é desligado. Replica os mesmos estilos do componente atual de exibição em `Reels.tsx` pra ser fiel.

### 3. RLS e hardening da query de listagem

Auditoria + ajuste da query `select` na lista de publicados:

- **RLS**: confirmar que a tabela `reels_videos` tem policy `SELECT` restrita a `has_role(auth.uid(), 'admin')` pra esta listagem (admin vê todos, inclusive `is_published = false`). Se faltar policy explícita de admin SELECT, criar via migration.
- **Query**: usar `.select('id, title, description, video_url, thumbnail_url, category, muscle_groups, is_published, created_at, duration_seconds')` (campos explícitos, não `*`), com filtros aplicados server-side via `.ilike('title', ...)`, `.eq('category', ...)`, `.eq('is_published', ...)`, e `.order(...)` conforme escolha. Paginação com `.range(0, 49)` (50 por página) pra não estourar.
- **Defesa em profundidade**: o componente envolve a query num `try/catch` e mostra estado de erro distinto se RLS bloquear (mensagem clara "Sem permissão" em vez de lista vazia silenciosa).

### 4. Botão "Gerar descrição" separado

Hoje o botão "Reescrever com IA" sobrescreve título + descrição + grupos musculares. Adicionar um segundo botão **"Gerar descrição"** (ícone `FileText`) tanto no `ReelCard` (ao lado do botão atual) quanto na barra de ações em lote no `ReelsBatchUpload`.

Comportamento:
- Reusa a mesma edge function `reels-suggest-title`, mas com novo parâmetro `mode: 'description_only'` no body
- Edge function condicionalmente atualiza o system prompt pra retornar apenas o campo `description` na tool call (título e grupos viram opcionais e são ignorados quando `mode = 'description_only'`)
- No frontend, o handler `handleGenerateDescription` aplica só `description` no draft, preservando título e `muscle_groups` atuais
- Versão em lote roda sequencial igual ao botão atual, com toast agregado

### Detalhes técnicos

**Arquivos editados**
- `src/pages/admin/AdminReels.tsx` ou `PublishedReelsList.tsx` — Select de ordenação + persistência localStorage + query refinada
- `src/components/admin/ReelCard.tsx` — bloco de preview da descrição + segundo botão "Gerar descrição"
- `src/components/admin/ReelsBatchUpload.tsx` — botão "Gerar descrição em lote" + handler `handleBulkGenerateDescription`
- `supabase/functions/reels-suggest-title/index.ts` — aceitar `mode: 'description_only' | 'full'` (default `full`), ajustar system prompt e tool schema condicionalmente

**Migration (condicional)**
- Só se a auditoria mostrar que falta policy SELECT explícita pra admin em `reels_videos`. Caso contrário, sem migration.

**Sem mudanças** em: schema do banco, lista de grupos musculares, tipos do `ReelDraft` (a não ser ajuste mínimo), página do aluno `Reels.tsx`.

