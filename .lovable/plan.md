

# Animacoes nos icones do HowItWorks + Alinhamento do CTA

## 1. Icones animados na secao "Como Funciona"

**Arquivo:** `src/components/landing/HowItWorksSection.tsx`

Adicionar animacoes CSS sequenciais a cada icone para criar vida e dinamismo:

- Cada icone recebe uma animacao unica e sutil que se repete infinitamente (loop lento):
  - Analise (ClipboardCheck): leve bounce vertical (sobe e desce 3px)
  - Prescricao (FileText): rotacao sutil pendular (-3deg a +3deg)
  - Execucao (Play): pulso de escala (1x a 1.08x)
  - Evolucao (TrendingUp): translacao diagonal leve (sobe-direita e volta)
  - Ajuste (Settings): rotacao continua lenta (360deg em ~8s)

- As setas conectoras (`->`) tambem ganham uma animacao sutil de slide horizontal (ida e volta) com delay sequencial, criando efeito de "fluxo"

- Cada icone entra com delay escalonado (staggered) quando a secao fica visivel, usando `animationDelay` inline

- As animacoes serao definidas via `style` inline com `@keyframes` adicionados ao `index.css` (6 keyframes simples)

**Arquivo:** `src/index.css` — adicionar keyframes:
- `@keyframes iconBounce` (translateY 0 -> -3px -> 0)
- `@keyframes iconSwing` (rotate -3deg -> 3deg)
- `@keyframes iconPulse` (scale 1 -> 1.08 -> 1)
- `@keyframes iconFloat` (translate 0,0 -> 2px,-2px -> 0,0)
- `@keyframes iconSpin` (rotate 0 -> 360deg)
- `@keyframes arrowSlide` (translateX 0 -> 4px -> 0)

Todas com `duration: 3-8s`, `ease-in-out`, `infinite`. Movimentos sutis e premium, nada exagerado.

---

## 2. Alinhamento do texto na CTASection

**Arquivo:** `src/components/landing/CTASection.tsx`

O bloco de texto reforco ("O Metodo Renascer nao e um desafio...") esta usando `text-center` herdado do container pai, mas visualmente o texto parece desalinhado porque cada paragrafo tem `<br />` forçando quebra que nao centraliza bem.

Correcao:
- Adicionar `text-center` explicito ao container dos paragrafos
- Garantir que os dois blocos de texto (`<p>`) tenham `text-center` individual
- Verificar que `max-w-2xl mx-auto` esta aplicado ao wrapper dos paragrafos para manter largura controlada e centralizada

---

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/landing/HowItWorksSection.tsx` | Animacoes por icone + setas animadas |
| `src/index.css` | 6 keyframes para animacoes de icone |
| `src/components/landing/CTASection.tsx` | Corrigir alinhamento do bloco de texto |

