# Quero ver a página na prática antes de oficializar ela . Crie paralelo sem mudar a página inicial ainda .

&nbsp;

# Plano: Redesign Completo da Landing Page — Estilo Luxury Dark

O HTML enviado define um novo design system completo para a landing page com estética luxury/dark (sharp edges, sem border-radius, fontes Bebas Neue + DM Sans + Space Mono, cor principal #FF6500). O conteúdo muda radicalmente: sai a abordagem "consultoria fitness" e entra o posicionamento "sistema de inteligência em performance".

## Escopo da mudança

A landing page atual tem 11 seções. A nova tem 10 seções completamente diferentes em conteúdo e visual. Precisamos reescrever praticamente todos os componentes da landing.

**Importante**: O `PricingSection` atual tem lógica funcional (Stripe checkout, contagem de vagas Elite Fundador). A nova landing mostra 3 planos diferentes (Essencial R$97, PRO R$297, Elite R$697). Precisamos decidir se a lógica de checkout existente será mantida ou adaptada.

## Decisão necessária sobre Pricing

Os planos atuais no código são:

- Elite Fundador: R$49,90/mês (com Stripe links)
- Trimestral: R$497/3 meses
- Anual: R$997/ano

O HTML novo mostra:

- Essencial: R$97/mês
- PRO: R$297/mês (mais escolhido)
- Elite: R$697/mês

Isso é uma mudança de modelo de negócio. Os Stripe price IDs precisarão ser atualizados.

## Arquivos a criar/modificar


| Arquivo                                          | Ação                                                                                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                                     | Adicionar fontes Bebas Neue, DM Sans, Space Mono                                                                                                                                        |
| `src/index.css`                                  | Adicionar variáveis CSS do novo design (--font-d, --font-b, --font-m) + classes utilitárias (cursor-glow, reveal animations, scrollbar styling)                                         |
| `tailwind.config.ts`                             | Adicionar fontFamily para display (Bebas Neue), body (DM Sans), mono (Space Mono)                                                                                                       |
| `src/pages/Index.tsx`                            | Atualizar estrutura de seções + adicionar cursor glow effect                                                                                                                            |
| `src/components/Header.tsx`                      | Redesign completo: logo "RENASCER." com dot laranja, links mono uppercase, CTA "Ver Planos"                                                                                             |
| `src/components/landing/HeroSection.tsx`         | Reescrever: grid background, orange line, badge "Sistema Ativo", headline "SEU CORPO FALA", métricas flutuantes, scroll indicator                                                       |
| `src/components/landing/HowItWorksSection.tsx`   | Reescrever como "Flow Track" com 5 etapas (Coleta→Processo→Score→Prescrição→Alerta) e linha tracejada                                                                                   |
| `src/components/landing/SisScoreSection.tsx`     | **Novo** — Score dial SVG animado com 5 pilares (Mecânico, Recuperação, Cognitivo, Consistência, Nutrição) com barras de progresso                                                      |
| `src/components/landing/FeaturesGridSection.tsx` | **Novo** — Grid 3×2 dos 6 subsistemas (Score Diário, Prontidão, Fisiologia, Psicologia, Comportamento, Ciclo)                                                                           |
| `src/components/landing/DetectionSection.tsx`    | **Novo** — 4 cards de alertas de detecção precoce (Overtraining, Estresse Crônico, Fadiga Oculta, Burnout)                                                                              |
| `src/components/landing/PricingSection.tsx`      | Reescrever visual (manter lógica Stripe) com 3 planos verticais + tabela comparativa + badge "Mais Escolhido"                                                                           |
| `src/components/landing/GuaranteeStrip.tsx`      | **Novo** — Faixa de garantia/diagnóstico gratuito                                                                                                                                       |
| `src/components/landing/TestimonialsSection.tsx` | Reescrever como grid 3 colunas com quote marks e avatares                                                                                                                               |
| `src/components/landing/FAQSection.tsx`          | Reescrever como grid 2 colunas com 6 perguntas focadas no sistema                                                                                                                       |
| `src/components/landing/CTASection.tsx`          | Reescrever: "DADOS GERAM RESULTADO" com grid background                                                                                                                                 |
| `src/components/Footer.tsx`                      | Redesign com layout grid 2 colunas                                                                                                                                                      |
| Remover seções                                   | `MentorSection`, `WhatIsSection`, `MethodologySection`, `EvolutionSection`, `TransformationsGallery` — removidas do Index (arquivos mantidos para não quebrar imports em outros locais) |


## Detalhes técnicos

### Fontes

```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Tailwind config — novas famílias

```ts
fontFamily: {
  display: ['Bebas Neue', 'sans-serif'],
  body: ['DM Sans', 'sans-serif'],
  mono: ['Space Mono', 'monospace'],
}
```

### Score Dial — SVG animado

Círculo SVG com `stroke-dasharray` animado via Intersection Observer para criar efeito de preenchimento progressivo.

### Cursor Glow

Div fixa que segue o mouse com radial-gradient laranja sutil. Apenas desktop (hidden no mobile).

### Reveal animations

Classes `.reveal` com Intersection Observer para fade-in ao scroll, reut