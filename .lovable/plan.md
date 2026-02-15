
# Converter Pagina /oferta para "7 Dias Gratis"

## O Que Muda

A pagina `/oferta` atual vende o Plano Inicial a R$49,90/mes com checkout direto. Sera convertida para uma pagina focada no **trial de 7 dias gratis**, usando o link Stripe Trial ja existente (`https://buy.stripe.com/9B67sKeMW4ru2sp7Gy2B201`). A pessoa cadastra o cartao e tem 7 dias gratis antes de ser cobrada.

---

## Alteracoes no `src/pages/Oferta.tsx`

### 1. Checkout -- Trocar para link Stripe Trial

Substituir a chamada `create-checkout` pelo redirecionamento direto ao link Stripe Trial:

```text
De:  supabase.functions.invoke("create-checkout", { body: { price_id: "..." } })
Para: window.open("https://buy.stripe.com/9B67sKeMW4ru2sp7Gy2B201", "_blank")
```

Isso simplifica o fluxo e usa o mesmo link Trial que ja funciona em PricingSection, UpgradeModal e Assinatura.

### 2. Captura UTM automatica

Ao carregar a pagina, capturar os parametros UTM da URL (utm_source, utm_medium, utm_content, fbclid) e salvar no `sessionStorage` para rastreamento. Reutilizar funcoes existentes de `useAnalytics`.

### 3. Textos -- Reescrever para foco em Trial

| Secao | Atual | Novo |
|---|---|---|
| Hero H1 | "PARE DE TENTAR SOZINHO." | "TESTE 7 DIAS GRATIS." |
| Hero subtitulo | "COMECE HOJE COM ACOMPANHAMENTO REAL POR R$49,90." | "Experimente o Metodo Renascer sem compromisso. Cancele quando quiser." |
| CTA principal | "Quero comecar agora por R$49,90" | "Comecar meus 7 dias gratis" |
| Badges | "Acesso imediato / Sem fidelidade / Cancele quando quiser" | "7 dias gratis / Sem compromisso / Cancele antes e nao paga nada" |
| Card de preco titulo | "Plano Inicial" | "7 Dias Gratis" |
| Card de preco valor | "R$49,90 /mes" | "R$0 por 7 dias" + subtexto "Depois R$49,90/mes" |
| Card CTA | "Comecar agora" | "Ativar meus 7 dias gratis" |
| Card rodape | "Cancele quando quiser. Sem surpresas." | "Cancele antes dos 7 dias e nao paga nada." |
| CTA final | "Quero comecar por R$49,90/mes" | "Quero meus 7 dias gratis" |
| Problema | manter | manter |
| Incluido | manter | manter |
| Para quem e/nao e | manter | manter |
| Como funciona | Step 1: "Assine" | Step 1: "Ative seu trial" com descricao "Cadastre seu cartao e comece gratis" |
| FAQ | adicionar | Nova pergunta: "Vou ser cobrado nos 7 dias gratis?" -> "Nao. Se cancelar antes do termino do periodo, nao sera cobrado." |

### 4. Secao do Card de Preco -- Destaque visual

- Adicionar badge "GRATIS" acima do card
- Texto principal: "R$0" em destaque grande
- Subtexto: "por 7 dias, depois R$49,90/mes"
- Borda laranja no card (border-orange-500) para destaque

### 5. Footer -- atualizar ano

De "2025" para "2026"

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/pages/Oferta.tsx` | Reescrever textos, trocar checkout para link Trial, adicionar captura UTM |

Nenhum arquivo novo necessario. Nenhuma alteracao no banco de dados.
