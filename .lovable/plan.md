

## Ações em lote no upload de Reels

Adiciona dois botões no topo da tela de upload em lote (`/admin/reels`) que aplicam a IA e a remoção de áudio em **todos os vídeos da fila de uma vez**, sem precisar clicar card por card.

### O que muda

No componente `src/components/admin/ReelsBatchUpload.tsx`, acima da grid de cards, aparece uma nova barra de ações em lote (só visível quando há ≥2 vídeos na fila e nenhum upload em andamento):

- **✨ Reescrever todos os títulos com IA** — roda a sugestão de título sequencialmente em todos os cards (3 frames → Gemini → novo título). Mostra progresso "Processando 3 de 8…" e desabilita os outros botões enquanto roda. Se um card falhar, segue pro próximo e ao final mostra toast resumindo (ex: "7 títulos atualizados, 1 falhou").
- **🔇 Remover áudio de todos** — aplica `stripAudio()` em paralelo (limite de 2 simultâneos pra não travar o navegador) em todos os vídeos que ainda não tiveram áudio removido. Marca o toggle "Remover áudio" como ativo em cada card processado e substitui o arquivo na fila pelo blob sem áudio. Barra de progresso global "5 de 8 processados".

Os botões individuais por card continuam existindo — esses novos só são um atalho pro lote inteiro.

### Detalhes técnicos

- Reuso direto das funções já existentes: `captureKeyFrames` + edge function `reels-suggest-title` pra IA, e `stripAudio` de `reelsVideoUtils.ts` pra áudio.
- Estado novo no `ReelsBatchUpload`: `bulkAiRunning`, `bulkStripRunning`, contadores de progresso.
- Concorrência: IA roda 1 por vez (a edge function já é pesada); áudio roda 2 por vez via `Promise.all` em chunks.
- Os botões ficam desabilitados se: fila vazia, upload em andamento, ou outra ação em lote rodando.
- Toasts de sucesso/falha agregados ao final, não um por card.

### Arquivos
- **Editado**: `src/components/admin/ReelsBatchUpload.tsx` — adiciona barra de ações em lote + 2 handlers (`handleBulkRewriteTitles`, `handleBulkStripAudio`).

Nenhuma migration, edge function nova ou alteração de banco — só frontend reaproveitando o que já existe.

