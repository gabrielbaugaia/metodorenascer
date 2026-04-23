

## Reels Admin v6 — Infinite scroll com sentinela IntersectionObserver

Substituir o botão "Carregar mais 48" por carregamento automático ao rolar, mantendo o botão "Carregar todos os restantes" como atalho opcional e a contagem real "X de 197".

### Comportamento

- Ao chegar a ~400px do fim da grid, dispara `loadMore()` automaticamente sem clique
- Indicador visual no rodapé enquanto carrega: spinner + "Carregando mais 48…"
- Mensagem final permanece: "Todos os 197 vídeos carregados"
- Botão **"Carregar todos os restantes"** continua disponível ao lado do indicador (útil para preparar seleção global em poucos cliques sem rolar 197)
- Contador "Mostrando N de 197" persiste no header da seção (já existe)

### Implementação técnica

Em `src/pages/admin/AdminReels.tsx`:

1. **Sentinela DOM**: criar `<div ref={sentinelRef} />` logo abaixo da grid de cards publicados, antes do bloco de rodapé.

2. **Hook IntersectionObserver** dentro de `useEffect`:
   - Observa `sentinelRef.current` com `rootMargin: "400px"` e `threshold: 0`
   - Quando `entry.isIntersecting === true` E `!loadingMore` E `!loading` E `reels.length < total`, chama `loadMore()`
   - Cleanup: `observer.disconnect()` no return do effect
   - Dependências: `[loadingMore, loading, reels.length, total]`

3. **Guards adicionais em `loadMore`**:
   - Já tem `if (loadingMore || loading) return` 
   - Adicionar `if (reels.length >= total) return` pra evitar disparo duplicado quando o observer reage antes do estado atualizar

4. **Substituir o bloco JSX atual** (linhas 1002-1026):
   - Remover o `<Button>` "Carregar mais N"
   - Manter sentinela + indicador de loading inline (spinner + texto) quando `loadingMore`
   - Manter o `<Button variant="ghost">` "Carregar todos os restantes" como secundário
   - Mensagem "Todos carregados" permanece igual

5. **Reset do observer ao trocar filtros**: já é automático, pois `load()` é chamado com `append=false` quando filtros mudam, o que reseta `reels` e o observer dispara naturalmente se a nova lista couber e ainda houver mais.

### Edge cases tratados

- **Filtros que retornam <48 resultados**: `reels.length >= total` impede disparo
- **Tela grande sem scroll**: `rootMargin: 400px` faz a sentinela aparecer no viewport inicial → dispara `loadMore` automaticamente até preencher (comportamento desejado)
- **Carregar todos**: ao clicar, `reels.length >= total` vira true e o observer para de disparar
- **Performance**: observer é único, criado uma vez por mudança de dependências; sem listeners de scroll manuais

### Arquivos editados

- `src/pages/admin/AdminReels.tsx` — adicionar `sentinelRef`, `useEffect` do IntersectionObserver, refatorar JSX do rodapé da grid

**Sem mudanças em:** banco, RLS, edge functions, paginação backend (continua `range` de 48), `EditReelModal`, `ReelCard`, `ReelsBatchUpload`, página do aluno.

