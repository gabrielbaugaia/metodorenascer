

# Plano: Refinamento Visual da Landing Page

## Diagnóstico Atual

A landing page atual segue um padrão visual que, apesar de bem estruturado tecnicamente, transmite sensação de **layout SaaS genérico** devido a:

| Problema | Onde Ocorre | Impacto |
|----------|-------------|---------|
| Cards com bordas visíveis em todas as seções | ProblemSection, MethodologySection, TestimonialsSection, PricingSection, FAQSection | Fragmentação visual, reduz impacto |
| Grid de cards pequenos competindo por atenção | Metodologia (4 cards), Preços (5 cards) | Diminui hierarquia de importância |
| Headlines de tamanho uniforme entre seções | Todas as seções usam mesma escala | Sem contraste de importância |
| Espaçamento padronizado demais | py-20 md:py-28 em todas as seções | Layout previsível, sem respiro |
| Texto explicativo demais | Subtítulos longos em cada seção | Dilui impacto das afirmações |

---

## Proposta de Ajustes

### 1. Hero Mais Dominante

**Estado Atual:**
- H1: `text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl`
- Subtítulo longo com 2 linhas
- Container `max-w-4xl`

**Proposta:**
- Aumentar H1 para `text-[3rem] sm:text-6xl md:text-7xl lg:text-8xl`
- Subtítulo em uma única frase de impacto (máx 15 palavras)
- Remover texto secundário sob o CTA (preço aparece só na seção de planos)
- Aumentar espaçamento vertical para `min-h-[100svh]` com mais padding top
- Adicionar sutil gradiente de fundo ou vignette para profundidade

**Copy sugerido:**
```text
Headline: "Não Busque Evolução, Busque RENASCIMENTO"
Subtítulo: "O método que transforma corpos e reconstrói mentes."
```

### 2. Menos Cards, Mais Blocos Largos

**Seções a Refatorar:**

#### ProblemSection
- **Atual:** 3 cards com ícones em grid
- **Proposta:** Bloco único full-width com 3 statements em lista vertical, sem bordas
- Cada problema como linha de texto com ícone inline (não em círculo)
- Fundo sutil diferenciado (section-dark)

#### MethodologySection  
- **Atual:** 4 cards em grid 2x2/4x1
- **Proposta:** Layout horizontal com 4 ícones + títulos em uma única linha
- Descrições aparecem apenas em hover/mobile accordion
- Fundo contrastante para destacar do resto

#### TestimonialsSection
- **Atual:** Card único com carrossel e bordas
- **Proposta:** Citação em destaque sem bordas, apenas aspas grandes e texto
- Nome e resultado como linha única abaixo
- Background limpo, sem container visual

#### FAQSection
- **Atual:** Accordion com bordas e hover states
- **Proposta:** Manter accordion mas remover bordas visíveis
- Separadores sutis (1px border-bottom) entre itens
- Estilo mais editorial

### 3. Texto Mais Declarativo

**Padrão Atual de Subtítulos:**
```
"O problema não é a falta de esforço, é a falta de estratégia."
"Para construir o novo, o velho precisa deixar de existir."
"Veja quem decidiu parar de dar desculpas e assumiu o controle."
```

**Padrão Proposto:**
- Eliminar subtítulos explicativos
- Manter apenas headlines de impacto
- Se necessário subtítulo, máximo 8 palavras afirmativas

| Seção | Atual | Proposta |
|-------|-------|----------|
| Problema | "O problema não é a falta de esforço..." | Remover subtítulo |
| Metodologia | "Para construir o novo..." | Remover subtítulo |
| Transformações | "Resultados reais de nossos alunos" | Remover subtítulo |
| Depoimentos | "Veja quem decidiu..." | Remover subtítulo |
| FAQ | "Tudo que você precisa saber..." | Remover subtítulo |

### 4. Presença Humana

**MentorSection Atual:**
- Foto 288x288px com borda
- Título + 3 parágrafos de texto (bio longa)
- Citação final

**Proposta:**
- Mover seção para **logo após o Hero** (antes de Problema)
- Foto maior: 320x320px desktop, 240x240px mobile
- Reduzir para: **Nome + 1 frase de posicionamento + citação**
- Layout lado a lado em desktop, empilhado em mobile

**Copy sugerido:**
```text
"Gabriel Baú"
"O estrategista por trás do Método Renascer."
Citação: "Aqui não existe tentar. Existe fazer até conquistar."
```

---

## Ajustes Técnicos

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Index.tsx` | Reordenar seções (Mentor após Hero) |
| `src/components/landing/HeroSection.tsx` | Aumentar headline, reduzir copy, remover preço |
| `src/components/landing/MentorSection.tsx` | Simplificar para ancoragem rápida |
| `src/components/landing/ProblemSection.tsx` | Remover cards, usar lista de statements |
| `src/components/landing/MethodologySection.tsx` | Layout horizontal sem cards |
| `src/components/landing/TestimonialsSection.tsx` | Remover bordas, estilo editorial |
| `src/components/landing/FAQSection.tsx` | Remover bordas dos accordion items |
| `src/index.css` | Adicionar classe `.section-statement` para blocos de texto |

### Classes CSS Novas
```css
.section-statement {
  /* Bloco de texto largo sem container visual */
  @apply py-16 md:py-24;
}

.statement-line {
  /* Linha de statement com ícone inline */
  @apply flex items-start gap-4 text-lg md:text-xl py-4 border-b border-border/20;
}

.headline-hero {
  /* Headline extra grande para hero */
  @apply text-[3rem] sm:text-6xl md:text-7xl lg:text-8xl;
}
```

---

## Ordem de Implementação

1. **HeroSection** - Aumentar impacto visual (fundação)
2. **MentorSection** - Simplificar e reposicionar (autoridade imediata)
3. **ProblemSection** - Remover cards (fluidez)
4. **MethodologySection** - Layout horizontal (clareza)
5. **TestimonialsSection** - Estilo editorial (confiança)
6. **FAQSection** - Limpar bordas (finalização)

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| 9+ containers visuais distintos | 3-4 blocos de impacto |
| Headlines uniformes | Hierarquia clara (Hero > Seções) |
| Subtítulos explicativos | Afirmações diretas |
| Mentor no meio da página | Mentor logo após Hero |
| Sensação de "escolher features" | Sensação de "seguir um método" |

---

## Detalhes Técnicos

### HeroSection - Refatoração

```text
Estrutura proposta:
- Container fullscreen com gradiente sutil
- H1 em 2 linhas: "Não Busque Evolução," / "Busque RENASCIMENTO"
- Subtítulo: "O método que transforma corpos e reconstrói mentes."
- CTA: "QUERO RENASCER" (sem preço visível)
- Sem indicador de scroll
```

### MentorSection - Simplificação

```text
Estrutura proposta:
- Flex horizontal (foto à esquerda, texto à direita)
- Foto: maior, com glow laranja sutil
- Nome: "Gabriel Baú" em display font
- Subtítulo: "O estrategista por trás do Método Renascer."
- Citação: em itálico com cor primária
- Total: 3 elementos textuais apenas
```

### ProblemSection - Formato Statement

```text
Layout proposto:
- Full-width com fundo section-dark
- H2: "O Fitness Tradicional FALHOU com Você"
- 3 linhas de statement:
  ✕ Autoestima destruída por dietas genéricas
  ✕ Corpo estagnado pelo efeito sanfona
  ✕ Desistência por falta de estratégia real
- Frase de fechamento em destaque
```

### MethodologySection - Layout Horizontal

```text
Layout proposto:
- Container centralizado
- H2: "O Método Renascer"
- 4 pilares em linha horizontal:
  [Ícone] Análise | [Ícone] Receitas | [Ícone] Mentor 24h | [Ícone] Gamificação
- Títulos apenas, sem descrições longas
- Em mobile: 2x2 grid compacto
```

