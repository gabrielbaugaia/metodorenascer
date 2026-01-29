
# Plano: Impacto Visual e Clareza de Promessa — Landing Page

## Diagnóstico Atual

A página está com conteúdo bem estruturado, mas visualmente **flat**:

| Problema | Onde Ocorre | Impacto |
|----------|-------------|---------|
| Fundo uniforme (preto/section-dark) | Todas as seções | Sem ritmo visual, página monótona |
| Headlines com mesma escala | Hero vs outras seções | Sem hierarquia de importância |
| Headline atual fraca | HeroSection | "O Método Renascer." é declarativo mas não impactante |
| Pouco espaço em branco | Hero, seções | Elementos competindo por atenção |

---

## Implementação Proposta

### 1. Hero — Headline Dominante + Mais Espaço

**Alterações em `HeroSection.tsx`:**

**Headline:** "O Método Renascer." → **"Quando o corpo entra em ordem, tudo muda."**

**Subheadline:** 
"O Método Renascer foi criado para transformar físico, energia e disciplina com prescrição individual e acompanhamento contínuo."

**Reforço:** "Não é desafio. Não é treino genérico. É método."

**CTA:** "ENTRAR NO MÉTODO"

**Ajustes visuais:**
- Headline ainda maior: manter `text-8xl` mas com mais `letter-spacing`
- Subheadline visualmente menor (de `text-xl` para `text-lg md:text-xl`)
- Aumentar gap entre elementos para mais respiro
- Manter gradiente sutil já existente

---

### 2. Ritmo Visual — Alternância de Fundos

**Criar "capítulos visuais" com 3 tipos de fundo:**

| Seção | Fundo Atual | Fundo Proposto | Classe CSS |
|-------|-------------|----------------|------------|
| Hero | bg-background (preto) | bg-background | Manter |
| MentorSection | bg-background | bg-background | Manter |
| WhatIsSection | bg-background | **section-graphite** | Grafite escuro (novo) |
| MethodologySection | bg-background | bg-background | Manter |
| HowItWorksSection | section-dark | **section-light** | Off-white/cinza claro (novo) |
| TransformationsGallery | section-dark | section-dark | Manter |
| TestimonialsSection | bg-background | bg-background | Manter |
| EvolutionSection | section-dark | **section-graphite** | Grafite escuro |
| PricingSection | section-dark | section-dark | Manter |
| FAQSection | section-dark | bg-background | Alternar |
| CTASection | section-dark | section-dark | Manter |

**Novas classes CSS em `index.css`:**

```css
.section-graphite {
  background: hsl(0 0% 8%);
}

.section-light {
  background: hsl(0 0% 95%);
  color: hsl(0 0% 10%);
}

.section-light .text-foreground {
  color: hsl(0 0% 10%);
}

.section-light .text-muted-foreground {
  color: hsl(0 0% 40%);
}

.section-light .text-primary {
  color: hsl(16 100% 45%);
}
```

---

### 3. WhatIsSection — Texto Ajustado

**Alterações em `WhatIsSection.tsx`:**

**Texto atualizado:**
"O Método Renascer foi criado para quem entende que resultado não vem de motivação, mas de prescrição correta e execução consistente.
Treino, nutrição e mentalidade são definidos a partir do seu corpo, da sua rotina e do seu objetivo."

**Fundo:** Mudar de `bg-background` para `section-graphite`

---

### 4. MethodologySection — Textos Atualizados

**Alterações em `MethodologySection.tsx`:**

Manter layout e ícones, apenas ajustar descrições:

| Pilar | Descrição Atualizada |
|-------|---------------------|
| Análise Individual | Avaliação completa do seu perfil físico, histórico, rotina e objetivo para prescrever treino, nutrição e mentalidade de forma personalizada. |
| Treino Prescrito | Treino estruturado de acordo com seu nível, tempo disponível e capacidade de recuperação. Sem padrão genérico. |
| Nutrição + Receitas | Plano alimentar alinhado ao seu objetivo, com receitas inteligentes geradas por IA para facilitar a execução no dia a dia. |
| Mentalidade | Disciplina mental aplicada à rotina real, com acompanhamento contínuo e ajustes conforme sua evolução. |
| Consistência | Sistema que transforma execução diária em progresso real e mensurável. |

---

### 5. HowItWorksSection — Fundo Claro (Quebra de Padrão)

**Alterações em `HowItWorksSection.tsx`:**

**Fundo:** Mudar de `section-dark` para `section-light` (off-white)

**Efeito:** Cria ruptura visual, destaca a seção como "explicação prática" diferente das seções de impacto

**Ajustes de cor:**
- Texto principal: preto/cinza escuro
- Ícones: manter laranja (contrasta bem com fundo claro)
- Setas: manter laranja

---

### 6. EvolutionSection — Título Invertido

**Alterações em `EvolutionSection.tsx`:**

**Título:** "Você não fica sozinho no processo." → **"Evolução aqui não é achismo."**

**Texto:** "Check-ins, análises visuais, feedbacks e ajustes fazem parte do método. Você não fica sozinho no processo."

**Fundo:** Mudar para `section-graphite`

---

### 7. PricingSection — Garantia + CTAs

**Alterações em `PricingSection.tsx`:**

**Adicionar linha de garantia após subtítulo:**
"Não gostou? Devolvemos 100% do seu investimento."

**Planos já estão com textos corretos, apenas garantir:**
- Elite Fundador: CTA "ENTRAR NO MÉTODO"
- Trimestral: CTA "ASSUMIR O COMPROMISSO"  
- Anual: CTA "ENTRAR NO PROCESSO"

---

### 8. TransformationsGallery — CTA Ajustado

**Alterações em `TransformationsGallery.tsx`:**

**CTA:** "QUERO MINHA TRANSFORMAÇÃO" → "ENTRAR NO MÉTODO"

Manter consistência de linguagem.

---

## Ordem de Implementação

| Etapa | Arquivo | Tipo |
|-------|---------|------|
| 1 | `src/index.css` | Editar (adicionar classes de fundo) |
| 2 | `src/components/landing/HeroSection.tsx` | Editar (headline, subheadline, espaçamento) |
| 3 | `src/components/landing/WhatIsSection.tsx` | Editar (texto, fundo) |
| 4 | `src/components/landing/MethodologySection.tsx` | Editar (descrições) |
| 5 | `src/components/landing/HowItWorksSection.tsx` | Editar (fundo claro) |
| 6 | `src/components/landing/EvolutionSection.tsx` | Editar (título, fundo) |
| 7 | `src/components/landing/PricingSection.tsx` | Editar (garantia) |
| 8 | `src/components/landing/TransformationsGallery.tsx` | Editar (CTA) |
| 9 | `src/components/landing/FAQSection.tsx` | Editar (fundo alternado) |

---

## Resultado Visual Esperado

```text
┌─────────────────────────────────────┐
│ HERO                                │ ← Preto, headline massiva
├─────────────────────────────────────┤
│ MENTOR                              │ ← Preto
├─────────────────────────────────────┤
│ O QUE É                             │ ← Grafite (contraste sutil)
├─────────────────────────────────────┤
│ METODOLOGIA (5 pilares)             │ ← Preto
├─────────────────────────────────────┤
│ COMO FUNCIONA                       │ ← OFF-WHITE (quebra visual)
├─────────────────────────────────────┤
│ TRANSFORMAÇÕES                      │ ← Preto/gradiente
├─────────────────────────────────────┤
│ DEPOIMENTOS                         │ ← Preto
├─────────────────────────────────────┤
│ EVOLUÇÃO                            │ ← Grafite
├─────────────────────────────────────┤
│ PLANOS                              │ ← Preto/gradiente
├─────────────────────────────────────┤
│ FAQ                                 │ ← Preto
├─────────────────────────────────────┤
│ CTA FINAL                           │ ← Preto/gradiente
└─────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Novas Classes CSS

```css
/* Fundo grafite para variação sutil */
.section-graphite {
  background: hsl(0 0% 8%);
}

/* Fundo claro para quebra de padrão */
.section-light {
  background: hsl(0 0% 95%);
}

.section-light h2,
.section-light h3,
.section-light .text-foreground {
  color: hsl(0 0% 10%);
}

.section-light p,
.section-light .text-muted-foreground {
  color: hsl(0 0% 35%);
}

.section-light .text-primary {
  color: hsl(16 100% 45%);
}

.section-light .bg-primary\/10 {
  background: hsl(16 100% 50% / 0.15);
}
```

### HeroSection — Estrutura Visual

```text
┌─────────────────────────────────────────────┐
│                                             │
│     Quando o corpo entra em ordem,          │  ← text-8xl, muito grande
│              tudo muda.                     │
│                                             │
│   O Método Renascer foi criado para...      │  ← text-lg, menor, mais espaço
│                                             │
│   Não é desafio. Não é treino genérico.     │  ← text-primary, destaque
│                É método.                    │
│                                             │
│         [ ENTRAR NO MÉTODO → ]              │  ← CTA grande
│                                             │
└─────────────────────────────────────────────┘
```

---

## Observações Finais

- Nenhuma rota será alterada
- Nenhuma lógica de planos será modificada
- Nenhum acesso ou arquitetura será alterado
- Foco em **contraste visual** e **hierarquia de texto**
- A seção clara (HowItWorks) cria ruptura que chama atenção
- Linguagem consistente: "Entrar no Método" como CTA principal
