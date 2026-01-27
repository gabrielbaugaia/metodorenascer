
# Plano: Resolver Cache e Garantir Sincronização do Deploy

## Problema Identificado

O site publicado em `metodo.renascerapp.com.br` não reflete as alterações feitas no projeto devido a:

1. **Service Worker desatualizado**: O `CACHE_NAME` ainda está como `'renascer-cache-v1'` quando deveria ser `'renascer-cache-v2'` para forçar limpeza de cache
2. **Cache do navegador**: Usuários com cache antigo continuam vendo versão antiga

---

## Solução

### 1. Atualizar versão do Service Worker

**Arquivo**: `public/sw.js`

```typescript
// DE:
const CACHE_NAME = 'renascer-cache-v1';

// PARA:
const CACHE_NAME = 'renascer-cache-v3';
```

Incrementar para `v3` (não `v2` como estava na memória) para garantir que TODOS os caches antigos sejam limpos.

---

### 2. Adicionar meta tag para controle de cache

**Arquivo**: `index.html`

Adicionar no `<head>`:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

Isso instrui navegadores a não cachear o HTML principal, garantindo que sempre busquem a versão mais recente.

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `public/sw.js` | Atualizar `CACHE_NAME` para `'renascer-cache-v3'` |
| `index.html` | Adicionar meta tags de controle de cache |

---

## Fluxo de Deploy

Após aprovar este plano:
1. As alterações serão aplicadas ao código
2. Você deve clicar em **"Publish"** no editor (botão no canto superior direito)
3. Aguardar alguns segundos para o deploy completar
4. Acessar `metodo.renascerapp.com.br` e fazer **Ctrl+Shift+R** (hard refresh) para forçar nova versão

---

## Resultado Esperado

- O Service Worker com nova versão (`v3`) irá automaticamente limpar caches antigos (`v1` e `v2`)
- Novos usuários receberão a versão atualizada imediatamente
- Usuários existentes receberão a atualização na próxima visita quando o SW ativar
- Meta tags previnem cache excessivo do HTML principal
