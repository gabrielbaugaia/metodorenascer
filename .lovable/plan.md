

# Tornar Upload de Print Fitness Visivel + Permitir Escolher Data

## Problema Atual

1. **Botao escondido**: O botao "Enviar print" esta dentro de uma secao colapsavel ("Dados do Fitness (opcional)") que fica fechada por padrao. O cliente nao sabe que existe.

2. **Sempre salva como hoje**: O sistema usa `format(new Date(), "yyyy-MM-dd")` fixo. Se o cliente quer registrar os dados de quinta-feira na sexta, nao consegue.

## Solucao

### 1. Botao de print destacado antes do formulario

Mover o botao de "Enviar print" para FORA da secao colapsavel, posicionando-o logo acima dos campos manuais como acao principal. O fluxo fica:

```text
[Registrar hoje (30s)]
  |
  [Botao grande: "Enviar print do Fitness"]  <-- VISIVEL
  |
  [Seletor de data: Hoje / Ontem / Escolher data]
  |
  [Sono, Estresse, Energia, Treino...]
  |
  [Secao colapsavel: campos manuais de fitness]
  |
  [Salvar meu dia]
```

O botao tera icone de camera, texto claro, e cor de destaque. Ao selecionar a imagem, a IA le automaticamente e preenche os campos (como ja funciona).

### 2. Seletor de data

Adicionar 3 opcoes rapidas de data no topo do formulario:
- **Hoje** (padrao)
- **Ontem** (1 clique)
- **Outra data** (abre um campo date picker)

A data selecionada sera usada tanto para o `manual_day_logs` quanto para o `health_daily`.

### 3. IA detecta data da imagem (bonus)

Atualizar o prompt da edge function `extract-fitness-data` para tambem tentar extrair a data visivel na imagem. Se a IA encontrar uma data (ex: "Thu, Feb 26"), o seletor de data sera atualizado automaticamente para essa data. O cliente pode confirmar ou alterar.

O campo retornado sera `detected_date` no formato `YYYY-MM-DD`.

## Mudancas por Arquivo

| Arquivo | O que muda |
|---------|-----------|
| `src/components/renascer/ManualInput.tsx` | Botao de print movido para cima e destacado; seletor de data adicionado; logica de save usa data selecionada em vez de `new Date()` |
| `supabase/functions/extract-fitness-data/index.ts` | Prompt atualizado para tambem extrair a data visivel na imagem; novo campo `detected_date` no retorno |

## Detalhes Tecnicos

### ManualInput.tsx

- Novo estado `selectedDate` (default: hoje)
- 3 botoes tipo chip: "Hoje", "Ontem", "Outra"
- Ao selecionar "Outra", mostra `<Input type="date" />`
- Botao de camera movido para antes da secao colapsavel, com estilo `variant="outline"` e tamanho maior
- Quando IA retorna `detected_date`, atualiza `selectedDate` automaticamente e mostra toast informando

### extract-fitness-data Edge Function

- Adicionar ao prompt: "Tambem extraia a data visivel na imagem, se houver, no formato YYYY-MM-DD"
- Adicionar campo `detected_date` no tool calling schema (string, opcional)
- Retornar no response junto com os outros campos

