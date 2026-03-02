
# Tornar o Tutorial "Como Usar" Visivel e Proeminente

## Problema
O botao "Como usar" esta no PageHeader como um botao ghost minusculo — praticamente invisivel para clientes novos. Precisa ser o primeiro item que o usuario ve ao entrar em cada pagina.

## Solucao

### 1. Criar um banner de boas-vindas no topo de cada pagina

Quando o usuario ainda nao viu o tutorial daquela pagina, exibir um **card/banner chamativo** no topo da pagina (antes de qualquer outro conteudo), com:
- Texto: "Primeira vez aqui? Veja como usar esta pagina"
- Botao: "Ver Tutorial"
- Botao de fechar (X) que marca como visto

Apos clicar em "Ver Tutorial" ou fechar, o banner some permanentemente (localStorage) e resta apenas o botao discreto no header para consulta futura.

### 2. Alterar o componente `PageTutorial.tsx`

Modificar o componente para renderizar **dois modos**:
- **Modo banner** (quando nunca viu): Card destacado com fundo `bg-primary/10`, borda `border-primary/30`, texto convidativo e botao "Ver Tutorial" com estilo `default`
- **Modo icone** (apos ja ter visto): Comportamento atual — botao ghost discreto no header

O componente passa a exportar dois sub-componentes:
- `<PageTutorialBanner pageId="treino" />` — vai no corpo da pagina, antes do conteudo
- `<PageTutorial pageId="treino" />` — fica no header como esta

### 3. Integrar o banner em todas as paginas

Adicionar `<PageTutorialBanner pageId="..." />` como primeiro elemento do conteudo em:
- `Treino.tsx` — logo apos o PageHeader
- `Nutricao.tsx` — logo apos o PageHeader
- `Mindset.tsx` — logo apos o header customizado
- `Suporte.tsx` — logo apos o header customizado
- `Evolucao.tsx` — logo apos o PageHeader
- `Renascer.tsx` — logo apos o PageHeader

### Visual do banner

```text
+--------------------------------------------------+
|  [?]  Primeira vez aqui?                     [X]  |
|       Veja como usar esta pagina em poucos passos |
|                                                    |
|       [ Ver Tutorial ]                             |
+--------------------------------------------------+
```

- Fundo sutil com borda primary
- Desaparece apos clicar "Ver Tutorial" ou no X
- Animacao suave de fade-out ao fechar

## Arquivos alterados

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/PageTutorial.tsx` | Adicionar componente `PageTutorialBanner` |
| `src/pages/Treino.tsx` | Adicionar banner no topo |
| `src/pages/Nutricao.tsx` | Adicionar banner no topo |
| `src/pages/Mindset.tsx` | Adicionar banner no topo |
| `src/pages/Suporte.tsx` | Adicionar banner no topo |
| `src/pages/Evolucao.tsx` | Adicionar banner no topo |
| `src/pages/Renascer.tsx` | Adicionar banner no topo |

Nenhuma mudanca no banco de dados.
