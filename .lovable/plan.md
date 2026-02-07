
# Ajuste de Layout e Responsividade do Hero

## Problema Atual

Conforme a screenshot, o Hero ocupa `min-h-[100svh]` com padding-top excessivo (`pt-24 md:pt-32`) e gaps grandes entre elementos (`gap-10 md:gap-12`). Isso empurra o CTA para o limite inferior da tela, quase fora do viewport no mobile.

## Alteracoes no Arquivo

**Arquivo:** `src/components/landing/HeroSection.tsx`

### 1. Altura da section

| Propriedade | Antes | Depois |
|---|---|---|
| min-height | `min-h-[100svh]` | `min-h-[85svh] md:min-h-[90vh]` |
| padding-top | `pt-24 md:pt-32` | `pt-20 md:pt-28` |

### 2. Espacamento vertical do container interno

| Propriedade | Antes | Depois |
|---|---|---|
| gap do flex container | `gap-10 md:gap-12` | `gap-6 md:gap-8` |
| gap do title block | `gap-6` | `gap-4` |
| padding-top do CTA | `pt-4` | `pt-2` |

### 3. Tipografia mobile

| Propriedade | Antes | Depois |
|---|---|---|
| h1 font-size mobile | `text-[2.75rem]` | `text-[2.25rem]` |
| h1 line-height | `leading-[1.05]` | `leading-[1]` |

### O que NAO muda

- Cores, estilos, copy, animacoes
- Variante `fire` do botao
- Radial gradient de fundo
- Estrutura HTML
- Link do CTA (#preco)
- Classes de animacao (animate-fade-in, animate-pulse-glow)

### Resultado Esperado

- CTA visivel sem scroll em iPhone, Android e desktop
- Conteudo centralizado verticalmente de forma equilibrada
- Headline levemente menor no mobile para caber melhor
- Mesma identidade visual mantida
