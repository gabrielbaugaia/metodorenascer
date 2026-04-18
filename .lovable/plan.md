

## Ajuste: trocar dourado/amarelo do Quiz para laranja Renascer

### O que muda

Substituir a paleta dourada (`40 70% 50%` — amarelo/dourado) do Quiz pela cor primária do sistema (`14 100% 62%` — laranja Renascer `#FF6A3D`), mantendo a identidade visual unificada com o resto do app.

### Onde aplicar

**Único arquivo afetado: `src/index.css`** — bloco `.quiz-renascer` (escopo isolado, não impacta outras telas).

Trocar:
- `--primary: 40 70% 50%` → `--primary: 14 100% 62%`
- `--accent: 40 70% 50%` → `--accent: 14 100% 62%`
- `--ring: 40 70% 50%` → `--ring: 14 100% 62%`

Mantém:
- Fundo escuro (`0 0% 4%`), superfícies, bordas e tipografia Cormorant Garamond intactos
- Estrutura, animações e layout do quiz inalterados

### Resultado visual

Todos os elementos que hoje aparecem em dourado/amarelo no quiz (eyebrow "DIAGNÓSTICO RENASCER", botões CTA, ícones de destaque, percentual de risco, bordas de foco) passam a usar o laranja `#FF6A3D` do sistema — mesma cor dos botões da área logada, admin e checkout.

### Arquivos
- **Editar**: `src/index.css` (3 linhas dentro de `.quiz-renascer`)

