

# Melhorias no Diário Nutricional: Upload de galeria + Quantidades flexíveis + Bebidas

## Problemas atuais

1. O input de foto usa `capture="environment"` que força a câmera — não permite escolher fotos da galeria do celular.
2. Não há seletor de quantidade/unidade ao adicionar alimentos (copos, unidades, litros, ml, etc.).
3. Faltam bebidas comuns no banco (energético, energético zero, refrigerante lata, etc.).

## Solução

### 1. Upload de foto da galeria (FoodSearchModal.tsx)

Remover o atributo `capture="environment"` do input de arquivo. Isso faz o celular mostrar as duas opções: "Tirar foto" ou "Escolher da galeria". Adicionar um segundo botão para deixar explícito:

- Botão "📸 Tirar foto" — abre câmera (input com `capture`)
- Botão "🖼️ Escolher da galeria" — abre galeria (input sem `capture`)

### 2. Seletor de quantidade + unidade (FoodSearchModal.tsx)

Quando o usuário seleciona um alimento da busca, em vez de adicionar direto, mostrar uma tela intermediária "Ajustar porção" com:

- **Quantidade**: input numérico (default 1)
- **Unidade**: select com opções contextuais (porção, unidade, copo 200ml, copo 300ml, litro, lata 350ml, garrafa 600ml, colher de sopa, fatia, xícara)
- Os macros são recalculados multiplicando pela quantidade
- Botão "Adicionar" confirma

### 3. Bebidas no banco de dados (migration SQL)

Inserir ~30 bebidas comuns que faltam:
- Refrigerante cola (lata 350ml), Refrigerante guaraná, Refrigerante zero (lata)
- Energético (lata 250ml), Energético zero (lata 250ml)
- Cerveja (lata 350ml), Cerveja zero álcool
- Suco de uva integral, Suco de maracujá, Limonada
- Água tônica, Isotônico (garrafa 500ml)
- Leite integral (copo 200ml), Leite desnatado
- Iogurte natural, Iogurte grego, Whey shake
- Cappuccino, Chocolate quente, Chá mate gelado

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/nutrition/FoodSearchModal.tsx` | Adicionar upload galeria, tela de ajuste de porção com quantidade + unidade |
| Nova migration SQL | Inserir ~30 bebidas no `foods_database` |

## Fluxo atualizado

```text
[Adicionar alimento]
    ↓
┌─────────────────────────────┐
│  [📸 Tirar foto]            │
│  [🖼️ Escolher da galeria]  │
│  [🔍 Digite o alimento...] │
│                             │
│  Resultados...              │
│  [✏️ Adicionar manual]     │
└─────────────────────────────┘
    ↓ (seleciona alimento)
┌─────────────────────────────┐
│  Arroz branco               │
│  Quantidade: [1]            │
│  Unidade: [copo 200ml ▼]   │
│                             │
│  130 kcal · P:2g C:28g G:0g│
│  [Cancelar]  [Adicionar]    │
└─────────────────────────────┘
```

