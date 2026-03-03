
# Correcao Responsividade Evolucao + PDF Padronizado

## PARTE 1 — Responsividade da Pagina Evolucao

### 1.1 Container principal (`src/pages/Evolucao.tsx`)
- Trocar `max-w-5xl` por `max-w-2xl` (720px) para consistencia com outras paginas do app
- Garantir `px-3 sm:px-0` para padding horizontal no mobile
- Adicionar `overflow-x-hidden` no container principal

### 1.2 Cards e conteudo (`src/pages/Evolucao.tsx`)
- Garantir `w-full` e `min-w-0` em todos os cards
- Aplicar `break-words` e `overflow-wrap: break-word` nos textos longos (notas, analise AI)
- Padronizar espacamento vertical: `space-y-4` consistente entre secoes
- Corrigir grid de fotos para nao ultrapassar container (`grid-cols-3 gap-2` com `min-w-0`)

### 1.3 Analise AI inline (`src/pages/Evolucao.tsx`)
- Adicionar `overflow-hidden` no card de analise comparativa
- Garantir que `prose` nao force largura maior que container

### 1.4 EvolutionAnalysisResult (`src/components/evolution/EvolutionAnalysisResult.tsx`)
- Adicionar `min-w-0 w-full` no container raiz
- Corrigir grid de macros (`grid-cols-3`) — no mobile trocar para `grid-cols-1` para nao comprimir
- Adicionar `break-words overflow-hidden` em textos longos (resumoGeral, observacoes, sugestoes)
- Badges com `flex-wrap` garantido e `max-w-full truncate` para nao estourar
- Cards de angulo (frente/lado/costas) — garantir `min-w-0 overflow-hidden`

### 1.5 EvolutionTimeline (`src/components/evolution/EvolutionTimeline.tsx`)
- Adicionar `min-w-0 overflow-hidden` no container de cada checkin
- Textos com `break-words`
- Badges com protecao contra overflow

---

## PARTE 2 — PDF de Evolucao (`src/lib/generateEvolutionPdf.ts`)

### 2.1 Tipografia unica
- Usar exclusivamente `helvetica` (ja em uso, remover inconsistencias)
- Padronizar hierarquia fixa:
  - Titulo principal: 14px bold
  - Subtitulo de secao: 9px bold (dentro da barra laranja)
  - Corpo: 8px normal
  - Labels: 7px normal cinza
  - Caption/obs: 7px normal cinza claro

### 2.2 Alinhamento
- Tudo alinhado a esquerda
- Margens internas iguais em todas as paginas (12px)
- Remover textos centralizados desnecessarios

### 2.3 Quebra de pagina inteligente
- Antes de cada `addSectionTitle`, verificar se ha espaco minimo (40px) na pagina; se nao, chamar `doc.addPage()` + `addHeader()`
- Nunca deixar titulo isolado no final da pagina
- Agrupar "Mensagem Motivacional" com conteudo anterior — nao iniciar sozinha em pagina nova
- Criar helper `ensureSpace(minHeight)` que adiciona pagina se necessario

### 2.4 Estetica
- Fundo branco (ja em uso)
- Laranja (#FF4500) apenas em barras de secao e titulo principal
- Textos em preto/cinza escuro, labels em cinza medio
- Remover variacoes aleatorias de cor
- Caixa motivacional: fundo #FFF5EB (laranja palido), borda sutil, texto em italico cinza escuro

### Arquivos alterados

| Arquivo | Acao |
|---------|------|
| `src/pages/Evolucao.tsx` | Container `max-w-2xl`, overflow-hidden, break-words, espacamento |
| `src/components/evolution/EvolutionAnalysisResult.tsx` | min-w-0, overflow-hidden, grid responsivo macros, break-words |
| `src/components/evolution/EvolutionTimeline.tsx` | min-w-0, overflow-hidden, break-words |
| `src/lib/generateEvolutionPdf.ts` | Helper ensureSpace, tipografia padronizada, quebras inteligentes |

Nenhuma mudanca no banco de dados.
