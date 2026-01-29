
# Plano: Preenchimento Completo da Home — Método Renascer

## Diagnóstico Atual

A página está visualmente estruturada mas com conteúdo incompleto. O problema principal: **cria clima, mas não explica o método nem vende o processo**.

| Seção | Estado Atual | Problema |
|-------|-------------|----------|
| Hero | "Não Busque Evolução, Busque RENASCIMENTO" | Frase de impacto mas sem explicar o que é o método |
| Mentor | Nome + frase + citação curta | OK — mantém ancoragem |
| ProblemSection | 3 problemas genéricos | Não conecta com a solução prescritiva |
| MethodologySection | 4 ícones (Análise, Receitas, Mentor, Gamificação) | Títulos vagos, sem descrição do sistema |
| TransformationsGallery | Grid de fotos | OK — provas visuais |
| TestimonialsSection | Carrossel de depoimentos | OK — prova social |
| PricingSection | 5 cards de planos | Texto promocional, falta linguagem de compromisso |
| FAQSection | 14 perguntas | OK — completo |
| CTASection | "Sua Nova Vida Começa Agora" | Genérico, falta fechamento forte |

---

## Implementação Proposta

### 1. HeroSection — Headline + Subheadline Obrigatória

**De:**
```
Headline: "Não Busque Evolução, Busque RENASCIMENTO"
Subtítulo: "O método que transforma corpos e reconstrói mentes."
CTA: "QUERO RENASCER"
```

**Para:**
```
Headline: "O Método Renascer."
Subheadline: "Um sistema de prescrição física, nutricional e mental criado para 
transformar corpo, energia e disciplina de forma personalizada e sustentável."
Reforço: "Não é desafio. Não é treino genérico. É método."
CTA: "Entrar no Método"
```

**Alterações técnicas:**
- Simplificar H1 para uma linha impactante
- Adicionar subheadline explicativo (p)
- Adicionar frase de reforço curta
- Mudar texto do CTA

---

### 2. Nova Seção — "O Que É o Renascer"

**Criar nova seção após MentorSection**

```
Título: "O Renascer não é um treino. É um sistema."

Texto: "O Método Renascer foi criado para quem entende que resultado não vem 
de motivação, mas de prescrição correta e execução consistente.
Cada decisão — treino, alimentação e mentalidade — é baseada no seu corpo, 
na sua rotina e no seu objetivo."
```

**Implementação:**
- Criar novo componente `WhatIsSection.tsx`
- Adicionar em Index.tsx após MentorSection
- Estilo: bloco largo centralizado, fundo neutro, texto grande

---

### 3. MethodologySection — Expandir com 5 Pilares + Descrições

**De:** 4 ícones sem descrição (Análise, Receitas, Mentor 24h, Gamificação)

**Para:** 5 pilares com títulos e descrições completas

| Ícone | Título | Descrição |
|-------|--------|-----------|
| Camera | Análise Individual | Avaliação completa do seu perfil físico, histórico, rotina e objetivo para prescrever treino, nutrição e mentalidade de forma personalizada. |
| Dumbbell | Treino Prescrito | Treino estruturado de acordo com seu nível, tempo disponível e capacidade de recuperação. Sem padrão genérico. |
| Utensils | Nutrição Prescrita + Receitas | Plano alimentar alinhado ao seu objetivo, com receitas inteligentes para facilitar a execução no dia a dia. |
| Brain | Mentalidade e Acompanhamento | Disciplina mental aplicada à rotina real, com acompanhamento contínuo e ajustes conforme sua evolução. |
| Target | Disciplina e Consistência | Sistema de acompanhamento que transforma execução diária em progresso real e mensurável. |

**Adicionar subtítulo da seção:** "Um sistema completo de prescrição personalizada."

**Alteração de layout:**
- Manter ícones em linha horizontal (desktop) / grid 2x3 (mobile)
- Adicionar tooltip ou accordion para descrições
- Ou: layout vertical com ícone + título + descrição visível

---

### 4. Nova Seção — "Como Funciona na Prática"

**Criar seção após MethodologySection**

```
Título: "O método se adapta à sua vida. Não o contrário."

Texto: "Você é analisado, recebe prescrições claras, executa no dia a dia, 
registra evolução e ajusta conforme os resultados.
Simples, direto e sustentável."

Fluxo visual: Análise → Prescrição → Execução → Evolução → Ajuste
```

**Implementação:**
- Criar novo componente `HowItWorksSection.tsx`
- Adicionar fluxo horizontal com 5 steps
- Estilo limpo, sem cards, apenas ícones + textos conectados

---

### 5. Nova Seção — "Evolução e Acompanhamento"

**Criar seção após TransformationsGallery**

```
Título: "Você não fica sozinho no processo."

Texto: "Check-ins, análises visuais, feedbacks e ajustes fazem parte do método.
Evolução aqui não é achismo. É medida."
```

**Implementação:**
- Criar novo componente `EvolutionSection.tsx`
- Seção curta, apenas título + texto
- Fundo diferenciado (section-dark)

---

### 6. MentorSection — Ajustar Texto

**De:**
```
"O estrategista por trás do Método Renascer."
```

**Para:**
```
Título: "Criado por quem vive o método."
Subtítulo: "Gabriel Baú"
Texto: "O Método Renascer nasceu da integração entre corpo, mente e rotina real.
Não foi criado para ser moda. Foi criado para funcionar."
```

---

### 7. PricingSection — Linguagem de Compromisso

**Alterar título e subtítulo:**

**De:**
```
Título: "Escolha Seu Plano"
Subtítulo: "De R$197/mês por apenas R$49/mês, preço vitalício para os primeiros 25 embaixadores."
```

**Para:**
```
Título: "Escolha o nível de compromisso com a sua evolução"
Subtítulo: "O método é o mesmo. O que muda é o tempo que você decide se comprometer com o processo."
```

**Alterar descrições dos planos:**

| Plano | Descrição Nova |
|-------|----------------|
| Elite Fundador (Mensal) | Para quem quer começar agora e entender o método na prática. |
| Trimestral | O tempo mínimo para o corpo responder ao método. Resultados consistentes não acontecem em semanas. |
| Anual | Para quem decidiu fazer do método parte da própria vida. O corpo muda. A rotina se ajusta. A disciplina deixa de ser esforço e vira padrão. |

**Alterar CTAs:**
- Mensal: "Entrar no Método"
- Trimestral: "Assumir o Compromisso" (destacar como RECOMENDADO)
- Anual: "Entrar no Processo"

---

### 8. Novo Bloco — Reforço Final (antes do CTA)

**Criar componente ou adicionar em CTASection:**

```
"O Método Renascer não é um desafio de 21 dias.
É um sistema contínuo de prescrição e ajuste.

Você não está comprando acesso a um app.
Está entrando em um processo."
```

---

### 9. CTASection — Fechamento Forte

**De:**
```
Título: "Sua Nova Vida Começa Agora"
Texto: "Vagas limitadas para acompanhamento individual. Não aceitamos curiosos, apenas comprometidos."
CTA: "RESERVAR MINHA TRANSFORMAÇÃO"
```

**Para:**
```
Título: "Corpo forte, mente disciplinada e rotina sob controle mudam tudo."
(sem subtítulo explicativo)
CTA: "Entrar no Método Renascer"
```

---

## Ordem de Implementação

| Etapa | Arquivo | Tipo |
|-------|---------|------|
| 1 | `HeroSection.tsx` | Editar |
| 2 | `WhatIsSection.tsx` | Criar |
| 3 | `MethodologySection.tsx` | Editar (expandir pilares) |
| 4 | `HowItWorksSection.tsx` | Criar |
| 5 | `MentorSection.tsx` | Editar |
| 6 | `EvolutionSection.tsx` | Criar |
| 7 | `PricingSection.tsx` | Editar (textos e CTAs) |
| 8 | `CTASection.tsx` | Editar |
| 9 | `Index.tsx` | Editar (reordenar seções) |

---

## Estrutura Final da Home

```text
1. Header
2. Hero (O Método Renascer + subheadline + CTA)
3. MentorSection (Criado por quem vive o método)
4. WhatIsSection (O Renascer não é um treino. É um sistema.)
5. MethodologySection (5 pilares com descrições)
6. HowItWorksSection (Fluxo: Análise → Prescrição → Execução → Evolução → Ajuste)
7. TransformationsGallery (Provas visuais)
8. TestimonialsSection (Depoimentos)
9. EvolutionSection (Você não fica sozinho no processo)
10. PricingSection (Escolha o nível de compromisso)
11. FAQSection (Perguntas frequentes)
12. CTASection (Fechamento + bloco de reforço)
13. Footer
```

---

## Observações Finais

- Nenhuma rota será alterada
- Nenhuma lógica de planos será modificada
- Nenhum acesso ou arquitetura será alterado
- Apenas conteúdo textual e criação de 3 novas seções de texto
- Visual sóbrio e espaçado mantido
- Linguagem de método, não de ferramenta SaaS
