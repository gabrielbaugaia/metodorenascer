

# Diário Nutricional — Entrada manual + Banco ampliado + Leitura de foto por IA

## Problemas identificados

1. O banco `foods_database` tem apenas ~50 itens — faltam itens comuns como "café", "frango milanesa", "suco de laranja", etc.
2. Não existe opção de **digitar manualmente** um alimento que não está no banco.
3. Não existe opção de **tirar foto do prato** para IA identificar os alimentos.

## Solução em 3 partes

### 1. Ampliar o banco de alimentos (~150 itens adicionais)

Nova migration inserindo alimentos comuns que faltam, organizados por categoria:

- **Bebidas**: café preto, café com leite, suco de laranja, suco verde, água de coco, refrigerante, chá
- **Pratos prontos**: frango milanesa, bife acebolado, strogonoff, feijoada, moqueca, escondidinho, lasanha, pizza (fatia), hambúrguer, cachorro-quente, açaí com granola, poke bowl
- **Carboidratos**: farofa, purê de batata, polenta, milho cozido, pipoca, biscoito cream cracker, torrada
- **Proteínas**: carne de porco, costela, peito de peru, camarão, frango empanado, salsicha, calabresa
- **Laticínios**: requeijão, queijo muçarela, cream cheese, manteiga, nata
- **Frutas**: morango, uva, melancia, manga, laranja, abacaxi, kiwi, pera
- **Vegetais**: pepino, beterraba, couve refogada, quiabo, abobrinha, berinjela, vagem
- **Outros**: arroz com feijão (prato), omelete, panqueca, crepioca, wrap, salada mista

### 2. Opção de entrada manual (alimento customizado)

Quando a busca não retorna resultados, mostrar botão **"Adicionar manualmente"** que abre um mini-formulário:

- Nome do alimento (texto livre)
- Calorias (número)
- Proteína, Carboidrato, Gordura (opcionais, default 0)
- Porção (texto, ex: "1 prato")

Isso permite registrar qualquer alimento em segundos, mesmo que não esteja no banco.

### 3. Leitura de foto do prato por IA (Scan de Refeição)

**Viabilidade: Alta.** O projeto já usa Lovable AI (Gemini) com visão em `validate-body-photo`. A mesma abordagem funciona para identificar alimentos em fotos.

**Nova edge function: `analyze-meal-photo`**
- Recebe imagem base64 do prato
- Envia para Gemini Vision com prompt para identificar alimentos, estimar porções e macros
- Retorna lista de alimentos detectados com calorias estimadas
- Usuário revisa e confirma antes de salvar

**UI no FoodSearchModal:**
- Botão "📸 Escanear prato" no topo do modal
- Abre câmera/galeria → envia foto → mostra lista de alimentos detectados
- Usuário pode editar/remover itens antes de confirmar
- Todos os itens confirmados são inseridos no `food_logs` de uma vez

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| Nova migration SQL | Inserir ~150 alimentos adicionais |
| `supabase/functions/analyze-meal-photo/index.ts` | Nova — IA identifica alimentos na foto |
| `supabase/config.toml` | Adicionar config da nova function |
| `src/components/nutrition/FoodSearchModal.tsx` | Adicionar entrada manual + botão de foto |
| `src/components/nutrition/MealPhotoAnalysis.tsx` | Novo — UI de revisão dos alimentos detectados pela IA |

## Fluxo do usuário (foto)

```text
[Adicionar alimento]
    ↓
┌──────────────────────────┐
│  Buscar Alimento         │
│  [🔍 Digite...]         │
│  [📸 Escanear prato]    │
│                          │
│  Resultados da busca...  │
│                          │
│  Não encontrou?          │
│  [✏️ Adicionar manual]  │
└──────────────────────────┘
    ↓ (se foto)
┌──────────────────────────┐
│  Alimentos detectados:   │
│  ☑ Arroz branco - 130cal │
│  ☑ Feijão - 76cal        │
│  ☑ Frango milanesa-220cal│
│  ☑ Salada - 25cal        │
│                          │
│  [Confirmar refeição]    │
└──────────────────────────┘
```

