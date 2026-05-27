
# Nova Landing Curta — Método Renascer App

## Objetivo
Substituir o Quiz como rota raiz (`/`) por uma **landing page curta, objetiva e de alta conversão**, focada no app. O Quiz continua disponível como caminho opcional ("Descobrir meu perfil em 60s") para quem prefere ser diagnosticado antes de decidir.

## Roteamento

| Rota | Hoje | Depois |
|---|---|---|
| `/` | Quiz | **Nova LandingApp** (curta) |
| `/quiz` | — | Quiz Renascer (atual, intacto) |
| `/landing-classica` | Index antigo | mantém |
| `/v2` | LandingV2 luxury | mantém |
| `/auth`, `/entrar` | Auth | mantém |

CTAs primários da nova landing → `#planos` (na própria página) ou `/auth` (já é cliente).
CTA secundário → `/quiz` ("Não sei por onde começar — fazer diagnóstico de 60s").

## Estrutura da página (mobile-first, ~7 seções enxutas)

Estilo: **Luxury Dark V2** já existente (Bebas Neue + DM Sans + Space Mono, #FF6500, fundo #050609). Reaproveita tokens e componentes de `src/components/landing-v2/`.

```text
┌─────────────────────────────────────┐
│ 1. HERO                             │
│    Headline forte + subheadline     │
│    [Começar agora] [Fazer quiz 60s] │
│    Mockup do app (1 imagem)         │
├─────────────────────────────────────┤
│ 2. PARA QUEM É (3 bullets curtos)   │
├─────────────────────────────────────┤
│ 3. O QUE O APP FAZ (4 cards)        │
│    Treino IA · Nutrição · Mental ·  │
│    SIS Score / Inteligência         │
├─────────────────────────────────────┤
│ 4. COMO FUNCIONA (3 passos)         │
│    Anamnese → Protocolo → Evolução  │
├─────────────────────────────────────┤
│ 5. PROVA (1 depoimento + métricas)  │
├─────────────────────────────────────┤
│ 6. PLANOS (#planos) — 3 tiers       │
│    Essencial 97 · PRO 297 · Elite   │
├─────────────────────────────────────┤
│ 7. FAQ enxuto (5 perguntas) + CTA   │
│    final + faixa de garantia 7d     │
└─────────────────────────────────────┘
```

Total estimado: **~5 minutos de leitura, scroll curto**, contra os 9 steps do quiz.

## Conteúdo-chave (rascunho)

- **Headline:** "Seu corpo, seu protocolo. Calculado todo dia."
- **Sub:** "App de prescrição física, nutricional e mental que se adapta aos seus dados reais — não a um plano genérico."
- **CTAs hero:**
  - Primário laranja: **Começar agora →** (rola para `#planos`)
  - Secundário ghost: **Fazer diagnóstico de 60s** → `/quiz`
- **Bloco "Para quem é":** executivos/profissionais 30+ que já tentaram academia, app genérico e nutricionista isolados e querem um sistema único guiado por dados.
- **4 cards de feature:** Treino adaptado por HRV/sono · Nutrição com foto da refeição · Mindset diário · SIS Score (inteligência de performance).
- **Como funciona:** 1) Anamnese 10 min → 2) Protocolo personalizado em 24h → 3) Ajustes mensais via IA + coach.
- **Planos:** reaproveita `STRIPE_PRICE_IDS` de `planConstants.ts` (Essencial R$97 · PRO R$297 · Elite R$697). CTA cada card → checkout Stripe (mesmo fluxo do `/v2`).
- **FAQ:** 5 perguntas (cancelamento, garantia, dispositivos, prazo de resultado, suporte).
- **Garantia:** faixa "7 dias — devolução integral".

## Arquivos a criar

- `src/pages/LandingApp.tsx` — orquestra as 7 seções
- `src/components/landing-app/LandingAppHero.tsx`
- `src/components/landing-app/LandingAppForWho.tsx`
- `src/components/landing-app/LandingAppFeatures.tsx`
- `src/components/landing-app/LandingAppHowItWorks.tsx`
- `src/components/landing-app/LandingAppSocialProof.tsx`
- `src/components/landing-app/LandingAppPricing.tsx` (pode reaproveitar `V2PricingSection` se o estilo couber)
- `src/components/landing-app/LandingAppFAQ.tsx`
- `src/components/landing-app/LandingAppFooter.tsx` (ou reusar `V2Footer`)

## Arquivos a editar

- `src/App.tsx`:
  - `<Route path="/" element={<LandingApp />} />`
  - `<Route path="/quiz" element={<Quiz />} />` (nova rota)
- `src/hooks/usePageTracking.ts`: mapear `/` → `landing_app` e `/quiz` → `quiz_renascer`.
- Memory `mem://landing/quiz-funnel-as-home`: atualizar para refletir que `/` agora é a landing curta e quiz vive em `/quiz`.

## Fora de escopo

- Não mexer em `/v2`, `/landing-classica`, no funil do quiz em si, nem nos planos/Stripe.
- Sem novo backend, sem novas tabelas.
- Sem mudanças no `/auth` ou no fluxo de checkout existente.

## Perguntas rápidas antes de implementar

1. **Estilo visual:** seguir o Luxury Dark V2 (Bebas/DM Sans/laranja #FF6500, igual `/v2`), ou criar identidade própria mais limpa?
2. **Planos na landing:** mostrar os 3 tiers (Essencial/PRO/Elite) como `/v2` faz, ou só 1 CTA único "Ver planos" levando para `/assinatura`?
3. **Quiz como CTA secundário:** texto preferido — "Fazer diagnóstico de 60s", "Descobrir meu perfil", ou outro?
4. **Posição do quiz:** só no hero, ou repetir também no final (antes do FAQ) como segunda chance pra quem ainda não decidiu?
