## Objetivo

Substituir a home `/` (hoje `LandingApp.tsx` curta V2) por uma nova experiência editorial premium — referência Apple/Porsche/Whoop/Oura, modo escuro luxuoso, foco em transformação e na autoridade do Gabriel Baú. A tecnologia é mecanismo, não herói.

A `LandingApp.tsx` atual será preservada em `/landing-app` para fallback. `/landing-classica` (Index antigo) e `/quiz` permanecem intactos.

## Estrutura de rotas

- `/` → **novo** `LandingPremium.tsx` (esta entrega)
- `/landing-app` → LandingApp atual (preservada)
- `/landing-classica` → Index antigo
- `/quiz` → Quiz Renascer (CTA de diagnóstico aponta para `#planos`, conforme decisão)

## Design system isolado

Criar **`landing-premium`** como namespace de estilos isolado (não toca no V2/Luxury Dark existente nem no Quiz):

- Paleta exata: `#0B0B0B` (bg), `#161616` (surface), `#F5F5F5` (text), `#A7A7A7` (muted), `#FF5A1F` (accent)
- Tipografia: heading display serif/sans cinematográfica (testar **Fraunces** ou **Instrument Serif** para títulos editoriais + **Inter Tight** para corpo). Tamanhos massivos (clamp 80–160px nos H1).
- Eyebrow/labels em mono uppercase letter-spaced (`Space Mono`, já carregado).
- Variáveis em `index.css` sob escopo `.landing-premium { --lp-bg, --lp-surface, --lp-text, --lp-muted, --lp-accent }`. Nada vaza global.
- Whitespace generoso: padding vertical mínimo 160px desktop / 96px mobile entre seções.
- Sem emojis, sem ícones cartoon, sem cards SaaS repetitivos, sem tabela comparativa.

## Componentes a criar

Todos sob `src/components/landing-premium/`:

```
LPHero.tsx              Section 01 — full screen, partículas sutis, foto Gabriel, dual CTA
LPProblem.tsx           Section 02 — split screen Caos/Direção, reveal on scroll
LPMentor.tsx            Section 03 — retrato editorial grande do Gabriel
LPPillars.tsx           Section 04 — timeline vertical 01→05, sticky scroll
LPDashboard.tsx         Section 05 — mockup dashboard premium (Sono/Treino/Recup/Nutr/Consist)
LPTransformations.tsx   Section 06 — antes/depois editorial (Alan + outros)
LPIdentity.tsx          Section 07 — 3 cards de identidade grandes (não-pricing)
LPPlans.tsx             Section 08 — 3 planos Essencial/Pro/Elite, Pro destacado
LPDiagnostic.tsx        Section 09 — diagnóstico gratuito + mockup visual
LPFaq.tsx               Section 10 — accordion minimalista estilo Apple
LPClosing.tsx           Final — manifesto cinematográfico + CTA
LPHeader.tsx            Header transparente, blur no scroll, CTA primário
LPFooter.tsx            Footer minimal
LPStickyMobileCTA.tsx   Mobile only, sticky bottom bar
LPParticles.tsx         Partículas canvas sutis para o hero
```

Página: `src/pages/LandingPremium.tsx` agregando tudo + `useEffect` para SEO title/meta.

## Comportamento e motion

- Reveal on scroll via `useScrollAnimation` (já existe) + IntersectionObserver
- Pilares (Sec 04): sticky left index `01–05`, conteúdo grande à direita rola e troca o ativo
- Problema (Sec 02): clip-path animado revelando o lado "Direção" sobre o "Caos" conforme scroll
- Hero: partículas em `<canvas>` (60fps, desliga em `prefers-reduced-motion`), glow radial laranja sutil
- Transições cinematográficas: fades longos (700–1000ms), easing customizado, sem bounce
- Cursor glow desktop reaproveitado do padrão V2

## Conteúdo e CTAs

- Headline hero: "PARE DE RECOMEÇAR."
- CTA primário "COMEÇAR MEU DIAGNÓSTICO" → âncora `#planos` (conforme decisão)
- CTA secundário "COMO FUNCIONA" → âncora `#sistema` (Sec 05)
- Social proof bar: +15 anos · +1000 alunos · Método baseado em ciência
- Planos: reusar `STRIPE_PRICE_IDS` de `src/lib/planConstants.ts` e fluxo de checkout atual do `V2PricingSection` (criar `create-checkout` igual). Essencial R$97 · Pro R$297 (destacado) · Elite R$697. Foco em outcome, não em features.
- Fotos: reaproveitar imagens de `src/components/landing/MentorSection.tsx` (Gabriel) e `TransformationsGallery` (Alan etc.). Sem placeholders.
- Diagnóstico (Sec 09): CTA leva para `#planos` (mesmo target do hero, conforme decisão); manter mockup visual sem ícone de escudo.

## Mobile-first

- Todas as seções pensadas em 390px primeiro
- Tipografia escala com `clamp()`
- `LPStickyMobileCTA` fixo bottom com "COMEÇAR DIAGNÓSTICO" (visível após scroll do hero)
- Pilares viram lista vertical full-width no mobile (sem sticky)
- Dashboard mockup vira stack vertical

## Arquivos alterados

- **Novo**: `src/pages/LandingPremium.tsx` + 15 componentes em `src/components/landing-premium/`
- **Novo**: bloco `.landing-premium` em `src/index.css` com tokens isolados e fontes (`@import` Fraunces + Inter Tight via Google Fonts)
- **Editado**: `src/App.tsx` — `/` aponta para `LandingPremium`; `LandingApp` movido para `/landing-app`
- **Editado**: `mem://index.md` — Core atualizado refletindo nova home + nova entrada `landing/premium-redesign`

## Fora de escopo

- Mudar Quiz, Auth, Renascer, Admin, edge functions
- Refatorar V2/Luxury Dark existente (fica como `/landing-app`)
- Novas fotos via IA (usaremos as existentes)
- Nova integração de checkout (reusa a atual)
- i18n / tema claro
