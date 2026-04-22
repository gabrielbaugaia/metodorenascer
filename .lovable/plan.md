

## Nova área "Reels" — vídeos curtos verticais com IA

Cria uma área completamente nova de vídeos no formato vertical (estilo Reels), separada dos GIFs e do banco de YouTube atual. Inclui upload em lote, IA pra reescrever título a partir dos frames do vídeo, opção de remover áudio, e descrição curta opcional por vídeo.

### O que muda

**Admin** — nova rota `/admin/reels`:
- Botão **"Adicionar em lote"** (drag-and-drop de múltiplos vídeos verticais .mp4/.mov)
- Cada vídeo, durante upload, vira um card com:
  - Preview vertical 9:16
  - Campo **Título** (editável) + botão ✨ **"Reescrever com IA"** (analisa os primeiros frames do vídeo via Gemini Vision e sugere um nome)
  - Toggle **"Remover áudio"** (processa o vídeo no servidor com ffmpeg e regrava sem trilha de áudio)
  - Toggle **"Mostrar descrição"** + campo de descrição curta (até 200 caracteres) que só aparece pro aluno se o toggle estiver ativo
  - Categoria (Execução / Dica / Explicativo) e grupo muscular
- Lista de Reels já cadastrados com filtros, busca, editar e excluir
- Barra de progresso global do lote (X de Y enviados)

**Aluno** — nova aba **"Vídeos"** no menu lateral (ícone Play), rota `/videos`:
- Feed vertical estilo Reels (scroll-snap full-screen no mobile, grid 9:16 no desktop)
- Filtros por categoria e grupo muscular
- Quando o admin marcou "mostrar descrição", aparece overlay no rodapé do vídeo
- **Não toca em GIFs nem no `/admin/videos` (YouTube) atuais** — fica como um plus à parte

### Arquitetura técnica

**Banco** — nova migration:
- Tabela `reels_videos`: `id`, `title`, `description`, `show_description bool`, `category` (execucao/dica/explicativo), `muscle_group`, `video_url`, `thumbnail_url`, `duration_seconds`, `audio_removed bool`, `original_filename`, `file_size_bytes`, `created_by`, `created_at`, `updated_at`
- RLS: admin gerencia tudo; alunos autenticados com SELECT em `is_published = true`
- Bucket público novo `reels-videos` para os arquivos finais

**Edge functions** (3 novas):
- `reels-suggest-title` — recebe URL do vídeo, extrai 3 frames (início/meio/fim) e manda pra `google/gemini-2.5-pro` com tool calling pra retornar título sugerido em português
- `reels-strip-audio` — recebe path do bucket, baixa, processa com ffmpeg-wasm pra remover áudio, sobe versão muda e retorna nova URL
- `reels-generate-thumbnail` — extrai primeiro frame como JPEG pra thumb da listagem

**Frontend**:
- `src/pages/admin/AdminReels.tsx` — página principal com grid + modal de upload em lote
- `src/components/admin/ReelsBatchUpload.tsx` — dropzone, fila de upload com progresso individual, ações IA por card
- `src/components/admin/ReelCard.tsx` — card editável (título, toggles, descrição)
- `src/pages/Reels.tsx` — feed do aluno (scroll-snap vertical)
- Rota nova em `App.tsx` (admin guard pra `/admin/reels`, subscription guard pra `/videos`)
- Item novo no `ClientSidebar.tsx` ("Vídeos") e no admin sidebar ("Reels")

### Validações
- Tipos aceitos: `video/mp4`, `video/quicktime`, `video/webm`
- Tamanho máximo: 100MB por vídeo
- Aviso visual se vídeo não for vertical (proporção > 1)
- Limite de 10 vídeos em paralelo no upload em lote pra não estourar memória

### Arquivos
- 1 migration (tabela `reels_videos` + bucket `reels-videos` + RLS)
- 3 edge functions novas
- 4 arquivos React novos (AdminReels, Reels, ReelsBatchUpload, ReelCard)
- Edits leves: `App.tsx` (rotas), `ClientSidebar.tsx`, `AdminDashboard.tsx` (card de acesso)

