

## Reels Admin v7 — Forçar atualização do PWA no celular

### Diagnóstico

O código de `/admin/reels` **já tem todas as melhorias pedidas**: toolbar de 4 ícones (Editar/IA/Ativar/Excluir) sempre visível em cada card, seleção em lote, infinite scroll com paginação real, IA individual e em lote, modal de edição com IA. Verifiquei linha por linha em `src/pages/admin/AdminReels.tsx` (linhas 908-1023) e tudo está implementado.

**O problema é cache do PWA no celular.** As screenshots mostram uma versão antiga: overlay enorme "Ocultar / Excluir" sobreposto ao card (esse overlay nem existe mais no código atual). O Service Worker `public/sw.js` está em `v6` e o iPhone do usuário está servindo o JS/HTML antigo do cache, ignorando o build novo.

### Correções

**1. Bump do Service Worker (`public/sw.js`)**
- Trocar `CACHE_NAME` de `'renascer-cache-v6'` para `'renascer-cache-v7'`
- Atualizar comentários e o `postMessage` `version: 'v7'`
- Isso dispara o ciclo `install → activate → clients.claim → SW_UPDATED` que força reload em todos os dispositivos com o app aberto

**2. Banner "Atualização disponível" (App.tsx ou ClientLayout)**
- Listener para `navigator.serviceWorker.addEventListener('message', ...)` capturando `type: 'SW_UPDATED'`
- Quando recebido, mostrar um toast persistente com botão **"Atualizar agora"** que faz `window.location.reload()`
- Garante que mesmo quem não fechar o app pega a versão nova

**3. Botão manual "Forçar atualização" no header admin (`AdminReels.tsx`)**
- Pequeno botão "↻ Atualizar app" ao lado do título da página
- Handler que: (a) `caches.keys()` + `caches.delete()` para todos os caches, (b) chama `registration.unregister()` no SW, (c) `window.location.reload(true)`
- Solução de emergência se o ciclo automático falhar (acontece em iOS com PWA salvo na home)

**4. Verificação visual após o reload**
- Depois do bump, o usuário verá em `/admin/reels` no celular:
  - Cards com 4 ícones embaixo (Editar, ✨ IA, 👁/🚫, 🗑) sempre visíveis
  - Checkbox no canto superior direito de cada card
  - Barra de seleção em lote ao marcar 1+ vídeos
  - Infinite scroll dos 197 vídeos
  - Modal de edição com botões IA dentro

### Arquivos editados

- `public/sw.js` — bump v6 → v7
- `src/App.tsx` — listener de `SW_UPDATED` com toast "Atualizar agora"
- `src/pages/admin/AdminReels.tsx` — botão "Forçar atualização" no header

**Sem mudanças em:** lógica de admin (já está completa), banco, RLS, edge functions, página do aluno (`/videos`).

### O que o usuário precisa fazer depois do deploy

1. No celular, fechar o app completamente (swipe up no app)
2. Reabrir — o novo SW vai instalar e mostrar toast "Atualizar agora"
3. Tocar em "Atualizar agora" OU fechar e reabrir mais uma vez
4. Se ainda assim ver a tela antiga, ir em `/admin/reels` e tocar no botão "↻ Atualizar app" no header

