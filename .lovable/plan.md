

# Corrigir Reset de Pagina ao Voltar para o Site (Tab Switch)

## Problema

Quando o aluno sai do site (troca de aba, abre outro app no celular) e volta, a tela mostra "Carregando" e reinicia na pagina inicial, perdendo onde estava (treino, dieta, renascer, etc.). Isso acontece porque:

1. O Supabase faz refresh do token automaticamente quando a aba fica visivel novamente, disparando `onAuthStateChange`
2. O `useAuth` reseta `loading = true` temporariamente a cada evento de auth
3. O `SubscriptionGuard` depende de 5 estados de loading separados -- qualquer um que volte a `true` mostra a tela de carregamento
4. O `useSubscription` re-chama a funcao `check-subscription` no backend toda vez que o token muda
5. O React Query refaz todas as queries automaticamente ao focar a janela (comportamento padrao)

O resultado: ao voltar, tudo recalcula do zero e o usuario ve um flash de loading + perde a pagina atual.

## Solucao

Quatro ajustes cirurgicos que eliminam o reset sem mudar nenhuma logica de negocio:

---

### 1. useAuth -- Nao resetar loading apos a primeira autenticacao

**Arquivo:** `src/hooks/useAuth.tsx`

Atualmente, o `onAuthStateChange` chama `setLoading(false)` em todo evento, mas o problema e que durante o refresh de token, o estado pode piscar. A correcao e: apos o primeiro carregamento bem-sucedido, nunca mais setar `loading = true`. Usar um `useRef` para marcar que ja inicializou.

Mudanca:
- Adicionar `const initialized = useRef(false)`
- No `onAuthStateChange`: se ja inicializou, atualizar `user` e `session` sem mudar `loading`
- No `getSession` inicial: marcar `initialized.current = true` apos completar

---

### 2. QueryClient -- Desativar refetch automatico ao focar janela

**Arquivo:** `src/App.tsx`

O React Query por padrao refaz todas as queries quando a janela ganha foco. Isso causa re-fetch desnecessario de subscription, entitlements, score, etc.

Mudanca:
- Configurar `new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 } } })`
- Isso mantem os dados em cache por 5 minutos sem re-buscar ao trocar de aba

---

### 3. useSubscription -- Nao re-chamar edge function em token refresh

**Arquivo:** `src/hooks/useSubscription.ts`

O `useEffect` dispara `checkSubscription()` toda vez que `session?.access_token` muda. Quando o Supabase faz token refresh, gera um novo token e re-dispara a funcao. Correcao: usar um ref para marcar que ja checou e pular re-checks automaticos.

Mudanca:
- Adicionar `const checkedRef = useRef(false)`
- No `useEffect`: so chamar `checkSubscription()` se `checkedRef.current === false`
- Resetar `checkedRef` apenas quando o `user.id` realmente muda (login/logout)

---

### 4. SubscriptionGuard -- Cache do resultado de acesso verificado

**Arquivo:** `src/components/auth/SubscriptionGuard.tsx`

Mesmo com os fixes acima, o guard tem 5 hooks que fazem loading independente. Adicionar um `useRef` que marca "acesso ja verificado" para nao mostrar loader em re-renders subsequentes.

Mudanca:
- Adicionar `const accessVerified = useRef(false)`
- Quando todos os loadings terminam e o usuario tem acesso, marcar `accessVerified.current = true`
- Na condicao de render: se `accessVerified.current === true` e `user` ainda existe, renderizar children direto (sem loader)
- Resetar o ref apenas se o `user.id` mudar

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|--------|
| `src/hooks/useAuth.tsx` | useRef para evitar reset de loading apos inicializacao |
| `src/App.tsx` | QueryClient com `refetchOnWindowFocus: false` e `staleTime: 5min` |
| `src/hooks/useSubscription.ts` | Ref para evitar re-check em token refresh |
| `src/components/auth/SubscriptionGuard.tsx` | Cache de acesso verificado via useRef |

## O que NAO sera alterado

- Nenhuma logica de redirecionamento (auth, admin, blocked)
- Nenhuma rota ou guard removido
- O check de subscription continua funcionando no primeiro load e apos login
- Logout continua resetando tudo normalmente

## Resultado Esperado

- Aluno abre `/treino`, troca para outro app, volta: continua em `/treino`
- Aluno registra dados no Renascer, troca de aba, volta: dados permanecem
- Login/logout continua funcionando normalmente
- Subscription check continua preciso (roda no primeiro acesso)

