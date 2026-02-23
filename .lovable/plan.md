

# Restaurar Acesso: Receitas, Lista de Compras e Substituicoes

## Diagnostico

Nenhum codigo foi removido. Os tres recursos existem no sistema:

- **Lista de Compras** -- renderiza dentro de `/nutricao` quando o protocolo contem `lista_compras_semanal`
- **Lista de Substituicoes** -- renderiza dentro de `/nutricao` quando o protocolo contem `substituicoes`
- **Gerador de Receitas** -- pagina completa em `/receitas`, com rota ativa, porem sem link de navegacao

## Problema Real

1. A **pagina Receitas** nao tem link no menu lateral (`ClientSidebar`) nem na barra inferior (`BottomNav`), tornando-a inacessivel para o aluno
2. A **Lista de Compras e Substituicoes** dependem do protocolo de nutricao conter esses campos. Se o protocolo nao foi gerado com esses dados, as secoes ficam ocultas -- mas o codigo esta la

## Plano de Correcao

### 1. Adicionar "Receitas" ao menu lateral do aluno

**Arquivo:** `src/components/layout/ClientSidebar.tsx`

Adicionar item ao array `clientMenuItems`:

```text
{ title: "Receitas", url: "/receitas", icon: ChefHat }
```

Posicionar apos "Nutricao" para manter a logica do fluxo alimentar.

### 2. Adicionar link rapido para Receitas no Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

Adicionar ao array `quickAccess` (linha 326-331):

```text
{ label: "Receitas", icon: ChefHat, href: "/receitas" }
```

### 3. Garantir visibilidade da Lista de Compras e Substituicoes

**Arquivo:** `src/pages/Nutricao.tsx`

As secoes ja existem no codigo. Elas dependem dos dados do protocolo. Duas opcoes:

- **Opcao A (recomendada):** Manter como esta -- se o protocolo contiver os dados, as secoes aparecem automaticamente. Isso significa que ao gerar/atualizar o protocolo do aluno no admin, os campos `lista_compras_semanal` e `substituicoes` devem ser incluidos.

- **Opcao B:** Adicionar um estado vazio ("Nenhuma lista de compras disponivel ainda") quando os dados nao existirem, para que o aluno saiba que o recurso existe.

Recomendo a **Opcao B** para melhor UX -- o aluno ve que o recurso existe mesmo antes do protocolo ser gerado.

### Resumo de Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/components/layout/ClientSidebar.tsx` | Adicionar item "Receitas" com icone ChefHat |
| `src/pages/Dashboard.tsx` | Adicionar "Receitas" ao quickAccess |
| `src/pages/Nutricao.tsx` | Adicionar empty states para lista de compras e substituicoes quando dados nao existirem |

### O que NAO muda

- Nenhuma logica de negocio alterada
- Nenhuma tabela do banco modificada
- Pagina de Receitas ja funciona 100% -- so precisa de link
- Codigo da lista de compras e substituicoes ja esta implementado

