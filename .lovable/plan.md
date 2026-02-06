

# Seleção em Lote + Alteração de Plano na Lista de Clientes

## Problema Identificado

Os filtros de engajamento (nunca acessou, sem protocolos, inativo 7/14/30d, gratuito expirado) e a coluna "Ultimo Acesso" ja estao implementados no codigo. Porem, falta a funcionalidade de **selecao em lote** para que voce consiga:

1. Filtrar clientes (ex: "Gratuito expirado 30d+")
2. Selecionar varios (ou todos) de uma vez
3. Aplicar uma acao em massa -- como alterar para plano pago

## O Que Sera Implementado

### 1. Checkboxes de Selecao na Tabela

- Adicionar checkbox no cabecalho da tabela para "selecionar todos" (da pagina filtrada)
- Adicionar checkbox em cada linha de cliente
- Contador visual: "X clientes selecionados"

### 2. Barra de Acoes em Lote

Quando houver clientes selecionados, aparece uma barra flutuante no topo/rodape com acoes:

| Acao | Descricao |
|------|-----------|
| Alterar para Plano Pago | Abre modal para escolher qual plano (Elite Fundador, Trimestral, Anual, etc.) |
| Pausar Selecionados | Pausa todos os clientes selecionados |
| Bloquear Selecionados | Bloqueia todos os selecionados |
| Reativar Selecionados | Reativa todos os selecionados |

### 3. Modal de Alteracao de Plano

Ao clicar "Alterar para Plano Pago":
- Mostra quantos clientes serao afetados
- Select para escolher o plano de destino (Elite Fundador, Mensal, Trimestral, Semestral, Anual)
- Confirmar com um botao claro
- Atualiza a subscription de cada cliente selecionado no banco

### 4. Verificacao dos Filtros no Preview

Tambem vou verificar se o preview esta renderizando os filtros corretamente. Se houver algum erro de compilacao ou import impedindo a visualizacao, sera corrigido.

---

## Detalhes Tecnicos

### Arquivo modificado

`src/pages/admin/AdminClientes.tsx`

### Novos estados

```text
selectedClients: Set<string>       -- IDs dos clientes marcados
showBatchPlanModal: boolean        -- controla modal de troca de plano
batchPlanTarget: string            -- plano escolhido para aplicar em lote
batchLoading: boolean              -- loading durante operacao em lote
```

### Logica de selecao

- "Selecionar todos" marca apenas os clientes da lista filtrada atual
- Limpar filtros ou mudar filtro limpa a selecao
- Desmarcar checkbox individual remove do Set

### Logica de alteracao de plano em lote

Para cada cliente selecionado:
1. Fazer upsert na tabela `subscriptions` com o novo `plan_type` e `status = 'active'`
2. Atualizar `entitlements` para `access_level = 'full'` se o plano for pago
3. Atualizar `profiles.client_status = 'active'`
4. Se tinha `access_blocked = true`, remover o bloqueio

Isso e feito via Promise.all para performance.

### Interface mobile

No layout mobile (cards), os checkboxes aparecem como circulo no canto esquerdo de cada card. A barra de acoes em lote fica fixa no rodape da tela.

### Ordem de execucao

1. Adicionar estados de selecao e barra de acoes em lote
2. Adicionar checkboxes na tabela desktop e nos cards mobile
3. Criar modal de alteracao de plano em lote
4. Implementar funcao de alteracao em massa no banco
5. Verificar e corrigir qualquer erro de renderizacao dos filtros existentes

