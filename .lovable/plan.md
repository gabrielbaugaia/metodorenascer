# Sincronizar botões da landing com Stripe (Essencial / PRO / Elite)

## Objetivo
Ao clicar em "Começar Essencial / Começar PRO / Falar com Baú" na seção de planos da home (`LPPlans`), abrir o Stripe Checkout em nova aba (guest checkout permitido). CTAs secundários (#planos) continuam rolando.

## Passo 1 — Criar 3 produtos/preços no Stripe (recurring mensal, BRL)
- Essencial — R$ 97,00/mês
- PRO — R$ 297,00/mês
- Elite — R$ 697,00/mês

Os novos `price_id` serão registrados nos arquivos abaixo.

## Passo 2 — Registrar price_ids no código
**`src/lib/planConstants.ts`**: adicionar bloco `LANDING_PRICE_IDS` com chaves `essencial | pro | elite`.

**`supabase/functions/_shared/priceMappings.ts`**: adicionar os 3 novos price_ids em `PRICE_TO_PLAN`, `PRICE_TO_MRR` e `VALID_PRICE_IDS` (`type: "essencial" | "pro" | "elite"`).

**`supabase/functions/create-checkout/index.ts`**: adicionar os 3 price_ids ao array `VALID_PRICE_IDS`. Nenhuma outra mudança — o fluxo guest já está suportado.

## Passo 3 — Plugar botões na landing
**`src/components/landing-premium/LPSections.tsx`** — `LPPlans`:
- Trocar `<a href={p.href}>` por `<button onClick={...}>` que chama `supabase.functions.invoke("create-checkout", { body: { price_id, utm_data } })` e faz `window.open(url, "_blank")`.
- Adicionar `slug` em cada item de `PLANS` (`essencial | pro | elite`) para mapear ao price_id.
- Estado `loading` por card, toast de erro com `sonner`.
- Reaproveitar UTM via `sessionStorage` (padrão já existente do projeto).

## Passo 4 — Não mexer
- Hero "Começar agora", Closing e Sticky Mobile continuam com `href="#planos"` (rolagem).
- Header "Entrar" continua indo para `/auth`.
- Diagnóstico continua indo para `/quiz`.

## Detalhes técnicos
- Edge function `create-checkout` já existe, suporta guest, retorna `{ url }`.
- Após pagamento, Stripe redireciona para `/checkout-success?session_id=…` (já existente, dispara `complete-guest-checkout` que cria conta + senha temporária).
- Sem necessidade de migrations.
