# Micro-Upgrade UX Premium — Recompensa ao Salvar o Dia

## Visao Geral

Tres melhorias visuais apos o salvamento bem-sucedido do dia no Renascer: animacao premium do ScoreRing, confete minimalista nas primeiras 7 vezes, e micro-frase de feedback.

---

## 1. ScoreRing — Animacao de transicao + pulse glow

**Arquivo:** `src/components/renascer/ScoreRing.tsx`

- Adicionar prop opcional `celebrate?: boolean` que dispara um pulse glow temporario
- Usar `useEffect` + `useState` interno para animar o numero do score (contagem animada do valor anterior ao novo usando `requestAnimationFrame`)
- O anel SVG ja tem `transition-all duration-700 ease-out` no strokeDashoffset, entao a transicao do arco e automatica
- Ao receber `celebrate=true`, adicionar classe CSS temporaria no container SVG que aplica um `box-shadow` pulsante na cor do status por 600ms
- Keyframe `scoreGlow` sera adicionado ao `src/index.css`

---

## 2. Confete minimalista — Primeiras 7 vezes

**Arquivo:** novo `src/components/renascer/MiniConfetti.tsx`

- Componente que renderiza 12-16 particulas absolutas (divs pequenas, 4-6px) com cores monocromaticas (laranja primario + tons neutros)
- Keyframe `confettiFall`: cada particula sobe levemente e cai com rotacao, duracao ~900ms
- Posicoes e delays aleatorios via inline style
- Componente aceita `active: boolean` e renderiza somente quando true
- Desaparece automaticamente apos a animacao (unmount via timeout)

**Controle de exibicao (localStorage):**

- No `ManualInput.tsx`, no `onSuccess` da mutation:
  - Ler `localStorage.getItem("renascer_celebrations_count")` (default 0)
  - Se count < 7: setar `onCelebrate(true)` via callback prop + incrementar count no localStorage
  - Se count >= 7: setar `onCelebrate(false)` — sem confete, apenas animacao premium do ring

---

## 3. Micro-frase de feedback

**Arquivo:** `src/pages/Renascer.tsx`

- Adicionar state `showFeedback` (boolean)
- Apos save com sucesso, setar `showFeedback = true`
- Renderizar abaixo do ScoreRing card: `<p class="text-xs text-muted-foreground animate-fade-in">Atualizado. Continue no controle.</p>`
- Timeout de 2.5s para setar `showFeedback = false` com fade-out

---

## 4. Integracao — Fluxo completo

**Arquivo:** `src/pages/Renascer.tsx`

- Adicionar states: `celebrating` (boolean), `showFeedback` (boolean)
- Passar callback `onSaveSuccess` para `ManualInput` via nova prop
- No callback:
  1. Setar `celebrating = true`
  2. Setar `showFeedback = true`
  3. Verificar localStorage para decidir se dispara confete
  4. Timeout 600ms: setar `celebrating = false`
  5. Timeout 2500ms: setar `showFeedback = false`

**Arquivo:** `src/components/renascer/ManualInput.tsx`

- Adicionar prop `onSaveSuccess?: () => void`
- No `onSuccess` da mutation, chamar `onSaveSuccess?.()` apos o invalidateQueries

---

## 5. CSS — Keyframes

**Arquivo:** `src/index.css`

Adicionar:

- `@keyframes scoreGlow` — escala 1 -> 1.03 -> 1 com box-shadow pulsante, 600ms
- `@keyframes confettiFall` — translateY(0) -> translateY(-20px) -> translateY(60px) com rotacao e fade, 900ms

---

## Arquivos a criar/modificar


| Arquivo                                    | Acao                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| `src/components/renascer/ScoreRing.tsx`    | Adicionar prop `celebrate`, contagem animada, pulse glow |
| `src/components/renascer/MiniConfetti.tsx` | Criar componente de confete minimalista                  |
| `src/components/renascer/ManualInput.tsx`  | Adicionar prop `onSaveSuccess`                           |
| `src/pages/Renascer.tsx`                   | Orquestrar celebrate + feedback + confete                |
| `src/index.css`                            | Keyframes scoreGlow e confettiFall                       |


## Sem alteracoes de banco

Tudo client-side. localStorage para controle do confete.  
  
  
  
RENOMEAR ITEM DE MENU PRINCIPAL

Objetivo:

Substituir o item "Renascer" no menu lateral por "Hoje".

Requisitos:

- Trocar label "Renascer" por "Hoje"

- manter mesma rota e funcionalidade existente

- não alterar lógica ou componentes internos

- manter "RENASCER" apenas como marca no topo do sidebar (logo)

Estrutura final do menu:

Hoje

Dashboard (se ainda necessário)

Evolução

Treino

Nutrição

Mindset

Dados do Corpo

Perfil

Configurações

Critério de sucesso:

- usuário entende que "Hoje" é o painel principal

- nenhuma funcionalidade quebra

- apenas renomeação e ajuste visual