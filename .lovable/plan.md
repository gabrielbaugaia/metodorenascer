

# Levantamento Final: Padronização do Domínio metodo.renascerapp.com.br

## Resumo Executivo

O projeto está atualmente usando múltiplos domínios em diferentes partes do código, causando inconsistências e potenciais erros de CORS, redirecionamento e integração. Este plano consolida **todas** as alterações necessárias para padronizar o domínio oficial `metodo.renascerapp.com.br`.

---

## Inventário de URLs Encontradas

| Local | URL Atual | URL Correta |
|-------|-----------|-------------|
| CORS (cors.ts) | ✅ Já inclui metodo.renascerapp.com.br | OK |
| create-checkout (fallback) | `https://renascerapp.com.br` | `https://metodo.renascerapp.com.br` |
| customer-portal (fallback) | `https://lxdosmjenbaugmhyfanx.lovableproject.com` | `https://metodo.renascerapp.com.br` |
| send-password-reset (redirectTo) | `https://metodorenascer.lovable.app/redefinir-senha` | `https://metodo.renascerapp.com.br/redefinir-senha` |
| send-invitation (baseUrl) | `https://renascerapp.com.br` | `https://metodo.renascerapp.com.br` |
| index.html (canonical) | `https://www.renascerapp.com.br/` | `https://metodo.renascerapp.com.br/` |

---

## Alterações Necessárias

### 1. Edge Functions (Backend)

#### 1.1 `supabase/functions/create-checkout/index.ts`
**Linha 192** - Atualizar fallback origin:
```typescript
// DE:
const origin = req.headers.get("origin") || "https://renascerapp.com.br";

// PARA:
const origin = req.headers.get("origin") || "https://metodo.renascerapp.com.br";
```

#### 1.2 `supabase/functions/customer-portal/index.ts`
**Linha 52** - Atualizar fallback origin:
```typescript
// DE:
const origin = req.headers.get("origin") || "https://lxdosmjenbaugmhyfanx.lovableproject.com";

// PARA:
const origin = req.headers.get("origin") || "https://metodo.renascerapp.com.br";
```

#### 1.3 `supabase/functions/send-password-reset/index.ts`
**Linha 107** - Atualizar redirectTo:
```typescript
// DE:
redirectTo: 'https://metodorenascer.lovable.app/redefinir-senha',

// PARA:
redirectTo: 'https://metodo.renascerapp.com.br/redefinir-senha',
```

#### 1.4 `supabase/functions/send-invitation/index.ts`
**Linha 128** - Atualizar baseUrl:
```typescript
// DE:
const baseUrl = "https://renascerapp.com.br";

// PARA:
const baseUrl = "https://metodo.renascerapp.com.br";
```

---

### 2. Frontend (SEO e Meta Tags)

#### 2.1 `index.html`
**Linha 32** - Atualizar canonical:
```html
<!-- DE: -->
<link rel="canonical" href="https://www.renascerapp.com.br/" />

<!-- PARA: -->
<link rel="canonical" href="https://metodo.renascerapp.com.br/" />
```

---

### 3. Configurações Externas (Não são arquivos do projeto)

Estas configurações precisam ser feitas manualmente nos dashboards externos:

#### 3.1 Stripe Dashboard
- **Webhook URL**: Já está correto apontando para `https://lxdosmjenbaugmhyfanx.supabase.co/functions/v1/stripe-webhook`
- **Verificar**: Os URLs de success/cancel usam o header `origin` da request, então funcionarão automaticamente após as alterações acima

#### 3.2 Supabase Auth (Dashboard)
O Supabase Auth precisa ter o domínio `metodo.renascerapp.com.br` na lista de **Redirect URLs** permitidos. Isso garante que:
- Links de recuperação de senha funcionem
- OAuth (se usado) redirecione corretamente
- Tokens de confirmação de email funcionem

**Ação necessária**: Acessar Cloud > Auth Settings e verificar/adicionar:
- `https://metodo.renascerapp.com.br/**`
- `https://metodo.renascerapp.com.br/redefinir-senha`
- `https://metodo.renascerapp.com.br/auth`

---

## Resumo das Alterações por Arquivo

| Arquivo | Tipo | Linhas Afetadas |
|---------|------|-----------------|
| `supabase/functions/create-checkout/index.ts` | Modificação | 192 |
| `supabase/functions/customer-portal/index.ts` | Modificação | 52 |
| `supabase/functions/send-password-reset/index.ts` | Modificação | 107 |
| `supabase/functions/send-invitation/index.ts` | Modificação | 128 |
| `index.html` | Modificação | 32 |

---

## Verificação Pós-Implementação

### Checklist de Testes:
1. **Checkout Stripe**: Testar compra guest e logado - verificar redirecionamento para `/checkout-success`
2. **Portal do Cliente**: Testar botão "Gerenciar Assinatura" - deve abrir Stripe e retornar para `/dashboard`
3. **Recuperação de Senha**: Testar "Esqueci minha senha" - link no email deve apontar para `metodo.renascerapp.com.br/redefinir-senha`
4. **Convites**: Enviar convite pelo admin - link deve apontar para `metodo.renascerapp.com.br/auth`
5. **SEO**: Verificar se o canonical está correto na página inicial

---

## O que JÁ está Correto

- **CORS (`cors.ts`)**: Já inclui `metodo.renascerapp.com.br` e `www.metodo.renascerapp.com.br`
- **Emails (Resend)**: Todos partem de `noreply@renascerapp.com.br` ✅
- **Blog/BlogPost**: Usam `window.location.origin` dinamicamente ✅
- **Frontend (supabase client)**: Usa variáveis de ambiente, não URLs hardcoded ✅

---

## Impacto das Alterações

- **Zero downtime**: Alterações são retrocompatíveis
- **CORS**: Já configurado para aceitar o novo domínio
- **Emails**: Continuarão funcionando (apenas links dentro dos emails mudam)
- **Stripe**: Continuará funcionando (usa header origin dinamicamente)

