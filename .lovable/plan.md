  
sobre a exclusao dos clientes crie a função para que eu admin possa fazer isso, e escolher quem excluir, quem tirar ali, limpar e voce mantem eles na base de leads so eu limpo aqui manual  
  
Resposta rápida sobre a landing antiga

Sim, está preservada mas **desabilitada para usuários**. Ela continua acessível só por URL direta em `/landing-classica` — não há link, botão ou redirecionamento apontando para ela. Quem digita o domínio cai direto no Quiz. Posso remover essa rota completamente se preferir, ou deixar como backup.

---

## Plano: Excluir clientes da tela de clientes (sem perder no banco de leads)

### Como vai funcionar

Adicionar capacidade de **arquivar clientes** na tela `/admin/clientes`. Cliente arquivado:

- Some da lista de clientes ativos
- Não conta nas métricas do dashboard
- **Não é deletado** — vira lead histórico (preserva email, telefone, anamnese, histórico)
- Pode ser restaurado a qualquer momento via aba "Arquivados"

### Diagrama do fluxo

```text
Tela /admin/clientes
 ├─ Aba "Ativos" (default) ────────────── filtro: archived_at IS NULL
 │   └─ [Ações por linha] → Arquivar cliente
 │       └─ Modal confirma motivo: "Nunca acessou" / "Plano expirou" / "Inativo" / "Outro"
 │
 ├─ Aba "Arquivados" ───────────────────── filtro: archived_at IS NOT NULL
 │   └─ [Ações por linha] → Restaurar / Excluir permanentemente
 │
 └─ Seleção em lote (checkbox) → Arquivar vários de uma vez
```

### Mudanças no banco

**Migration nova** — adicionar 3 colunas em `profiles`:

- `archived_at timestamp with time zone` (null = ativo, preenchido = arquivado)
- `archived_reason text` (motivo do arquivamento)
- `archived_by uuid` (admin que arquivou)

Atualizar a função `recalculate_funnel_status` para retornar `'archived'` quando `archived_at IS NOT NULL`, garantindo que clientes arquivados não apareçam em métricas como "ativos", "engaged" ou "paying".

### Mudanças no código

**Editar `src/pages/admin/AdminClientes.tsx**`:

- Adicionar tabs "Ativos" / "Arquivados" no topo
- Adicionar botão "Arquivar" no menu de ações de cada linha (ícone Archive)
- Adicionar checkbox de seleção em lote + barra de ações em massa (reusar padrão `BatchActionsBar`)
- Filtrar query por `archived_at` conforme aba ativa
- Atualizar contadores do header ("Total: X ativos") para excluir arquivados

**Novo componente `src/components/admin/ArchiveClientModal.tsx**`:

- Modal de confirmação com select de motivo (Nunca acessou / Plano expirou / Inativo 90+ dias / Outro)
- Campo opcional de observação livre
- Suporta single ou batch (recebe array de IDs)

**Editar `src/pages/admin/AdminDashboard.tsx**`:

- Toda query de "clientes ativos", "total de alunos", métricas de engajamento → adicionar filtro `archived_at IS NULL`

**Editar `src/components/auth/SubscriptionGuard.tsx**` (preventivo):

- Se cliente arquivado tentar logar, redireciona para `/acesso-bloqueado` com mensagem "Conta arquivada — entre em contato com o suporte"

### Restaurar e excluir permanentemente

- **Restaurar**: limpa `archived_at`, `archived_reason`, `archived_by` → cliente volta para "Ativos"
- **Excluir permanentemente** (só na aba Arquivados): chama edge function `admin-delete-user` que já existe — apaga do `auth.users` e cascade pelas tabelas. Modal pede digitação do email do cliente para confirmar (proteção contra clique acidental).

### Resumo dos arquivos

- **Nova migration**: adicionar `archived_at`, `archived_reason`, `archived_by` em `profiles` + atualizar `recalculate_funnel_status`
- **Editar**: `src/pages/admin/AdminClientes.tsx` (tabs, ações, seleção em lote)
- **Editar**: `src/pages/admin/AdminDashboard.tsx` (filtrar arquivados das métricas)
- **Editar**: `src/components/auth/SubscriptionGuard.tsx` (bloquear login de arquivados)
- **Novo**: `src/components/admin/ArchiveClientModal.tsx`