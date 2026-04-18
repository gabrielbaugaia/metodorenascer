

# Plano: Substituir landing oficial pelo Quiz Renascer

## O que muda

A nova rota `/` passa a ser o **Quiz Diagnóstico Renascer** (9 etapas — hero, 4 perguntas, resultado, mentor, método, sistema, oferta). A landing atual (`HeroSection`, `MentorSection`, etc.) sai do ar como página principal.

Aluno atual continua entrando normalmente por um botão "Entrar" no canto superior direito.

## Diagrama do fluxo

```text
/ (Quiz)
 ├─ Step 0: Hero "Diagnóstico em 60s"      ──> [Entrar] no topo direito ──> /auth
 ├─ Step 1-4: 4 perguntas (sono, stress, compulsão, treino)
 ├─ Step 5: Resultado com % de risco
 ├─ Step 6: Quem é Gabriel Baú
 ├─ Step 7: O método
 ├─ Step 8: O que o sistema mostra
 └─ Step 9: Oferta R$ 497 / 12x 49,70 ──> https://buy.stripe.com/5kQ7sKbAKcY03wtd0S2B206
```

## Arquivos

### 1. Copiar asset
- `cross_project--copy_project_asset` → `src/assets/gabriel-bau-quiz.jpeg` (foto usada no Step 6)

### 2. Novo componente: `src/pages/Quiz.tsx`
Cópia integral do `Index.tsx` do projeto quiz, com 2 ajustes:
- **Botão "Entrar" fixo no topo direito** (todos os steps): link para `/auth`, estilo discreto (border + texto pequeno em uppercase), visível em mobile e desktop.
- Import da foto: `gabriel-bau-quiz.jpeg` no novo path.

### 3. Tokens visuais do quiz (escopo isolado)
O quiz usa paleta dourada própria (`--primary: 40 70% 50%`, fundo `0 0% 4%`, fonte `Cormorant Garamond`). Para **não quebrar o resto do app** (admin, área do aluno, V2), vou:
- Adicionar import do Google Fonts (Cormorant Garamond) + utilitários `.font-serif-display`, `.eyebrow`, `.animate-pulse-subtle`, `.animate-fade-in-up` em `src/index.css` dentro de `@layer utilities` (são utilitários novos, não conflitam).
- Aplicar as cores do quiz **inline via style/Tailwind arbitrário no próprio componente Quiz.tsx**, sem mexer nas variáveis HSL globais. Isso preserva os temas V1/V2/admin existentes.

### 4. Roteamento: `src/App.tsx`
- Atual: `<Route path="/" element={<Index />} />` (landing oficial)
- Novo: `<Route path="/" element={<Quiz />} />`
- A landing antiga vira `<Route path="/landing-classica" element={<Index />} />` (preserva acesso caso precise reverter ou comparar).
- Rota `/auth` (entrada do aluno) já existe — sem mudanças.

### 5. Preço & alunos atuais
- **Quiz**: vende novo programa de 90 dias por R$ 497 / 12x 49,70 via link Stripe pronto (`buy.stripe.com/5kQ7sKbAKcY03wtd0S2B206`).
- **Alunos atuais (R$ 49,90/mês)**: continuam intactos. O Stripe já está configurado no preço antigo, e o quiz aponta para um **price ID separado** — nada muda no banco, RLS, entitlements ou no plano deles.
- Não preciso alterar `planConstants.ts`, `priceMappings.ts` nem webhook agora (o link Stripe é hospedado, não passa por `create-checkout`). Se quiser depois sincronizar entitlements para quem comprar pelo quiz, faço numa fase 2.

## Detalhes técnicos

- **Memória obsoleta a remover**: `landing/hero-cta-routing` e `landing/mentor-credibility-section` ficam válidas só na rota `/landing-classica`. Atualizo o `mem://index.md` notando que `/` agora é o quiz.
- **SEO**: `document.title` no Quiz.tsx vira "Diagnóstico Renascer | Descubra seu risco de Burnout". Meta description igual.
- **UTM tracking**: anexo `?utm_source=quiz&utm_medium=funil` ao link Stripe para diferenciar conversões da campanha quiz vs. checkout direto.
- **Botão "Entrar"**: posicionado `fixed top-4 right-4 z-50`, ocultado apenas no Step 9 (para não competir com CTA de compra).

## Resumo dos arquivos
- **Novo**: `src/pages/Quiz.tsx`
- **Novo asset**: `src/assets/gabriel-bau-quiz.jpeg` (copiado do projeto quiz)
- **Editar**: `src/App.tsx` (trocar rota `/`)
- **Editar**: `src/index.css` (adicionar fonte + utilitários do quiz)
- **Editar**: `mem://index.md` (atualizar core: `/` agora é quiz funnel)

