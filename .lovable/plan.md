## Problema

No `LPHero` (src/components/landing-premium/LPSections.tsx, linhas 114–191):

- A `section` usa `min-h-[100svh] flex items-center`, o que centraliza verticalmente todo o bloco.
- A barra de social proof (+15 / +1000 / 100%) está com `absolute bottom-12 left-6 right-6` dentro do mesmo container do conteúdo central.
- Em viewports curtos no desktop (ex.: 815×486 do preview) e em mobile com teclado/altura reduzida, a barra absoluta encosta nos botões CTA → visual de "tudo em cima / embolado" exatamente como nas imagens enviadas.
- No mobile, `flex-wrap` quebra os 3 stats em colunas que ainda ficam por cima dos botões (overlap), causando o "embolado".

A tela `/auth` em si está correta (já usa `flex items-center justify-center min-h-screen`); a referência do usuário é o estado deslogado caindo no hero da landing premium.

## Solução

Reestruturar o `LPHero` para usar **fluxo vertical natural** com `flex flex-col justify-between`, tirando o `absolute` da social proof e dando respiro real entre CTAs e métricas.

### Mudanças em `src/components/landing-premium/LPSections.tsx` → `LPHero`

1. **Container `section`**
   - Trocar `min-h-[100svh] flex items-center` por `min-h-[100svh] flex flex-col` com `pt-32 md:pt-40 pb-10 md:pb-14`.
   - Garante que conteúdo cresça top→bottom sem colisão.

2. **Wrapper interno** (`div.relative.z-10`)
   - Tornar `flex-1 flex flex-col justify-between` para empurrar a social proof para o rodapé naturalmente, sem `absolute`.
   - Padding lateral mantido (`px-6 md:px-14`), remover `pt-32 md:pt-0` (subiu para a `section`).

3. **Bloco principal (eyebrow + h1 + parágrafo + CTAs)**
   - Reduzir `mb-*` para escala mais compacta no desktop curto:
     - eyebrow `mb-6`
     - h1 `mb-6`
     - parágrafo `mb-8 md:mb-10`
   - Ajustar tamanho do h1 para `clamp(48px, 8vw, 120px)` (um pouco menor para caber em viewports curtos).
   - CTAs: `flex flex-col sm:flex-row gap-3 sm:gap-4`, garantir `w-full sm:w-auto` nos botões para mobile não estourar.

4. **Social proof bar**
   - Remover `absolute bottom-12 left-6 right-6`.
   - Virar bloco em fluxo: `mt-16 md:mt-24 pt-8 border-t border-white/5 flex flex-wrap items-baseline gap-x-10 md:gap-x-14 gap-y-4`.
   - No mobile: `grid grid-cols-1 sm:flex` opcional — vou usar simplesmente flex-wrap com gap mais comportado para que cada item fique numa linha quando faltar espaço, sem sobrepor os CTAs.

5. **Foto do Gabriel (background)**
   - Manter como está; apenas reduzir `opacity-[0.35]` para `opacity-[0.25]` no mobile para reduzir ruído visual atrás do texto (ajuda no "embolado").

### Resultado esperado

- **Desktop curto (815×486)**: hero ocupa 100svh, conteúdo no topo, social proof empurrada ao rodapé com respiro real entre CTAs e métricas.
- **Desktop normal (1440+)**: mantém impacto editorial, melhor hierarquia vertical.
- **Mobile (390px)**: tudo em coluna, CTAs full-width, social proof abaixo numa linha separada (com borda sutil para divisão clara).

## Fora do escopo

- Não mexer em `/auth` (já está centralizado corretamente).
- Não alterar outras seções da landing (`LPProblem`, `LPPlans`, etc.).
- Não trocar tipografia, paleta ou copy.
- Sem mudanças de roteamento ou lógica.

## Arquivos afetados

- `src/components/landing-premium/LPSections.tsx` (apenas função `LPHero`, ~80 linhas).
