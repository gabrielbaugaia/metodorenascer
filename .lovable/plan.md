

# Correção do fluxo pós-pagamento + acesso imediato

## Problemas identificados

1. **Build error**: `ErrorBoundary.tsx` usa `process.env.NODE_ENV` que não existe no Vite — trocar por `import.meta.env.DEV`.

2. **`finalize-checkout` não sincroniza entitlements**: A função atualiza a tabela `subscriptions` mas **não chama** `syncEntitlement` nem atualiza a tabela `entitlements`. Resultado: o cliente paga, a subscription é criada, mas o sistema de permissões ainda mostra `none`.

3. **Checkout de guest frágil**: O auto-login depende do webhook ter processado antes do redirect. Se o webhook atrasa (comum), o cliente cai no `/auth` sem saber a senha provisória.

4. **Credenciais nunca são exibidas ao cliente**: Se o auto-login falha, não há como o cliente saber a senha provisória gerada.

## Solução

### 1. Fix build error (`ErrorBoundary.tsx`)
Trocar `process.env.NODE_ENV === 'development'` por `import.meta.env.DEV`.

### 2. Fix `finalize-checkout` — sincronizar entitlements
Após o upsert na tabela `subscriptions`, adicionar upsert na tabela `entitlements` com `access_level: 'full'` (ou `trial_limited` para trialing). Isso garante que mesmo se o webhook falhar, o acesso é liberado imediatamente pelo `finalize-checkout` chamado na página de sucesso.

### 3. Melhorar `CheckoutSuccess` — fallback com credenciais visíveis
Quando o auto-login do guest falhar:
- Mostrar na tela o email e a senha provisória retornados pelo `complete-guest-checkout`
- Botão "Copiar senha" e "Ir para Login" para que o cliente consiga acessar manualmente
- Retry automático do `finalize-checkout` a cada 3s (até 5 tentativas) para cobrir atrasos do webhook

### 4. Enviar email com credenciais (edge function `send-welcome-credentials`)
Nova edge function que envia email via Resend com:
- Email de boas-vindas
- Senha provisória
- Link direto para o login
- Chamada pelo webhook no `checkout.session.completed` quando cria guest user

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/ErrorBoundary.tsx` | Fix `process.env` → `import.meta.env.DEV` |
| `supabase/functions/finalize-checkout/index.ts` | Adicionar sync de entitlements após upsert |
| `src/pages/CheckoutSuccess.tsx` | Mostrar credenciais como fallback, retry automático |
| `supabase/functions/send-welcome-credentials/index.ts` | Nova função para enviar email com senha provisória |
| `supabase/functions/stripe-webhook/index.ts` | Chamar `send-welcome-credentials` após criar guest user |

