

# Ajuste tipográfico do PDF de Evolução

## Problema

O PDF atual usa tamanhos de fonte inconsistentes (6px, 7px, 8px, 9px, 14px), cores de texto variadas (cinzas diferentes, laranja, preto), barras laranjas em excesso e espaçamento apertado entre linhas — resultando num visual confuso e desorganizado.

## Solução

Padronizar todo o documento com tipografia limpa e hierarquia clara usando apenas **3 estilos visuais**: normal, negrito e laranja (pontual).

### Padrão tipográfico unificado

| Elemento | Tamanho | Estilo | Cor |
|---|---|---|---|
| Header do documento | 14px | Bold | Branco (sobre barra laranja) |
| Título da página (nome do cliente) | 13px | Bold | Preto (#1a1a1a) |
| Título de seção | 9px | Bold | Laranja (#FF4500) — texto, sem barra |
| Subtítulo/label | 8px | Bold | Cinza escuro (#333) |
| Corpo de texto | 8px | Normal | Preto (#282828) |
| Texto secundário (datas, rodapé) | 7px | Normal | Cinza (#888) |

### Mudanças principais

1. **Remover barras laranjas das seções** — substituir por texto laranja bold com linha separadora fina cinza abaixo. Manter barra laranja apenas no header do topo da página.

2. **Espaçamento entre linhas** — aumentar de 3.5pt para 4.5pt no corpo e de 4pt para 5pt nas metas/listas. Adicionar 3pt de padding após cada seção.

3. **Espaçamento entre letras** — usar `doc.setCharSpace(0.2)` para melhorar legibilidade do corpo.

4. **Cores simplificadas** — apenas 3 cores: preto para texto, cinza (#888) para secundário, laranja (#FF4500) apenas para títulos de seção e destaques pontuais.

5. **Campos compactos (label: valor)** — label em cinza normal, valor em preto bold, mesma linha com tab consistente.

6. **Caixa motivacional** — fundo cinza claro (#F5F5F5) com borda fina cinza em vez de laranja.

7. **Labels de foto** — sem "▸", apenas texto bold em preto com separador fino.

## Arquivo alterado

| Arquivo | Ação |
|---|---|
| `src/lib/generateEvolutionPdf.ts` | Refatorar tipografia, espaçamento e cores |

Nenhuma migration necessária.

